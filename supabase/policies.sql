-- ============================================================================
-- SANFRAN iLAB — ROW-LEVEL SECURITY (RLS)
-- Fase 1 do hardening. Aplicar no SQL Editor do Supabase (uma vez).
--
-- PRINCÍPIOS:
--   1. A anon key está no bundle do front — RLS é a ÚNICA autorização real.
--   2. Escritas sensíveis (XP, votos, convites) NÃO passam por tabela direta:
--      acontecem via funções SECURITY DEFINER em rpc.sql (bypassa RLS de
--      forma controlada e transacional).
--   3. O guard de admin na UI (AdminPanel.tsx) é só UX; quem manda é isto aqui.
--
-- ORDEM: rode este arquivo ANTES de rpc.sql.
-- ============================================================================

-- ─── Helper: é admin? ────────────────────────────────────────────────────────
-- SECURITY DEFINER para não recursionar com a RLS de user_roles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from user_roles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Startup do usuário logado (ou null)
create or replace function public.my_startup_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select startup_id from user_roles where id = auth.uid();
$$;

-- ─── Habilitar RLS em tudo ───────────────────────────────────────────────────
alter table startups                 enable row level security;
alter table startup_members          enable row level security;
alter table startup_deliverables     enable row level security;
alter table startup_posts            enable row level security;
alter table startup_documents        enable row level security;
alter table user_roles               enable row level security;
alter table squad_invites            enable row level security;
alter table forum_posts              enable row level security;
alter table forum_comments           enable row level security;
alter table forum_post_votes         enable row level security;
alter table meetings                 enable row level security;
alter table meeting_presences        enable row level security;
alter table invites                  enable row level security;
alter table notifications            enable row level security;
alter table aulas                    enable row level security;
alter table aula_progress            enable row level security;
alter table courses                  enable row level security;
alter table course_episodes          enable row level security;
alter table course_episode_progress  enable row level security;
alter table course_completions       enable row level security;
alter table email_whitelist          enable row level security;

-- ============================================================================
-- STARTUPS — leitura para logados; escrita só admin.
-- XP (academy_xp etc.) é atualizado APENAS pelas RPCs security definer.
-- Se o FounderPanel voltar a existir (Fase 2), criar RPC de edição de perfil
-- com colunas permitidas explícitas — NUNCA update direto pelo founder
-- (senão ele edita o próprio academy_xp).
-- ============================================================================
create policy "startups: leitura autenticada"
  on startups for select to authenticated using (true);

create policy "startups: admin escreve"
  on startups for all to authenticated
  using (is_admin()) with check (is_admin());

-- ============================================================================
-- STARTUP_MEMBERS — leitura logada; escrita admin.
-- (o insert de membro ao aceitar squad invite acontece via RPC definer)
-- ============================================================================
create policy "members: leitura autenticada"
  on startup_members for select to authenticated using (true);

create policy "members: admin escreve"
  on startup_members for all to authenticated
  using (is_admin()) with check (is_admin());

-- ============================================================================
-- STARTUP_DELIVERABLES — founder submete pela própria startup (sem se
-- auto-aprovar nem se auto-dar XP); admin faz tudo (aprovar/rejeitar).
-- ============================================================================
create policy "deliverables: leitura autenticada"
  on startup_deliverables for select to authenticated using (true);

create policy "deliverables: founder submete na própria startup"
  on startup_deliverables for insert to authenticated
  with check (
    startup_id = my_startup_id()
    and status = 'submitted'
    and coalesce(xp_earned, 0) = 0
  );

create policy "deliverables: founder reenvia na própria startup"
  on startup_deliverables for update to authenticated
  using (startup_id = my_startup_id())
  with check (
    startup_id = my_startup_id()
    and status = 'submitted'          -- só pode voltar para "em análise"
    and coalesce(xp_earned, 0) = 0    -- nunca escreve XP
  );

create policy "deliverables: admin tudo"
  on startup_deliverables for all to authenticated
  using (is_admin()) with check (is_admin());

-- ============================================================================
-- USER_ROLES — leitura logada (ranking precisa dos XPs individuais).
-- Insert: só a própria linha e NUNCA como admin (anti-escalada no cadastro).
-- Update/Delete: só admin. XP individual muda apenas via RPC definer.
-- ============================================================================
create policy "user_roles: leitura autenticada"
  on user_roles for select to authenticated using (true);

create policy "user_roles: insere a própria linha (não-admin)"
  on user_roles for insert to authenticated
  with check (id = auth.uid() and role <> 'admin');

create policy "user_roles: admin escreve"
  on user_roles for update to authenticated
  using (is_admin()) with check (is_admin());

create policy "user_roles: admin deleta"
  on user_roles for delete to authenticated
  using (is_admin());

-- ============================================================================
-- SQUAD_INVITES — usuário vê/responde os próprios; admin cria e gerencia.
-- ============================================================================
create policy "squad_invites: vê os próprios"
  on squad_invites for select to authenticated
  using (user_id = auth.uid() or is_admin());

create policy "squad_invites: admin cria"
  on squad_invites for insert to authenticated
  with check (is_admin());

create policy "squad_invites: responde o próprio"
  on squad_invites for update to authenticated
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

-- ============================================================================
-- FÓRUM — leitura logada; autor gerencia o próprio conteúdo; admin modera.
-- upvotes na tabela forum_posts NÃO são editáveis pelo cliente:
-- só via RPC toggle_forum_vote (rpc.sql).
-- ============================================================================
create policy "forum_posts: leitura autenticada"
  on forum_posts for select to authenticated using (true);

