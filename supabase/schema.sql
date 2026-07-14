-- ============================================================================
-- SANFRAN iLAB — SCHEMA COMPLETO (21 tabelas)
-- Inferido do código do front (supabaseService.ts) — torna o projeto
-- reprodutível em qualquer instância Supabase.
-- ORDEM DE APLICAÇÃO: schema.sql → policies.sql → rpc.sql
-- ============================================================================

-- ─── Núcleo: startups e pessoas ──────────────────────────────────────────────

create table if not exists startups (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  short_pitch     text,
  sector          text,
  cohort          text,
  leader_phone    text,
  instagram_url   text,
  website_url     text,
  linkedin_url    text,
  pitch_url       text,
  logo_url        text,
  cover_image_url text,
  status          text default 'Pendente',
  archived        boolean default false,
  -- XP agregado do squad (atualizado apenas pelas RPCs — ver rpc.sql)
  academy_xp      integer default 0,
  forum_xp        integer default 0,
  attendance_xp   integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists user_roles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null default 'founder' check (role in ('admin', 'founder', 'public')),
  startup_id    uuid references startups(id) on delete set null,
  track         text,
  name          text,
  email         text,
  -- XP individual (atualizado apenas pelas RPCs)
  academy_xp    integer default 0,
  forum_xp      integer default 0,
  attendance_xp integer default 0,
  created_at    timestamptz default now()
);

create table if not exists startup_members (
  id          uuid primary key default gen_random_uuid(),
  startup_id  uuid not null references startups(id) on delete cascade,
  -- FK para user_roles: o front embeda user_roles(academy_xp, ...) dentro de
  -- startup_members no fetch do ranking — PostgREST exige esta relação.
  user_id     uuid references user_roles(id) on delete set null,
  name        text not null,
  role        text not null default 'Outro',
  custom_role text,
  is_leader   boolean default false,
  avatar_url  text,
  status      text default 'active',
  created_at  timestamptz default now()
);

-- ─── Gamificação: entregáveis ────────────────────────────────────────────────

create table if not exists startup_deliverables (
  id             uuid primary key default gen_random_uuid(),
  startup_id     uuid not null references startups(id) on delete cascade,
  type_id        text not null,   -- chave do dicionário deliverableTypes (front)
  status         text not null default 'pending' check (status in ('pending', 'submitted', 'approved', 'rejected')),
  evidence_url   text,
  evidence_notes text,
  description    text,
  submitted_at   timestamptz,
  reviewed_at    timestamptz,
  reviewed_by    text,
  xp_earned      integer default 0,
  unique (startup_id, type_id)   -- upsert do submitDeliverable depende disto
);

-- ─── Conteúdo das startups ───────────────────────────────────────────────────

create table if not exists startup_posts (
  id              uuid primary key default gen_random_uuid(),
  startup_id      uuid not null references startups(id) on delete cascade,
  author_id       uuid,
  title           text not null,
  body            text,
  cover_image_url text,
  tags            text[] default '{}',
  is_published    boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists startup_documents (
  id                  uuid primary key default gen_random_uuid(),
  startup_id          uuid not null references startups(id) on delete cascade,
  deliverable_type_id text,
  name                text not null,
  file_url            text not null,
  file_type           text not null,
  file_size_bytes     bigint,
  description         text,
  uploaded_by         text,
  created_at          timestamptz default now()
);

-- ─── Fórum ───────────────────────────────────────────────────────────────────

create table if not exists forum_posts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  author_id    uuid,
  author_name  text not null,
  author_role  text,
  startup_id   uuid,
  startup_name text,
  category     text default 'Geral',
  tags         text[] default '{}',
  upvotes      integer default 0,  -- recontado pela RPC toggle_forum_vote
  created_at   timestamptz default now()
);

create table if not exists forum_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references forum_posts(id) on delete cascade,
  author_id   uuid,
  author_name text not null,
  body        text not null,
  created_at  timestamptz default now()
);

