# 📘 Documentação Técnica — Sanfran iLab (Portal de Startups)

> Portal institucional do programa de inovação jurídica **Sanfran iLab**. Exibe ranking ao vivo, perfis de startups, gamificação por XP, fórum, encontros e academy (aulas/cursos YouTube). SPA React 19 + Vite 6 + Supabase.

**Repositório:** `https://github.com/coimbraf/ilab-startups`
**Gerado em:** 2026-07-09

---

## 1. Visão Geral

| Item | Valor |
|---|---|
| Tipo | Single Page Application (SPA) |
| Domínio | Portal de acompanhamento de startups (legaltech / aceleradora universitária) |
| Idioma | Português (pt-BR) |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) — BaaS |
| Estado | Sem servidor próprio; toda lógica no cliente |
| Deploy alvo | Estático (Vite build → `dist/`) |

### Conceito
Startups (squads) acumulam **XP** cumprindo entregáveis e engajando na comunidade. O XP alimenta um **ranking ao vivo**. Três papéis: **público**, **founder** e **admin**.

### Modelo de XP ("XP Duplo")
XP é rastreado em **dois níveis** simultaneamente:
- **Individual** (`user_roles`): `academy_xp`, `forum_xp`, `attendance_xp`.
- **Squad/Startup** (`startups`): agregado do time.

Fontes de XP:
| Fonte | XP | Onde |
|---|---|---|
| Entregáveis aprovados | 50–200 (por tipo) | `deliverableTypes` em `mockData.ts` |
| Aula/episódio concluído | por duração × multiplicador de nível | `markLessonCompleted`, `markCourseEpisodeCompleted` |
| Bônus por curso completo | `bonus_xp` | `course_completions` |
| Presença em encontro | +100 (−100 ao remover) | `markMeetingPresence` |
| Fórum | via `addEngagementXp('forum')` | (parcialmente cabeado) |

---

## 2. Stack Técnica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | React | 19.x |
| Linguagem | TypeScript | 5.8 |
| Bundler | Vite | 6.x |
| Estilização | Tailwind CSS v4 (plugin `@tailwindcss/vite`) | 4.1 |
| Animações | Motion (Framer Motion) `motion/react` | 12.x |
| Roteamento | React Router DOM | 7.x |
| Backend/BaaS | Supabase JS | 2.x |
| Ícones | Lucide React | 0.546 |
| Gráficos | Recharts | 3.x |
| Markdown | react-markdown | 10.x |
| Planilhas | xlsx (SheetJS) | 0.18 |
| CSV | papaparse | 5.x |
| Confetes | canvas-confetti | 1.9 |
| Util classes | clsx + tailwind-merge (`cn()`) | — |
| **Dependência morta** | `@google/genai` | 1.29 (declarada, `GEMINI_API_KEY` no vite, **nunca usada**) |

---

## 3. Estrutura de Pastas

