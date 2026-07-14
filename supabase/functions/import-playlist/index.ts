// ============================================================================
// SANFRAN iLAB — Edge Function: import-playlist
// Importa uma playlist do YouTube como curso, no servidor.
// A chave da YouTube Data API v3 fica em secret — NUNCA trafega pelo cliente.
//
// Deploy:
//   supabase functions deploy import-playlist
//   supabase secrets set YOUTUBE_API_KEY=AIzaSy...
//
// Chamada (front): supabase.functions.invoke('import-playlist', {
//   body: { playlistUrl, level, bonusXp }
// })
// Requer JWT de um usuário ADMIN (validado aqui via user_roles).
// ============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

type Level = 'iniciante' | 'intermediario' | 'avancado';

const YT = 'https://www.googleapis.com/youtube/v3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function parseDuration(pt: string): number {
  const m = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 1;
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  const total = h * 60 + min + (s > 30 ? 1 : 0);
  return total === 0 ? 1 : total;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) return json(500, { error: 'YOUTUBE_API_KEY não configurada (supabase secrets set).' });

    // ── Autorização: só admin ────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json(401, { error: 'Não autenticado.' });

    const { data: role } = await userClient
      .from('user_roles').select('role').eq('id', user.id).single();
    if (role?.role !== 'admin') return json(403, { error: 'Apenas administradores importam playlists.' });

    // ── Payload ──────────────────────────────────────────────────────────
    const { playlistUrl, level, bonusXp } = await req.json() as {
      playlistUrl: string; level: Level; bonusXp: number;
    };
    if (!playlistUrl) return json(400, { error: 'playlistUrl é obrigatório.' });

    let playlistId = playlistUrl;
    const match = playlistUrl.match(/[?&]list=([^&]+)/);
    if (match) playlistId = match[1];

    // ── YouTube: metadados da playlist ──────────────────────────────────
    const plRes = await fetch(`${YT}/playlists?part=snippet&id=${playlistId}&key=${apiKey}`);
    const plData = await plRes.json();
    if (!plData.items?.length) return json(404, { error: 'Playlist não encontrada.' });
    const title: string = plData.items[0].snippet.title;
    const description: string = plData.items[0].snippet.description || '';

    // ── YouTube: itens (paginado) ────────────────────────────────────────
    let items: any[] = [];
    let pageToken = '';
    do {
      const res = await fetch(
        `${YT}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`,
      );
      const data = await res.json();
      items = items.concat(data.items || []);
      pageToken = data.nextPageToken || '';
    } while (pageToken);

    // ── YouTube: durações (lotes de 50) ──────────────────────────────────
    const videoIds: string[] = items.map((i) => i.contentDetails.videoId);
    const durations: Record<string, string> = {};
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50).join(',');
      const res = await fetch(`${YT}/videos?part=contentDetails&id=${batch}&key=${apiKey}`);
      const data = await res.json();
      for (const v of data.items || []) durations[v.id] = v.contentDetails.duration;
    }

    // ── Inserção com service role (bypassa RLS de forma controlada) ─────
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: course, error: courseErr } = await admin
      .from('courses')
      .insert({ title, description, playlist_id: playlistId, level, bonus_xp: bonusXp })
      .select()
      .single();
    if (courseErr) return json(500, { error: courseErr.message });

    const multiplier = level === 'avancado' ? 3 : level === 'intermediario' ? 2 : 1;
    const episodes = items.map((item, idx) => {
      const vId = item.contentDetails.videoId;
      const mins = parseDuration(durations[vId] || 'PT5M');
      return {
        course_id: course.id,
        title: item.snippet.title,
        description: item.snippet.description || '',
        youtube_id: vId,
        duration_minutes: mins,
        xp: mins * multiplier,
        order_index: idx,
      };
    });

    if (episodes.length > 0) {
      const { error: epErr } = await admin.from('course_episodes').insert(episodes);
      if (epErr) return json(500, { error: epErr.message });
    }

    return json(200, { courseId: course.id, title, episodes: episodes.length });
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
