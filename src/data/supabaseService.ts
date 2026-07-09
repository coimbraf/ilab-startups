// src/data/supabaseService.ts
import { createClient } from '@supabase/supabase-js';
import { Startup, StartupPost, StartupDocument, deliverableTypes, ForumPost, ForumComment } from './mockData';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ─── Startups ────────────────────────────────────────────────────────────────

export async function fetchStartupsFromSupabase(): Promise<Startup[]> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase
    .from('startups')
    .select(`*, startup_members(*, user_roles(academy_xp, forum_xp, attendance_xp)), startup_deliverables(*)`);

  if (error) throw error;

  return (data || []).map(mapStartup).sort((a, b) => b.totalScore - a.totalScore);
}

export async function fetchStartupById(id: string): Promise<Startup | null> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase
    .from('startups')
    .select(`*, startup_members(*, user_roles(academy_xp, forum_xp, attendance_xp)), startup_deliverables(*)`)
    .eq('id', id)
    .single();

  if (error) return null;
  return mapStartup(data);
}

export async function createStartup(payload: {
  name: string;
  description: string;
  shortPitch?: string;
  sector?: string;
  cohort?: string;
  leaderPhone?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  logoUrl?: string;
  coverImageUrl?: string;
}): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase
    .from('startups')
    .insert({
      name: payload.name,
      description: payload.description,
      short_pitch: payload.shortPitch,
      sector: payload.sector,
      cohort: payload.cohort,
      leader_phone: payload.leaderPhone,
      instagram_url: payload.instagramUrl,
      website_url: payload.websiteUrl,
      linkedin_url: payload.linkedinUrl,
      logo_url: payload.logoUrl,
      cover_image_url: payload.coverImageUrl,
      status: 'Pendente'
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateStartup(id: string, payload: Partial<{
  name: string;
  description: string;
  shortPitch: string;
  sector: string;
  cohort: string;
  leaderPhone: string;
  archived: boolean;
  instagramUrl: string;
  websiteUrl: string;
  linkedinUrl: string;
  pitchUrl: string;
  logoUrl: string;
  coverImageUrl: string;
  status: string;
}>) {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { error } = await supabase
    .from('startups')
    .update({
      name: payload.name,
      description: payload.description,
      short_pitch: payload.shortPitch,
      sector: payload.sector,
      cohort: payload.cohort,
      leader_phone: payload.leaderPhone,
      instagram_url: payload.instagramUrl,
      website_url: payload.websiteUrl,
      linkedin_url: payload.linkedinUrl,
      pitch_url: payload.pitchUrl,
      logo_url: payload.logoUrl,
      cover_image_url: payload.coverImageUrl,
      status: payload.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteMember(id: string) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function deleteStartup(id: string) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('startups').delete().eq('id', id);
  if (error) throw error;
}

// ─── Membros ─────────────────────────────────────────────────────────────────


export async function upsertStartupMember(startupId: string, member: {
  id?: string;
  name: string;
  role: string;
  customRole?: string;
  isLeader?: boolean;
}) {
  if (!supabase) throw new Error('Supabase não configurado.');

  if (member.id) {
    const { error } = await supabase
      .from('startup_members')
      .update({ name: member.name, role: member.role, custom_role: member.customRole, is_leader: member.isLeader })
      .eq('id', member.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('startup_members')
      .insert({ startup_id: startupId, name: member.name, role: member.role, custom_role: member.customRole, is_leader: member.isLeader || false });
    if (error) throw error;
  }
}

export async function deleteStartupMember(memberId: string) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('startup_members').delete().eq('id', memberId);
  if (error) throw error;
}

// ─── Founders (Gestão de Acesso) ─────────────────────────────────────────────

export async function getFounders(): Promise<Array<{
  id: string; email: string; name: string; startupId?: string; startupName?: string;
}>> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase
    .from('user_roles')
    .select(`id, startup_id, startups(name)`)
    .eq('role', 'founder');

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    email: '',
    name: '',
    startupId: r.startup_id,
    startupName: r.startups?.name
  }));
}

export async function createFounderAccount(email: string, password: string, startupId: string) {
  if (!supabase) throw new Error('Supabase não configurado.');

  // Cria o usuário via signUp (requer "Confirm email" desativado no painel Supabase)
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const userId = data.user?.id;
  if (!userId) throw new Error('Falha ao obter ID do usuário criado.');

  // Vincula como founder
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({ id: userId, role: 'founder', startup_id: startupId });

  if (roleError) throw roleError;
  return userId;
}