```
ilab-startups/
├── index.html                # Entry HTML, monta #root
├── vite.config.ts            # Vite + Tailwind + React, alias @ → raiz
├── tsconfig.json             # target ES2022, jsx react-jsx, noEmit
├── package.json              # name "react-example" (não renomeado)
├── AGENTS.md                 # regras para agentes IA (edição cirúrgica)
├── README.md
├── public/
│   ├── logo.png
│   └── avatars/*.svg         # avatares default
├── scripts/                  # 29 scripts .cjs/.js one-off (migração/refactor) — LIXO
├── temp_*.txt / temp_*.json  # 8 arquivos temporários versionados — LIXO
├── antigravity-awesome-skills/  # diretório vazio
└── src/
    ├── main.tsx              # StrictMode + createRoot
    ├── App.tsx              # Router + Providers aninhados
    ├── index.css            # @theme Tailwind, tokens de cor, skeleton, grain
    ├── contexts/
    │   ├── AuthContext.tsx      # sessão Supabase, role, startupId
    │   ├── StartupsContext.tsx  # startups + realtime + cache localStorage
    │   └── UIContext.tsx        # toast + confirm (modais globais)
    ├── hooks/
    │   ├── useStartups.ts       # re-export do StartupsContext
    │   └── useDimensions.ts
    ├── lib/utils.ts            # cn()
    ├── data/
    │   ├── mockData.ts          # tipos TS + deliverableTypes + mocks + categorias fórum
    │   ├── supabaseService.ts   # ★ CAMADA DE DADOS (1399 linhas, fonte única)
    │   └── googleSheetService.ts # parser XLSX legado (Google Sheets)
    ├── components/
    │   ├── RootLayout.tsx       # nav pill flutuante, notificações, footer, grão
    │   ├── SmartImage.tsx, StartupIcon.tsx, MarkdownRenderer.tsx
    │   ├── FileUploader.tsx, PixelTrail.tsx, GooeyFilter.tsx
    │   └── admin/               # 8 managers do painel admin
    └── pages/
        ├── Home.tsx             # hero + ranking + portfólio + comunidade
        ├── StartupDetail.tsx    # perfil + jornada de entregáveis + squad
        ├── Login.tsx, Register.tsx
        ├── AdminPanel.tsx       # abas: geral/aprovações/squads/membros/...
        ├── FounderPanel.tsx     # ⚠️ ÓRFÃO — não está no router
        ├── ForumList.tsx, ForumPostDetail.tsx
        ├── Meetings.tsx, Lessons.tsx
```

---

## 4. Arquitetura da Aplicação

### 4.1 Árvore de Providers (`App.tsx`)
```
<AuthProvider>          // sessão + papel do usuário
  <UIProvider>          // toast/confirm globais
    <StartupsProvider>  // dados de startups + realtime
      <RouterProvider /> // createBrowserRouter
```

### 4.2 Rotas (`createBrowserRouter`)
Todas sob `RootLayout` (`<Outlet/>`):

| Path | Página | Acesso |
|---|---|---|
| `/` | Home | autenticado |
| `/startup/:id` | StartupDetail | autenticado (evidências: founder+/admin) |
| `/login` | Login | público |
| `/cadastro` | Register | público (exige convite) |
| `/admin` | AdminPanel | admin (guard no componente) |
| `/forum` | ForumList | autenticado |
| `/forum/:id` | ForumPostDetail | autenticado |
| `/encontros` | Meetings | autenticado |
| `/academy` | Lessons | autenticado |

> **Guard de auth** vive no `RootLayout` via `useEffect`: sem `user` → redireciona a `/login` (exceto rotas de auth). `AdminPanel` faz sua própria checagem de papel.

### 4.3 Contextos

**AuthContext** — `getSession()` inicial + `onAuthStateChange`. Carrega papel/`startup_id` de `user_roles`. Expõe `user`, `login`, `logout`, `isLoading`, `isSessionValid`. Fallback: sem Supabase → `user=null`.

**StartupsContext** — carrega via `fetchStartupsFromSupabase()`, cacheia em `localStorage('@sanfranilab:startups')`, assina **Realtime** em `startups`, `startup_members`, `startup_deliverables` (recarrega tudo em qualquer mudança). Fallback → `mockStartups`.

**UIContext** — `toast(msg, type)` (auto-dismiss 3s) e `confirm(msg, opts)` (Promise<boolean> via modal). Já implementado com Motion — **mas subutilizado** (ver §8).

---

## 5. Camada de Dados (`supabaseService.ts`)

Cliente único: `supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` ou `null`. **Todas** as funções checam `if (!supabase) throw`. Mappers `snake_case → camelCase` internos (`mapStartup`, `mapPost`, `mapDocument`).

