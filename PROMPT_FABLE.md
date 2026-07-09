# 🦊 Prompt para o Fable — Refatoração e Melhoria do Sanfran iLab

> Cole isto como mensagem inicial para o Fable. Ele já tem contexto do repo; este prompt define escopo, prioridades e restrições.

---

## CONTEXTO

Você vai trabalhar no **Sanfran iLab**, um portal SPA (React 19 + Vite 6 + TypeScript 5.8 + Tailwind v4 + Motion + Supabase) que gamifica startups por XP com ranking ao vivo, fórum, encontros e academy. A camada de dados única é `src/data/supabaseService.ts`. Leia `DOCUMENTACAO.md` na raiz antes de tocar em qualquer coisa — ela mapeia arquitetura, modelo de dados, design system e a dívida técnica já catalogada.

**Regras inegociáveis (de `AGENTS.md`):**
- Preserve a paleta (`fox` #FF6B00, `gold` #D4AF37, `brown` #2A1617, `teal`, `navy`) e as fontes (Playfair Display + Montserrat). Nada de cara de "template de IA".
- Nome oficial é **Ranking iLab** — nunca traduzir/renomear.
- `motion/react` para toda transição/animação.
- `supabaseService.ts` continua sendo a **fonte única** de acesso a dados.
- Edições cirúrgicas: não reescreva o que funciona só por estética de código.

**Restrições de trabalho:**
- O branch `refactor/hardening` **já existe** e a Fase 0 já foi commitada nele. Continue nesse branch. Commits pequenos, mensagens `conventional` (fix/feat/refactor/chore). Não faça push sem eu pedir.
- Rode `npm run lint` (tsc --noEmit) e garanta build limpo (`npm run build`) a cada etapa. **Zero erros de tipo novos.**
- ⚠️ **Estado atual do type-check:** há **7 erros de TypeScript pré-existentes** (eram 23; Fases 0 e 1 eliminaram 16). Eles NÃO foram introduzidos por você e o `vite build` passa mesmo assim (esbuild não checa tipos). São eles:
  - `AuthContext.tsx:95` — `.status` não existe em `PostgrestError`.
  - `Home.tsx:399-411` (4 erros) — `Startup` não tem `forumXp`/`attendanceXp`, mas o breakdown de XP os lê → adicionar campos ao tipo + preencher no `mapStartup`.
  - `Lessons.tsx:282` — `PlayCircle` usado sem import.
  - `StartupDetail.tsx:555` — prop `title` passada a ícone Lucide (usar `<span title>` wrapper).
  Corrija-os na **Fase 3** (tipagem). Não deixe passar de 7 para mais.
- Não instale libs sem justificar. Nada de mudança visual de regressão — se mexer em UI, mostre antes/depois.
- Ao mudar contrato de dados, ajuste TODOS os consumidores.

---

## OBJETIVO

Elevar o sistema a **produção segura e sustentável**, corrigindo segurança, consolidando UX e limpando dívida — **sem regressão visual**. Entregue em fases, cada fase compilando e testável isoladamente.

---

## ✅ FASE 0 — Higiene do repositório (JÁ CONCLUÍDA)
Feita e commitada em `refactor/hardening` (commit `chore: fase 0 — higiene do repositório`). Para referência, o que foi feito:
1. ✅ Removidos os 8 arquivos `temp_*` da raiz e o diretório vazio `antigravity-awesome-skills/`.
2. ✅ Os 29 scripts one-off movidos para `scripts/_archive/` (ainda no repo, isolados — avalie se pode deletá-los de vez).
3. ✅ `package.json` `name` → `"sanfran-ilab"`. `.env.example` criado.
4. ✅ Dependência morta `@google/genai` removida + `define GEMINI_API_KEY` retirado do `vite.config.ts` (e `loadEnv` órfão limpo).
5. ✅ `googleSheetService.ts` **removido** (era código morto, não importado por ninguém e não compilava — eliminou 7 dos 23 erros de tipo).

**Não refaça as Fases 0–2.** Comece na Fase 3.

## ✅ FASE 1 — Segurança (JÁ CONCLUÍDA)
Feita e commitada (`feat: fase 1 — hardening de segurança`). O que existe agora:
6. ✅ **RLS:** `supabase/policies.sql` — RLS completa nas 21 tabelas + storage, helpers `is_admin()`/`my_startup_id()`. Votos, progresso, presenças, `invites` e `email_whitelist` fechados para escrita direta. **⚠️ PENDENTE: o usuário ainda precisa APLICAR esse SQL no Supabase** (SQL Editor, `policies.sql` antes de `rpc.sql`).
7. ✅ **Votos atômicos:** RPC `toggle_forum_vote` em `supabase/rpc.sql` (recontagem canônica); `toggleForumPostVote` no front já chama a RPC.
8. ✅ **XP no servidor:** RPCs `complete_lesson`, `complete_course_episode` (XP lido do banco, idempotente, bônus atômico), `set_meeting_presence` (admin-only, ±100). Front refatorado; `addEngagementXp` removido. Também: `validate_invite`, `increment_invite_usage`, `is_email_whitelisted` (tabelas fechadas, RPC pré-cadastro).
9. ✅ **YouTube key:** Edge Function `supabase/functions/import-playlist/` (secret `YOUTUBE_API_KEY`, valida admin via JWT). `createCourse` invoca a function; campo de API key removido do form do admin. **⚠️ PENDENTE: deploy da function + `supabase secrets set YOUTUBE_API_KEY=...`**.
10. ✅ Guard de admin comentado (UX vs RLS). `tsconfig` agora exclui `supabase/` e `scripts/`.

**Caveat documentado** (endurecer na Fase 3): INSERT em `notifications` liberado para autenticados, porque o front notifica outros usuários (fórum/upvote). Mover para dentro das RPCs/triggers.

**IMPORTANTE:** o app só continua funcionando integralmente depois que o usuário aplicar `policies.sql` + `rpc.sql` e fizer o deploy da Edge Function — os fluxos de voto, XP, presença, cadastro (convite/whitelist) e importação de playlist agora dependem das RPCs. Se ele reportar erro "function does not exist", é porque o SQL não foi aplicado ainda.

## ✅ FASE 2 — Consolidação de UX (JÁ CONCLUÍDA)
Feita e commitada (`feat: fase 2 — consolidação de UX`):
11. ✅ `prompt()`/`alert()` eliminados de `StartupDetail`. Modais compartilhados em `src/components/DeliverableModals.tsx` (`SubmitDeliverableModal` + `ReviewDeliverableModal`) + toasts do `UIContext`.
12. ✅ `FounderPanel` **religado** em `/painel` (decisão: a página é completa — tabs jornada/documentos/posts). Botão no header (ícone LayoutDashboard, founders com startup) + entrada no menu mobile. Modal local substituído pelo compartilhado.
13. ✅ `User` unificado em `mockData.ts` (AuthContext re-exporta; agora carrega `track` do `user_roles`). Bônus: corrigido bug em `Home.tsx` que passava `user.role` como track ao aceitar convite de squad.

## FASE 3 — Performance & Qualidade — COMEÇAR AQUI
14. **Realtime granular:** hoje qualquer mudança em 3 tabelas dispara `loadData()` completo. Otimizar para atualizar só o registro afetado no estado, ou ao menos debounce, evitando o piscar e o refetch total.
15. Tipar os mappers e payloads do Supabase (eliminar `any` pervasivo) com interfaces de linha (`Row`) por tabela. **Zerar os 7 erros de tipo pré-existentes** listados na seção de restrições (campos `forumXp`/`attendanceXp` em `Startup`, import de `PlayCircle`, prop `title` em ícone Lucide, `.status` em `PostgrestError`).
18. **Endurecer notifications:** remover a policy de INSERT aberto para autenticados — mover a criação de notificações (fórum reply/upvote, broadcast de encontros) para dentro das RPCs/triggers no Postgres.
16. Adicionar **testes** mínimos: Vitest + React Testing Library. Cobrir `supabaseService` (mappers puros), cálculo de `totalScore`/progresso, e um smoke test de render do `Home`/`RootLayout`. Adicionar script `test`.
17. Configurar **ESLint** (flat config) + script `lint:fix`, e um **CI GitHub Actions** rodando lint + type-check + build + test em PR.

---

## FORMATO DE ENTREGA
Para cada fase:
1. Liste o que vai mudar e por quê (bullets curtos).
2. Aplique as edições.
3. Mostre `npm run lint` + `npm run build` passando.
4. Resuma o diff e riscos residuais.
5. Pare e me peça revisão antes da fase seguinte se houver decisão de produto (ex.: FounderPanel religar vs remover).

Fases 0, 1 e 2 já estão feitas — **comece pela Fase 3**. Antes de qualquer teste end-to-end, confirme com o usuário se ele já aplicou `supabase/policies.sql` + `supabase/rpc.sql` e fez o deploy da Edge Function `import-playlist` (com o secret `YOUTUBE_API_KEY`).