export async function linkFounderToStartup(userId: string, startupId: string) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase
    .from('user_roles')
    .upsert({ id: userId, role: 'founder', startup_id: startupId });
  if (error) throw error;
}

export async function getFoundersByStartup(startupId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('user_roles')
    .select('id, name, email')
    .eq('role', 'founder')
    .eq('startup_id', startupId);

  if (error) {
    console.error('Error fetching startup founders', error);
    return [];
  }
  return data || [];
}

export async function unlinkFounderFromStartup(userId: string) {
  if (!supabase) throw new Error('Supabase não configurado.');
  
  // 1. Descobrir de qual startup ele era e qual seu nome
  const { data: user } = await supabase
    .from('user_roles')
    .select('startup_id, name')
    .eq('id', userId)
    .single();

  if (user && user.startup_id && user.name) {
    // 2. Apagar o "card" (registro) dele na tabela startup_members
    await supabase
      .from('startup_members')
      .delete()
      .eq('startup_id', user.startup_id)
      .ilike('name', user.name); // ilike para ignorar case sensitivity
  }

  // 3. Remover o vinculo na tabela user_roles
  const { error } = await supabase
    .from('user_roles')
    .update({ startup_id: null })
    .eq('id', userId);
  
  if (error) throw error;
}

export async function getAvailableFounders() {
  if (!supabase) return [];
  // Founders without a startup_id
  const { data, error } = await supabase
    .from('user_roles')
    .select('id, name, email')
    .eq('role', 'founder')
    .is('startup_id', null);

  if (error) {
    console.error('Error fetching available founders', error);
    return [];
  }
  return data || [];
}

export async function inviteUserToStartup(userId: string, startupId: string, startupName: string) {
  if (!supabase) return;

  const { error } = await supabase.from('squad_invites').insert({
    user_id: userId,
    startup_id: startupId,
    startup_name: startupName,
    status: 'pending'
  });

  if (error) throw error;

  await createNotification(
    userId,
    'Convite para Squad!',
    `Você foi convidado pela coordenação para integrar o squad da startup ${startupName}.`,
    'squad_invite',
    '/' // Redirects to home to accept/reject
  );
}

export async function getUserSquadInvites(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('squad_invites')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending');
  if (error) return [];
  return data || [];
}

export async function respondToSquadInvite(inviteId: string, accept: boolean, userId: string, startupId: string, userName: string, userTrack: string) {
  if (!supabase) throw new Error('Supabase não configurado');

  // Update invite status
  const { error } = await supabase
    .from('squad_invites')
    .update({ status: accept ? 'accepted' : 'rejected' })
    .eq('id', inviteId);
  
  if (error) throw error;

  if (accept) {
    // 1. Update user_roles
    const { error: roleError } = await supabase.from('user_roles').update({ startup_id: startupId }).eq('id', userId);
    if (roleError) throw roleError;
    
    // 2. Add to startup_members
    const { error: insertError } = await supabase.from('startup_members').insert({
      startup_id: startupId,
      name: userName, // Ideally this comes from the auth context
      role: userTrack, // Default to their track
      is_leader: false
    });
    
    if (insertError) {
      console.error('Erro ao inserir em startup_members:', insertError);
      throw new Error('Falha ao ingressar no squad: ' + insertError.message);
    }
  }
}

// ─── Entregáveis ─────────────────────────────────────────────────────────────

export async function getPendingDeliverables() {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase
    .from('startup_deliverables')
    .select('*, startups(id, name)')
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((d: any) => ({
    id: d.id,
    startupId: d.startup_id,
    startupName: d.startups?.name || 'Desconhecida',
    typeId: d.type_id,
    typeInfo: deliverableTypes ? deliverableTypes[d.type_id] : null,
    status: d.status,
    evidenceUrl: d.evidence_url,
    description: d.description,
    submittedAt: d.submitted_at,
  }));
}

export async function submitDeliverable(startupId: string, typeId: string, evidenceUrl: string, description: string) {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { error } = await supabase
    .from('startup_deliverables')
    .upsert({
      startup_id: startupId,
      type_id: typeId,
      evidence_url: evidenceUrl,
      description,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      xp_earned: 0
    }, { onConflict: 'startup_id,type_id' });

  if (error) throw error;
}