### Grupos funcionais
- **Startups**: fetch (all/by id), create, update, delete. `totalScore` calculado no cliente (soma `xp_earned` de entregáveis `approved`).
- **Membros**: upsert/delete em `startup_members`.
- **Founders**: criar conta (`auth.signUp` + `user_roles`), vincular/desvincular a startup, listar disponíveis.
- **Squad Invites**: convidar, listar pendentes, responder (aceita → atualiza role + insere membro) + notificação.
- **Entregáveis**: submeter (upsert `startup_id,type_id`), listar pendentes, revisar (approve/reject + XP + notificação).
- **Posts** (blog de startup) e **Fórum** (posts, comentários, votos com contagem no cliente).
- **Documentos** + **Upload** (`supabase.storage`, buckets `startup-media`/`startup-docs`).
- **Encontros** (meetings) + **presenças** (+XP).
- **Convites** (invites com código, expiração, limite de usos) + registro.
- **Notificações** (individuais, por squad, broadcast) + realtime no header.
- **Aulas** (`aulas`) + progresso + XP.
- **Cursos/Playlists**: importa playlist do **YouTube Data API v3** (título, itens, durações), cria episódios com XP por duração × nível; bônus ao completar.
- **Whitelist** de e-mails, **XP de engajamento**.

### Tabelas Supabase (inferidas)
`startups`, `startup_members`, `startup_deliverables`, `startup_posts`, `startup_documents`, `user_roles`, `squad_invites`, `forum_posts`, `forum_comments`, `forum_post_votes`, `meetings`, `meeting_presences`, `invites`, `notifications`, `aulas`, `aula_progress`, `courses`, `course_episodes`, `course_episode_progress`, `course_completions`, `email_whitelist`.

RPC: `increment_invite_usage(invite_id)`.

---

## 6. Modelo de Dados (tipos principais — `mockData.ts`)

- **Startup**: id, name, description, logo/cover, shortPitch, sector, links sociais, cohort, `totalScore`, `academyXp`, status, `members[]`, `deliverables[]`.
- **StartupMember**: name, role (`Tech|Negócios|Outro`), customRole, isLeader, avatarUrl, `academyXp/forumXp/attendanceXp`.
- **DeliverableType** (10 fixos): `pitch_deck`(100), `landing_page`(80), `market_map`(120), `poc`(150), `discovery_call`(100), `instagram`(50), `collabs_growth`(80), `events`(60), `pitch_competition`(100), `demo_day`(200). Total possível: **1040 XP**.
- **StartupDeliverable**: status (`pending|submitted|approved|rejected`), evidenceUrl, notes, xpEarned.
- **ForumPost/ForumComment**, **StartupPost**, **StartupDocument**, **Notification** (7 tipos), **Course/CourseEpisode**, **Lesson**, **SquadInvite**, **Meeting**, **Invite**.
- **User**: role `admin|founder|public`, startupId, track.
- `FORUM_CATEGORIES` + `getCategoryStyle()`.

---

## 7. Design System

Definido em `src/index.css` via `@theme` (Tailwind v4):

**Cores:**
| Token | Hex | Uso |
|---|---|---|
| `fox` | #FF6B00 | primária (laranja) |
| `gold` | #D4AF37 | destaque |
| `teal` | #1A8582 | sucesso/aprovado |
| `graphite` | #363636 | texto |
| `brown` | #2A1617 | nav/footer/dark |
| `navy` | #29385C | headings secundários |
| `cream` | #FFFBEC | claro |
| bg body | #FFFDF2 | fundo |

**Tipografia:** Playfair Display (headings/display) + Montserrat (corpo).
**Escala de z-index** tokenizada (`--z-base…--z-toast`).
**Padrões visuais:** nav "pill" flutuante (Fluid Island), grain overlay SVG fixo (`mix-blend-multiply`), skeleton shimmer, `prefers-reduced-motion`, focus-visible padronizado, números tabulares, animações spring do Motion, cards com flip 3D (portfólio), confetti em startup "Concluído".

---

## 8. Fluxos Principais