create table if not exists forum_post_votes (
  post_id    uuid not null references forum_posts(id) on delete cascade,
  user_id    uuid not null,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- ─── Encontros ───────────────────────────────────────────────────────────────

create table if not exists meetings (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  date        timestamptz not null,
  description text,
  status      text default 'Próximo',
  guest       text,
  created_at  timestamptz default now()
);

create table if not exists meeting_presences (
  meeting_id uuid not null references meetings(id) on delete cascade,
  user_id    uuid not null,
  created_at timestamptz default now(),
  primary key (meeting_id, user_id)
);

-- ─── Convites e whitelist ────────────────────────────────────────────────────

create table if not exists invites (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  max_uses   integer not null default 1,
  used_count integer not null default 0,
  expires_at timestamptz not null,
  active     boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists email_whitelist (
  email    text primary key,
  added_at timestamptz default now()
);

create table if not exists squad_invites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  startup_id   uuid not null references startups(id) on delete cascade,
  startup_name text,
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at   timestamptz default now()
);

-- ─── Notificações ────────────────────────────────────────────────────────────

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  title      text not null,
  message    text not null,
  type       text not null default 'system',
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz default now()
);

-- ─── Academy: aulas avulsas ──────────────────────────────────────────────────

create table if not exists aulas (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  youtube_id  text not null,
  duration    text default '0',
  type        text default 'gravacao' check (type in ('gravacao', 'externo')),
  level       text default 'iniciante',
  xp          integer default 0,
  tags        text[] default '{}',
  created_at  timestamptz default now()
);

create table if not exists aula_progress (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  aula_id    uuid not null references aulas(id) on delete cascade,
  completed  boolean default true,
  xp_earned  integer default 0,
  created_at timestamptz default now(),
  unique (user_id, aula_id)
);

-- ─── Academy: cursos (playlists) ─────────────────────────────────────────────

create table if not exists courses (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  playlist_id text not null,
  level       text default 'iniciante' check (level in ('iniciante', 'intermediario', 'avancado')),
  bonus_xp    integer default 0,
  created_at  timestamptz default now()
);

create table if not exists course_episodes (
  id               uuid primary key default gen_random_uuid(),
  course_id        uuid not null references courses(id) on delete cascade,
  title            text not null,
  description      text,
  youtube_id       text not null,
  duration_minutes integer default 1,
  xp               integer default 0,
  order_index      integer default 0
);

create table if not exists course_episode_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  episode_id   uuid not null references course_episodes(id) on delete cascade,
  course_id    uuid not null references courses(id) on delete cascade,
  completed    boolean default false,
  completed_at timestamptz,
  unique (user_id, episode_id)
);

create table if not exists course_completions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  course_id  uuid not null references courses(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, course_id)
);

-- ─── Índices de apoio ────────────────────────────────────────────────────────

create index if not exists idx_members_startup       on startup_members(startup_id);
create index if not exists idx_deliverables_startup  on startup_deliverables(startup_id);
create index if not exists idx_deliverables_status   on startup_deliverables(status);
create index if not exists idx_posts_startup         on startup_posts(startup_id);
create index if not exists idx_docs_startup          on startup_documents(startup_id);
create index if not exists idx_forum_comments_post   on forum_comments(post_id);
create index if not exists idx_notifications_user    on notifications(user_id, is_read);
create index if not exists idx_user_roles_startup    on user_roles(startup_id);
create index if not exists idx_episodes_course       on course_episodes(course_id);

-- ─── Realtime (o front assina estas tabelas) ─────────────────────────────────

alter publication supabase_realtime add table startups;
alter publication supabase_realtime add table startup_members;
alter publication supabase_realtime add table startup_deliverables;
alter publication supabase_realtime add table notifications;

-- ─── Storage: buckets usados pelo FileUploader ──────────────────────────────

insert into storage.buckets (id, name, public)
values ('startup-media', 'startup-media', true), ('startup-docs', 'startup-docs', true)
on conflict (id) do nothing;