export async function reviewDeliverable(
  startupId: string, typeId: string, status: 'approved' | 'rejected',
  notes: string, xpValue: number, adminName: string
) {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { error } = await supabase
    .from('startup_deliverables')
    .update({
      status,
      evidence_notes: notes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminName,
      xp_earned: status === 'approved' ? xpValue : 0
    })
    .match({ startup_id: startupId, type_id: typeId });

  if (error) throw error;

  // Notification trigger
  if (status === 'approved') {
    await notifyStartupMembers(startupId, 'Entregável Aprovado', `A submissão do entregável foi validada pelo admin (${adminName}) e o seu squad ganhou +${xpValue} XP.`, 'deliverable_approved', `/startup/${startupId}`);
  } else if (status === 'rejected') {
    await notifyStartupMembers(startupId, 'Entregável Rejeitado', `A submissão foi rejeitada com a seguinte observação: "${notes}". Por favor, revisem e enviem novamente.`, 'deliverable_rejected', `/startup/${startupId}`);
  }
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function getPosts(startupId?: string): Promise<StartupPost[]> {
  if (!supabase) throw new Error('Supabase não configurado.');

  let query = supabase.from('startup_posts').select('*').order('created_at', { ascending: false });
  if (startupId) query = query.eq('startup_id', startupId);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(mapPost);
}

export async function getAllPosts(): Promise<Array<StartupPost & { startupName: string }>> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase
    .from('startup_posts')
    .select(`*, startups(name)`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((p: any) => ({ ...mapPost(p), startupName: p.startups?.name || '' }));
}

export async function createPost(post: {
  startupId: string;
  authorId: string;
  title: string;
  body: string;
  coverImageUrl?: string;
  tags: string[];
}): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase
    .from('startup_posts')
    .insert({
      startup_id: post.startupId,
      author_id: post.authorId,
      title: post.title,
      body: post.body,
      cover_image_url: post.coverImageUrl,
      tags: post.tags,
      is_published: true
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updatePost(id: string, payload: Partial<{
  title: string; body: string; coverImageUrl: string; tags: string[]; isPublished: boolean;
}>) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase
    .from('startup_posts')
    .update({ title: payload.title, body: payload.body, cover_image_url: payload.coverImageUrl, tags: payload.tags, is_published: payload.isPublished, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deletePost(id: string) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('startup_posts').delete().eq('id', id);
  if (error) throw error;
}

// ─── Fórum ───────────────────────────────────────────────────────────────────

export async function getForumPosts(): Promise<ForumPost[]> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase
    .from('forum_posts')
    .select(`
      id, title, body, author_id, author_name, author_role, 
      startup_id, startup_name, created_at, upvotes, tags, category,
      forum_comments(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Erro ao buscar posts do fórum, retornando dados mockados.', error);
    // Fallback temporário para desenvolvimento caso a tabela não exista
    const { mockForumPosts } = await import('./mockData');
    return mockForumPosts;
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    authorId: p.author_id,
    authorName: p.author_name,
    authorRole: p.author_role,
    startupId: p.startup_id,
    startupName: p.startup_name,
    createdAt: p.created_at,
    upvotes: p.upvotes || 0,
    commentsCount: p.forum_comments?.[0]?.count || 0,
    tags: p.tags || [],
    category: p.category || 'Geral'
  }));
}

export async function getForumPostById(id: string, userId?: string): Promise<ForumPost | null> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase
    .from('forum_posts')
    .select(`
      id, title, body, author_id, author_name, author_role, 
      startup_id, startup_name, created_at, upvotes, tags, category,
      forum_comments(id, post_id, author_id, author_name, body, created_at)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.warn('Erro ao buscar post do fórum, retornando dados mockados.', error);
    const { mockForumPosts } = await import('./mockData');
    return mockForumPosts.find(p => p.id === id) || null;
  }

  let userHasVoted = false;
  if (userId) {
    const { data: voteData } = await supabase
      .from('forum_post_votes')
      .select('post_id')
      .eq('post_id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (voteData) userHasVoted = true;
  }

  return {
    id: data.id,
    title: data.title,
    body: data.body,
    authorId: data.author_id,
    authorName: data.author_name,
    authorRole: data.author_role,
    startupId: data.startup_id,
    startupName: data.startup_name,
    createdAt: data.created_at,
    upvotes: data.upvotes || 0,
    commentsCount: data.forum_comments?.length || 0,
    tags: data.tags || [],
    category: data.category || 'Geral',
    userHasVoted,
    comments: (data.forum_comments || []).map((c: any) => ({
      id: c.id,
      postId: c.post_id,
      authorId: c.author_id,
      authorName: c.author_name,
      body: c.body,
      createdAt: c.created_at
    })).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  };
}

export async function createForumPost(post: {
  title: string; body: string; authorId: string; authorName: string;
  authorRole?: string; startupId?: string; startupName?: string; tags: string[]; category: string;
}): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase
    .from('forum_posts')
    .insert({
      title: post.title,
      body: post.body,
      author_id: post.authorId,
      author_name: post.authorName,
      author_role: post.authorRole,
      startup_id: post.startupId,
      startup_name: post.startupName,
      tags: post.tags,
      category: post.category,
      upvotes: 0
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function createForumComment(comment: {
  postId: string; authorId: string; authorName: string; body: string;
}): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase
    .from('forum_comments')
    .insert({
      post_id: comment.postId,
      author_id: comment.authorId,
      author_name: comment.authorName,
      body: comment.body
    })
    .select('id')
    .single();

  if (error) throw error;

  // Notification trigger (notify author of the post)
  const { data: postData } = await supabase.from('forum_posts').select('author_id, title').eq('id', comment.postId).single();
  if (postData && postData.author_id !== comment.authorId) {
    await createNotification(
      postData.author_id,
      'Nova Resposta no Fórum',
      `${comment.authorName} respondeu ao seu tópico: "${postData.title}".`,
      'forum_reply',
      `/forum/${comment.postId}`
    );
  }

  return data.id;
}

export async function updateForumPost(postId: string, title: string, body: string, category: string) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase
    .from('forum_posts')
    .update({ title, body, category })
    .eq('id', postId);
  if (error) throw error;
}

export async function deleteForumPost(postId: string) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase
    .from('forum_posts')
    .delete()
    .eq('id', postId);
  if (error) throw error;
}

export async function toggleForumPostVote(postId: string, userId: string): Promise<boolean> {
  if (!supabase) throw new Error('Supabase não configurado.');

  // Voto atômico no servidor (RPC security definer — ver supabase/rpc.sql).
  // A recontagem de upvotes acontece lá; o cliente nunca escreve a contagem.
  const { data: added, error } = await supabase.rpc('toggle_forum_vote', { p_post_id: postId });
  if (error) throw error;

  if (added) {
    // Notification trigger (apenas quando o voto foi adicionado)
    const { data: postData } = await supabase.from('forum_posts').select('author_id, title').eq('id', postId).single();
    if (postData && postData.author_id !== userId) {
      // Pega o nome de quem deu upvote pra ficar mais legal
      const { data: voterData } = await supabase.from('user_roles').select('startups(name)').eq('id', userId).single();
      const voterName = (voterData?.startups as any)?.name || 'Alguém';

      await createNotification(
        postData.author_id,
        'Novo Upvote!',
        `${voterName} curtiu o seu tópico: "${postData.title}".`,
        'forum_upvote',
        `/forum/${postId}`
      );
    }
  }

  return !!added;
}

// ─── Documentos ──────────────────────────────────────────────────────────────

export async function getDocuments(startupId: string, typeId?: string): Promise<StartupDocument[]> {
  if (!supabase) throw new Error('Supabase não configurado.');

  let query = supabase.from('startup_documents').select('*').eq('startup_id', startupId).order('created_at', { ascending: false });
  if (typeId) query = query.eq('deliverable_type_id', typeId);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(mapDocument);
}

export async function createDocument(doc: {
  startupId: string; deliverableTypeId?: string; name: string;
  fileUrl: string; fileType: string; description?: string; uploadedBy?: string; fileSizeBytes?: number;
}) {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { error } = await supabase.from('startup_documents').insert({
    startup_id: doc.startupId,
    deliverable_type_id: doc.deliverableTypeId || null,
    name: doc.name,
    file_url: doc.fileUrl,
    file_type: doc.fileType,
    description: doc.description,
    uploaded_by: doc.uploadedBy,
    file_size_bytes: doc.fileSizeBytes
  });

  if (error) throw error;
}

export async function deleteDocument(id: string) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('startup_documents').delete().eq('id', id);
  if (error) throw error;
}

// ─── Upload de Arquivos (Supabase Storage) ────────────────────────────────────

export async function uploadFile(
  bucket: 'startup-media' | 'startup-docs',
  path: string,
  file: File
): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

// ─── Mappers Internos ─────────────────────────────────────────────────────────

function mapStartup(s: any): Startup {
  return {
    id: s.id,
    name: s.name,
    description: s.description || '',
    logoUrl: s.logo_url,
    coverImageUrl: s.cover_image_url,
    shortPitch: s.short_pitch,
    sector: s.sector,
    websiteUrl: s.website_url,
    linkedinUrl: s.linkedin_url,
    pitchUrl: s.pitch_url,
    cohort: s.cohort,
    leaderPhone: s.leader_phone,
    instagramUrl: s.instagram_url,
    totalScore: (s.startup_deliverables || [])
      .filter((d: any) => d.status === 'approved')
      .reduce((sum: number, d: any) => sum + (d.xp_earned || 0), 0),
    status: s.status || 'Pendente',
    members: (s.startup_members || []).map((m: any) => ({
      id: m.id, name: m.name, role: m.role,
      customRole: m.custom_role, isLeader: m.is_leader, avatarUrl: m.avatar_url, academyXp: m.user_roles?.academy_xp || 0, forumXp: m.user_roles?.forum_xp || 0, attendanceXp: m.user_roles?.attendance_xp || 0
    })),
    deliverables: (s.startup_deliverables || []).map((d: any) => ({
      id: d.id, typeId: d.type_id, status: d.status,
      evidenceUrl: d.evidence_url, evidenceNotes: d.evidence_notes,
      description: d.description, submittedAt: d.submitted_at,
      reviewedAt: d.reviewed_at, reviewedBy: d.reviewed_by,
      xpEarned: d.xp_earned, type: deliverableTypes[d.type_id]
    }))
  };
}

function mapPost(p: any): StartupPost {
  return {
    id: p.id, startupId: p.startup_id, authorId: p.author_id,
    title: p.title, body: p.body, coverImageUrl: p.cover_image_url,
    tags: p.tags || [], isPublished: p.is_published,
    createdAt: p.created_at, updatedAt: p.updated_at
  };
}

function mapDocument(d: any): StartupDocument {
  return {
    id: d.id, startupId: d.startup_id, deliverableTypeId: d.deliverable_type_id,
    name: d.name, fileUrl: d.file_url, fileType: d.file_type,
    fileSizeBytes: d.file_size_bytes, description: d.description,
    uploadedBy: d.uploaded_by, createdAt: d.created_at
  };
}

// ─── Encontros ──────────────────────────────────────────────────────────────

export async function getMeetings() {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.warn('Erro ao buscar encontros. Retornando vazio.', error);
    return [];
  }

  return (data || []).map((m: any) => ({
    id: m.id,
    title: m.title,
    date: m.date,
    description: m.description,
    status: m.status,
    guest: m.guest,
    createdAt: m.created_at
  }));
}

export async function createMeeting(meeting: {
  title: string; date: string; description: string; status: string; guest?: string;
}) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error, data } = await supabase.from('meetings').insert(meeting).select().single();
  if (error) throw error;

  // Notifica todo mundo sobre o novo encontro
  if (data) {
    await notifyAllUsers('Novo Encontro Marcado', `A coordenação adicionou o encontro: ${meeting.title}. Acesse para ver a data.`, 'new_meeting', '/encontros');
  }
}

