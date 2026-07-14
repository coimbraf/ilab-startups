-- ============================================================================
-- SANFRAN iLAB — RPCs TRANSACIONAIS (SECURITY DEFINER)
-- Fase 1 do hardening. Aplicar DEPOIS de policies.sql.
--
-- Estas funções substituem os fluxos read-modify-write que o front fazia
-- direto nas tabelas (votos, XP, presença, convites). Elas rodam com
-- privilégio do dono (bypassa RLS de forma controlada) e são atômicas.
-- O front chama via supabase.rpc('nome', {...}).
-- ============================================================================

-- ─── 1. VOTO DE FÓRUM ATÔMICO ────────────────────────────────────────────────
-- Substitui toggleForumPostVote (que lia upvotes, somava 1 e gravava —
-- race condition + manipulável). Recontagem sempre a partir da tabela de votos.
-- Retorna true se o voto foi ADICIONADO, false se foi REMOVIDO.
create or replace function public.toggle_forum_vote(p_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_added boolean;
begin
  if v_user is null then
    raise exception 'não autenticado';
  end if;

  if exists (select 1 from forum_post_votes where post_id = p_post_id and user_id = v_user) then
    delete from forum_post_votes where post_id = p_post_id and user_id = v_user;
    v_added := false;
  else
    insert into forum_post_votes (post_id, user_id) values (p_post_id, v_user);
    v_added := true;
  end if;

  -- Recontagem canônica (nunca soma incremental)
  update forum_posts
     set upvotes = (select count(*) from forum_post_votes where post_id = p_post_id)
   where id = p_post_id;

  -- Notificação de upvote (server-side — o INSERT em notifications é
  -- fechado para não-admins; ver policies.sql)
  if v_added then
    insert into notifications (user_id, title, message, type, link, is_read)
    select fp.author_id,
           'Novo Upvote!',
           coalesce(s.name, 'Alguém') || ' curtiu o seu tópico: "' || fp.title || '".',
           'forum_upvote',
           '/forum/' || p_post_id,
           false
      from forum_posts fp
      left join user_roles ur on ur.id = v_user
      left join startups s on s.id = ur.startup_id
     where fp.id = p_post_id
       and fp.author_id is not null
       and fp.author_id <> v_user;
  end if;

  return v_added;
end;
$$;

-- ─── 1b. NOTIFICAÇÃO DE COMENTÁRIO NO FÓRUM (trigger) ───────────────────────
-- O INSERT do comentário continua vindo do front (com RLS de autoria);
-- a notificação ao autor do post é gerada aqui, no servidor.
create or replace function public.notify_forum_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post forum_posts%rowtype;
begin
  select * into v_post from forum_posts where id = new.post_id;

  if found and v_post.author_id is not null and v_post.author_id <> new.author_id then
    insert into notifications (user_id, title, message, type, link, is_read)
    values (
      v_post.author_id,
      'Nova Resposta no Fórum',
      new.author_name || ' respondeu ao seu tópico: "' || v_post.title || '".',
      'forum_reply',
      '/forum/' || new.post_id,
      false
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_forum_comment on forum_comments;
create trigger trg_notify_forum_comment
  after insert on forum_comments
  for each row execute function public.notify_forum_comment();

-- ─── 2. XP DE AULA (individual + squad, transacional) ────────────────────────
-- Substitui markLessonCompleted. O XP vem da TABELA aulas (nunca do cliente).
-- Idempotente: segunda chamada não dá XP de novo. Retorna o XP concedido.
create or replace function public.complete_lesson(p_aula_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_xp integer;
  v_startup uuid;
begin
  if v_user is null then
    raise exception 'não autenticado';
  end if;

  -- já concluiu? não duplica
  if exists (select 1 from aula_progress where user_id = v_user and aula_id = p_aula_id) then
    return 0;
  end if;

  select coalesce(xp, 0) into v_xp from aulas where id = p_aula_id;
  if not found then
    raise exception 'aula não encontrada';
  end if;

  insert into aula_progress (user_id, aula_id, completed, xp_earned)
  values (v_user, p_aula_id, true, v_xp);

  if v_xp > 0 then
    update user_roles
       set academy_xp = coalesce(academy_xp, 0) + v_xp
     where id = v_user
     returning startup_id into v_startup;

    if v_startup is not null then
      update startups
         set academy_xp = coalesce(academy_xp, 0) + v_xp
       where id = v_startup;
    end if;
  end if;

  return v_xp;
end;
$$;

-- ─── 3. XP DE EPISÓDIO DE CURSO + BÔNUS DE CONCLUSÃO ────────────────────────
-- Substitui markCourseEpisodeCompleted. XP do episódio e bônus do curso vêm
-- do banco. Concede bônus exatamente uma vez, na mesma transação.
-- Retorna json { episode_xp, bonus_xp }.
create or replace function public.complete_course_episode(p_episode_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_course uuid;
  v_xp integer;
  v_startup uuid;
  v_bonus integer := 0;
  v_total integer;
  v_done integer;
  v_course_bonus integer;
begin
  if v_user is null then
    raise exception 'não autenticado';
  end if;

  select course_id, coalesce(xp, 0) into v_course, v_xp
    from course_episodes where id = p_episode_id;
  if not found then
    raise exception 'episódio não encontrado';
  end if;

  -- idempotência
  if exists (
    select 1 from course_episode_progress
     where user_id = v_user and episode_id = p_episode_id and completed = true
  ) then
    return json_build_object('episode_xp', 0, 'bonus_xp', 0);
  end if;

  insert into course_episode_progress (user_id, episode_id, course_id, completed, completed_at)
  values (v_user, p_episode_id, v_course, true, now())
  on conflict (user_id, episode_id)
  do update set completed = true, completed_at = now();

  select startup_id into v_startup from user_roles where id = v_user;

  -- curso completo? bônus (uma vez só)
  select count(*) into v_total from course_episodes where course_id = v_course;
  select count(*) into v_done from course_episode_progress
   where course_id = v_course and user_id = v_user and completed = true;

  if v_total > 0 and v_done = v_total then
    select coalesce(bonus_xp, 0) into v_course_bonus from courses where id = v_course;
    if v_course_bonus > 0 and not exists (
      select 1 from course_completions where user_id = v_user and course_id = v_course
    ) then
      insert into course_completions (user_id, course_id) values (v_user, v_course);
      v_bonus := v_course_bonus;
    end if;
  end if;

  if v_xp + v_bonus > 0 then
    update user_roles
       set academy_xp = coalesce(academy_xp, 0) + v_xp + v_bonus
     where id = v_user;

    if v_startup is not null then
      update startups
         set academy_xp = coalesce(academy_xp, 0) + v_xp + v_bonus
       where id = v_startup;
    end if;
  end if;

  return json_build_object('episode_xp', v_xp, 'bonus_xp', v_bonus);
end;
$$;

-- ─── 4. PRESENÇA EM ENCONTRO (admin) ±100 XP ────────────────────────────────
-- Substitui markMeetingPresence + addEngagementXp. Só admin marca presença.
create or replace function public.set_meeting_presence(
  p_meeting_id uuid,
  p_user_id uuid,
  p_present boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta integer;
  v_startup uuid;
begin
  if not is_admin() then
    raise exception 'apenas administradores marcam presença';
  end if;

  if p_present then
    -- idempotente: se já presente, não duplica XP
    if exists (select 1 from meeting_presences where meeting_id = p_meeting_id and user_id = p_user_id) then
      return;
    end if;
    insert into meeting_presences (meeting_id, user_id) values (p_meeting_id, p_user_id);
    v_delta := 100;
  else
    if not exists (select 1 from meeting_presences where meeting_id = p_meeting_id and user_id = p_user_id) then
      return;
    end if;
    delete from meeting_presences where meeting_id = p_meeting_id and user_id = p_user_id;
    v_delta := -100;
  end if;

  update user_roles
     set attendance_xp = greatest(0, coalesce(attendance_xp, 0) + v_delta)
   where id = p_user_id
   returning startup_id into v_startup;

  if v_startup is not null then
    update startups
       set attendance_xp = greatest(0, coalesce(attendance_xp, 0) + v_delta)
     where id = v_startup;
  end if;
end;
$$;

-- ─── 5. CONVITES (pré-cadastro, tabela fechada) ─────────────────────────────
-- validate_invite: chamado por ANON no cadastro. Devolve só o necessário,
-- sem expor a tabela invites.
create or replace function public.validate_invite(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv invites%rowtype;
begin
  select * into v_inv from invites where code = upper(trim(p_code));

  if not found then
    return json_build_object('valid', false, 'reason', 'Código inválido ou não encontrado.');
  end if;
  if not v_inv.active then
    return json_build_object('valid', false, 'reason', 'Este convite foi desativado.');
  end if;
  if v_inv.expires_at < now() then
    return json_build_object('valid', false, 'reason', 'Este convite já expirou.');
  end if;
  if v_inv.used_count >= v_inv.max_uses then
    return json_build_object('valid', false, 'reason', 'Este convite já atingiu o limite de usos.');
  end if;

  return json_build_object('valid', true, 'invite_id', v_inv.id);
end;
$$;

-- increment_invite_usage: já era referenciado pelo front; definição canônica.
-- Atômico e com revalidação (não estoura max_uses em corrida).
create or replace function public.increment_invite_usage(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update invites
     set used_count = used_count + 1
   where id = invite_id
     and active
     and expires_at >= now()
     and used_count < max_uses;

  if not found then
    raise exception 'convite inválido, expirado ou esgotado';
  end if;
end;
$$;

-- ─── 6. WHITELIST (pré-cadastro, sem expor a lista) ─────────────────────────
create or replace function public.is_email_whitelisted(p_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from email_whitelist where email = lower(trim(p_email))
  );
$$;

-- ─── GRANTS ──────────────────────────────────────────────────────────────────
-- Pré-cadastro roda como anon; o resto como authenticated.
grant execute on function public.toggle_forum_vote(uuid)                     to authenticated;
grant execute on function public.complete_lesson(uuid)                       to authenticated;
grant execute on function public.complete_course_episode(uuid)               to authenticated;
grant execute on function public.set_meeting_presence(uuid, uuid, boolean)   to authenticated;
grant execute on function public.validate_invite(text)                       to anon, authenticated;
grant execute on function public.increment_invite_usage(uuid)                to anon, authenticated;
grant execute on function public.is_email_whitelisted(text)                  to anon, authenticated;
grant execute on function public.is_admin()                                  to authenticated;
grant execute on function public.my_startup_id()                             to authenticated;