create policy "forum_posts: cria como si mesmo"
  on forum_posts for insert to authenticated
  with check (author_id = auth.uid() and coalesce(upvotes, 0) = 0);

create policy "forum_posts: autor ou admin edita"
  on forum_posts for update to authenticated
  using (author_id = auth.uid() or is_admin())
  with check (author_id = auth.uid() or is_admin());

-- Privilégio de COLUNA: a policy acima filtra linhas, não colunas — sem isto
-- o autor conseguia editar upvotes do próprio post (brecha achada em teste).
-- A RPC toggle_forum_vote (security definer) segue escrevendo upvotes.
revoke update on forum_posts from authenticated;
grant update (title, body, category, tags) on forum_posts to authenticated;

create policy "forum_posts: autor ou admin deleta"
  on forum_posts for delete to authenticated
  using (author_id = auth.uid() or is_admin());

create policy "forum_comments: leitura autenticada"
  on forum_comments for select to authenticated using (true);

create policy "forum_comments: comenta como si mesmo"
  on forum_comments for insert to authenticated
  with check (author_id = auth.uid());

create policy "forum_comments: autor ou admin deleta"
  on forum_comments for delete to authenticated
  using (author_id = auth.uid() or is_admin());

-- Votos: tabela fechada — só a RPC (definer) mexe.
create policy "forum_post_votes: leitura autenticada"
  on forum_post_votes for select to authenticated using (true);
-- (sem policy de insert/delete = ninguém escreve direto)

-- ============================================================================
-- MEETINGS / PRESENÇAS — leitura logada; escrita admin.
-- Presença (com XP) só via RPC set_meeting_presence.
-- ============================================================================
create policy "meetings: leitura autenticada"
  on meetings for select to authenticated using (true);

create policy "meetings: admin escreve"
  on meetings for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "meeting_presences: leitura autenticada"
  on meeting_presences for select to authenticated using (true);
-- (sem policy de escrita = só a RPC definer)

-- ============================================================================
-- INVITES — fechado. Validação pré-cadastro via RPC validate_invite (anon),
-- consumo via increment_invite_usage. Admin gerencia.
-- ============================================================================
create policy "invites: admin tudo"
  on invites for all to authenticated
  using (is_admin()) with check (is_admin());

-- ============================================================================
-- NOTIFICATIONS — cada um lê/marca as suas.
-- INSERT restrito a ADMIN: notificações geradas por usuários comuns
-- (resposta no fórum, upvote) acontecem via trigger/RPC security definer
-- (ver rpc.sql — trg_notify_forum_comment e toggle_forum_vote).
-- Fluxos de admin (aprovação, encontros, convites) continuam inserindo direto.
-- ============================================================================
create policy "notifications: lê as próprias"
  on notifications for select to authenticated
  using (user_id = auth.uid());

create policy "notifications: admin insere"
  on notifications for insert to authenticated
  with check (is_admin());

create policy "notifications: marca as próprias como lidas"
  on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- ACADEMY — aulas/cursos: leitura logada, escrita admin.
-- Progresso: leitura própria; escrita SÓ via RPCs (complete_lesson /
-- complete_course_episode), que também concedem o XP.
-- ============================================================================
create policy "aulas: leitura autenticada"
  on aulas for select to authenticated using (true);
create policy "aulas: admin escreve"
  on aulas for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "aula_progress: lê o próprio"
  on aula_progress for select to authenticated
  using (user_id = auth.uid());
-- (sem escrita direta)

create policy "courses: leitura autenticada"
  on courses for select to authenticated using (true);
create policy "courses: admin escreve"
  on courses for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "course_episodes: leitura autenticada"
  on course_episodes for select to authenticated using (true);
create policy "course_episodes: admin escreve"
  on course_episodes for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "episode_progress: lê o próprio"
  on course_episode_progress for select to authenticated
  using (user_id = auth.uid());
-- (sem escrita direta)

create policy "course_completions: lê o próprio"
  on course_completions for select to authenticated
  using (user_id = auth.uid());
-- (sem escrita direta)

-- ============================================================================
-- EMAIL_WHITELIST — fechada. Cadastro checa via RPC is_email_whitelisted
-- (não expõe a lista). Admin gerencia.
-- ============================================================================
create policy "whitelist: admin tudo"
  on email_whitelist for all to authenticated
  using (is_admin()) with check (is_admin());

-- ============================================================================
-- STARTUP_POSTS / DOCUMENTS — founder gerencia os da própria startup.
-- ============================================================================
create policy "posts: leitura autenticada"
  on startup_posts for select to authenticated using (true);

create policy "posts: founder da startup escreve"
  on startup_posts for all to authenticated
  using (startup_id = my_startup_id() or is_admin())
  with check (startup_id = my_startup_id() or is_admin());

create policy "docs: leitura autenticada"
  on startup_documents for select to authenticated using (true);

create policy "docs: founder da startup escreve"
  on startup_documents for all to authenticated
  using (startup_id = my_startup_id() or is_admin())
  with check (startup_id = my_startup_id() or is_admin());

-- ============================================================================
-- STORAGE — buckets startup-media / startup-docs
-- (rodar no SQL editor; ajuste os nomes se diferirem)
-- ============================================================================
create policy "storage: leitura autenticada"
  on storage.objects for select to authenticated
  using (bucket_id in ('startup-media', 'startup-docs'));

create policy "storage: upload autenticado nos buckets do app"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('startup-media', 'startup-docs'));

create policy "storage: admin deleta"
  on storage.objects for delete to authenticated
  using (bucket_id in ('startup-media', 'startup-docs') and is_admin());