export async function updateMeeting(id: string, meeting: {
  title: string; date: string; description: string; status: string; guest?: string;
}) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('meetings').update(meeting).eq('id', id);
  if (error) throw error;
}

export async function deleteMeeting(id: string) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('meetings').delete().eq('id', id);
  if (error) throw error;
}

// ─── Convites (Invites) ──────────────────────────────────────────────────────

export async function getInvites() {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase.from('invites').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createInvite(maxUses: number, daysValid: number) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysValid);

  const { error } = await supabase.from('invites').insert({
    code,
    max_uses: maxUses,
    used_count: 0,
    expires_at: expiresAt.toISOString(),
    active: true
  });
  if (error) throw error;
}

export async function invalidateInvite(id: string) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('invites').update({ active: false }).eq('id', id);
  if (error) throw error;
}

export async function validateInviteCode(code: string): Promise<{ valid: boolean; reason?: string; inviteId?: string }> {
  if (!supabase) throw new Error('Supabase não configurado.');

  // A tabela `invites` é fechada por RLS. A validação pré-cadastro (anon)
  // roda via RPC security definer que só devolve o necessário
  // (ver supabase/rpc.sql — validate_invite).
  const { data, error } = await supabase.rpc('validate_invite', { p_code: code });
  if (error) return { valid: false, reason: 'Erro ao validar convite.' };

  return { valid: !!data?.valid, reason: data?.reason, inviteId: data?.invite_id };
}