**Login/Auth:** rate-limit client-side (localStorage `login_attempts`/`login_lockout`) → `signInWithPassword` → `onAuthStateChange` carrega perfil → redirect.
**Cadastro:** exige código de convite válido (`validateInviteCode`) → `signUp` + `user_roles(founder)` → incrementa uso do convite.
**Submeter entregável (founder):** em `StartupDetail`, `authLevel>=2` → `prompt()` pede link+descrição → `submitDeliverable` (status `submitted`).
**Revisar (admin):** `AdminPanel > Aprovações` (modal bonito) **ou** `StartupDetail` (via `prompt()` inline) → `reviewDeliverable` → XP + notificação realtime.
**Ranking:** `Home` ordena por `totalScore`; linha expansível mostra breakdown (entregáveis/academy/fórum/eventos).

---

## 9. Dívida Técnica & Riscos (mapeado)

> **Status do hardening (branch `refactor/hardening`):** Fase 0 (higiene) e Fase 1 (segurança) concluídas. Itens marcados ✅ abaixo. **Pendência operacional:** aplicar `supabase/policies.sql` + `supabase/rpc.sql` no SQL Editor do Supabase e fazer deploy da Edge Function `import-playlist` (com secret `YOUTUBE_API_KEY`).

### 🔴 Crítico
1. ✅ **RLS entregue** — `supabase/policies.sql` cobre as 21 tabelas + storage (aguarda aplicação no banco). Guard de admin na UI segue sendo só UX (documentado no código).
2. ✅ **Votos de fórum atômicos** — RPC `toggle_forum_vote` com recontagem canônica; front refatorado.
3. ✅ **XP no servidor** — RPCs `complete_lesson`, `complete_course_episode`, `set_meeting_presence` (transacionais, idempotentes, valores lidos do banco); front refatorado, `addEngagementXp` removido.
4. ✅ **YouTube API key protegida** — Edge Function `import-playlist` com secret; campo de key removido do form do admin.

### 🟠 Alto
5. **`FounderPanel.tsx` órfão** — página completa (458 linhas) importada por ninguém; não está no router. Ou religar ou remover. *(Fase 2)*
6. **`prompt()`/`alert()` nativos** em `StartupDetail` para submissão e revisão, apesar de `UIContext` já ter `toast`/`confirm` prontos e bonitos. UX inconsistente. *(Fase 2)*
7. ✅ **`googleSheetService.ts` removido** — era código morto que não compilava.
8. **Sem tratamento de sessão expirada consistente** — vários caminhos silenciam erro.

### 🟡 Médio
9. **Realtime recarrega tudo** (`loadData` completo) a cada mudança em 3 tabelas → refetch pesado e piscar. *(Fase 3)*
10. ✅ **`package.json` renomeado** para `sanfran-ilab`; `.env.example` criado.
11. ✅ **Scripts one-off arquivados** em `scripts/_archive/`; arquivos `temp_*` removidos.
12. ✅ **`@google/genai` + `GEMINI_API_KEY`** removidos.
13. ✅ **`antigravity-awesome-skills/`** removido.
14. **Sem testes**, sem lint além de `tsc --noEmit`, sem CI. *(Fase 3)*
15. **Tipos frouxos** — `any` pervasivo nos mappers; **7 erros de tsc pré-existentes** (eram 23). *(Fase 3)*
16. Duplicação de interface `User` (em `AuthContext` e `mockData`). *(Fase 2)*
17. **INSERT aberto em `notifications`** para autenticados (caveat da RLS — o front notifica outros usuários). Endurecer movendo para RPC/trigger. *(Fase 3)*

---

## 10. Como Rodar

```bash
npm install
# criar .env com:
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...
npm run dev      # vite :3000, host 0.0.0.0
npm run build    # → dist/
npm run lint     # tsc --noEmit (type-check)
npm run preview
```
Sem `.env` → app roda com `mockStartups` (design visível, sem persistência).

---

## 11. Convenções (do AGENTS.md)
- Edições **cirúrgicas** por seção; não mexer em lógica de backend/hooks sem pedido.
- Preservar paleta (fox/gold/brown) e tipografia; nada de "cara de IA genérica".
- Nome oficial: **Ranking iLab** (não traduzir).
- `motion` para toda transição; `supabaseService.ts` = fonte única de dados.