export async function registerWithInvitePayload(payload: {
  code: string; email: string; password: string; name: string; track: string;
}) {
  if (!supabase) throw new Error('Supabase não configurado.');

  const validation = await validateInviteCode(payload.code);
  if (!validation.valid || !validation.inviteId) throw new Error(validation.reason || 'Convite inválido.');

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.name,
        track: payload.track
      }
    }
  });

  if (authError) throw authError;
  const userId = authData.user?.id;
  if (!userId) throw new Error('Erro ao criar usuário.');

  const { error: roleError } = await supabase.from('user_roles').insert({
    id: userId,
    role: 'founder',
    track: payload.track
  });
  if (roleError) throw roleError;

  // Consumo atômico do convite (com revalidação server-side — ver rpc.sql).
  // Sem fallback de update direto: a tabela invites é fechada por RLS.
  const { error: inviteError } = await supabase.rpc('increment_invite_usage', { invite_id: validation.inviteId });
  if (inviteError) throw inviteError;
}

// ─── Notificações ────────────────────────────────────────────────────────────

export async function getNotifications(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('Error fetching notifications', error);
    return [];
  }
  return data || [];
}

export async function markNotificationRead(id: string) {
  if (!supabase) return;
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

export async function markAllNotificationsRead(userId: string) {
  if (!supabase) return;
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  if (!supabase) return;
  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    link,
    is_read: false
  });
}

// Help function to notify all users of a startup
export async function notifyStartupMembers(startupId: string, title: string, message: string, type: string, link?: string) {
  if (!supabase) return;
  // Get all founders of this startup
  const { data: users } = await supabase.from('user_roles').select('id').eq('startup_id', startupId);
  if (users) {
    const notifications = users.map(u => ({
      user_id: u.id,
      title,
      message,
      type,
      link,
      is_read: false
    }));
    await supabase.from('notifications').insert(notifications);
  }
}

// Notify all users
export async function notifyAllUsers(title: string, message: string, type: string, link?: string) {
  if (!supabase) return;
  const { data: users } = await supabase.from('user_roles').select('id');
  if (users) {
    const notifications = users.map(u => ({
      user_id: u.id,
      title,
      message,
      type,
      link,
      is_read: false
    }));
    await supabase.from('notifications').insert(notifications);
  }
}

// ─── Aulas (Lessons) ─────────────────────────────────────────────────────────

export async function getLessons() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('aulas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching lessons', error);
    return [];
  }
  return data || [];
}

export async function createLesson(lesson: {
  title: string; description: string; youtube_id: string; duration: string;
  type?: 'gravacao' | 'externo'; level?: string; xp?: number; tags?: string[];
}) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('aulas').insert(lesson);
  if (error) throw error;
}

export async function updateLesson(id: string, lesson: {
  title: string; description: string; youtube_id: string; duration: string;
  type?: 'gravacao' | 'externo'; level?: string; xp?: number; tags?: string[];
}) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('aulas').update(lesson).eq('id', id);
  if (error) throw error;
}

export async function deleteLesson(id: string) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('aulas').delete().eq('id', id);
  if (error) throw error;
}

// ─── Progresso da Aula ────────────────────────────────────────────────────────
export async function getLessonProgress() {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('aula_progress')
    .select('aula_id, completed')
    .eq('user_id', user.id);
    
  if (error) {
    console.error('Erro ao buscar progresso:', error);
    return [];
  }
  return data || [];
}

export async function markLessonCompleted(aulaId: string): Promise<number> {
  if (!supabase) return 0;

  // XP transacional no servidor (RPC security definer — ver supabase/rpc.sql).
  // O valor do XP vem da tabela `aulas`, nunca do cliente. Idempotente.
  const { data: xpGranted, error } = await supabase.rpc('complete_lesson', { p_aula_id: aulaId });
  if (error) {
    console.error('Erro ao salvar progresso:', error);
    return 0;
  }
  return xpGranted || 0;
}


export async function getAllMembers() {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase
    .from('user_roles')
    .select('*, startups(name)')
    .eq('role', 'founder');
  if (error) throw error;
  return data || [];
}

export async function updateMemberStatus(id: string, status: 'active' | 'inactive') {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase
    .from('startup_members')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

// ─── Whitelist ───────────────────────────────────────────────────────────────

export async function getWhitelist() {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase.from('email_whitelist').select('*').order('added_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addWhitelistEmails(emails: string[]) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const inserts = emails.map(email => ({ email: email.toLowerCase() }));
  const { error } = await supabase.from('email_whitelist').upsert(inserts, { onConflict: 'email' });
  if (error) throw error;
}

export async function removeWhitelistEmail(email: string) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('email_whitelist').delete().eq('email', email.toLowerCase());
  if (error) throw error;
}

export async function getAllUserEmails(): Promise<string[]> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase.from('user_roles').select('email');
  if (error) throw error;
  return (data || []).map((u: any) => u.email?.toLowerCase()).filter(Boolean);
}

export async function checkEmailWhitelisted(email: string): Promise<boolean> {
  if (!supabase) throw new Error('Supabase não configurado.');

  // A tabela email_whitelist é fechada por RLS — a checagem pré-cadastro
  // roda via RPC que não expõe a lista (ver supabase/rpc.sql).
  const { data, error } = await supabase.rpc('is_email_whitelisted', { p_email: email });
  if (error) throw error;
  return !!data;
}

export async function getMeetingPresences(meetingId: string) {
  if (!supabase) return [];
  const { data } = await supabase.from('meeting_presences').select('user_id').eq('meeting_id', meetingId);
  return (data || []).map(row => row.user_id);
}

export async function markMeetingPresence(meetingId: string, userId: string, present: boolean) {
  if (!supabase) return;

  // Presença + XP (±100) numa transação só, admin-only no servidor
  // (RPC security definer — ver supabase/rpc.sql). Substitui o antigo
  // addEngagementXp feito no cliente.
  const { error } = await supabase.rpc('set_meeting_presence', {
    p_meeting_id: meetingId,
    p_user_id: userId,
    p_present: present
  });
  if (error) throw error;
}

// ==========================================
// COURSES (PLAYLISTS)
// ==========================================

export async function getCourses() {
  if (!supabase) return [];
  const { data } = await supabase.from('courses').select('*, episodes:course_episodes(*)').order('created_at', { ascending: false });
  return data || [];
}

export async function getCourseById(id: string) {
  if (!supabase) return null;
  const { data } = await supabase.from('courses').select('*, episodes:course_episodes(*)').eq('id', id).single();
  if (data && data.episodes) {
    data.episodes.sort((a: any, b: any) => a.order_index - b.order_index);
  }
  return data;
}

export async function createCourse(playlistUrl: string, level: 'iniciante' | 'intermediario' | 'avancado', bonusXp: number) {
  if (!supabase) return;

  // A importação roda na Edge Function `import-playlist` — a chave da
  // YouTube Data API fica em secret no servidor e NUNCA trafega pelo cliente.
  // Ver supabase/functions/import-playlist/index.ts.
  const { data, error } = await supabase.functions.invoke('import-playlist', {
    body: { playlistUrl, level, bonusXp }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function deleteCourse(id: string) {
  if (!supabase) return;
  await supabase.from('courses').delete().eq('id', id);
}

export async function getCourseProgress() {
  if (!supabase) return [];
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) return [];
  
  const { data } = await supabase.from('course_episode_progress')
    .select('episode_id')
    .eq('user_id', session.session.user.id)
    .eq('completed', true);
  
  return (data || []).map((row: any) => row.episode_id);
}

export async function markCourseEpisodeCompleted(episodeId: string): Promise<{ episodeXp: number; bonusXp: number }> {
  if (!supabase) return { episodeXp: 0, bonusXp: 0 };

  // XP do episódio + bônus de conclusão numa transação só no servidor
  // (RPC security definer — ver supabase/rpc.sql). Valores vêm do banco.
  const { data, error } = await supabase.rpc('complete_course_episode', { p_episode_id: episodeId });
  if (error) {
    console.error('Erro ao salvar progresso do episódio:', error);
    return { episodeXp: 0, bonusXp: 0 };
  }
  return { episodeXp: data?.episode_xp || 0, bonusXp: data?.bonus_xp || 0 };
}
