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
- ⚠️ **Estado atual do type-check:** há **16 erros de TypeScript pré-existentes** (eram 23 antes da Fase 0). Eles NÃO foram introduzidos por você e o `vite build` passa mesmo assim (esbuild não checa tipos). Categorias:
  - `Startup` não tem `forumXp`/`attendanceXp` mas `Home.tsx` os lê (breakdown de XP) → faltam campos no tipo + mappers.
  - `Lessons.tsx`: `PlayCircle` usado sem import.
  - `StartupDetail.tsx`: prop `title` passada a ícone Lucide (usar `<span title>` ou wrapper).
  - `supabaseService.ts` (linhas ~1201, ~1372-1394): destructuring de `startups(...)` que o Supabase tipa como array — tratar como array ou `.single()`.
  Corrija-os na **Fase 3** (tipagem). Não deixe passar de 16 para mais.
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

**Não refaça a Fase 0.** Comece na Fase 1.

## FASE 1 — Segurança (crítico) — COMEÇAR AQUI
6. **RLS:** gere um arquivo `supabase/policies.sql` documentando as Row-Level Security policies necessárias para cada tabela (admin-only writes em `startup_deliverables.review`, `invites`, `email_whitelist`; founder só edita sua startup; leitura pública controlada). Não temos acesso ao banco aqui — entregue o SQL para eu aplicar, com comentários.
7. **Votos de fórum atômicos:** substituir a lógica cliente de `toggleForumPostVote` (read-modify-write de `upvotes`) por uma RPC Postgres (`toggle_forum_vote`) que faz insert/delete do voto e recalcula a contagem via trigger/`count`. Entregue o SQL + ajuste `supabaseService.ts` para chamar a RPC.
8. **XP no servidor:** mover a atribuição de XP (aula, curso, presença, bônus) para RPCs transacionais (`grant_lesson_xp`, `grant_course_bonus`, `toggle_meeting_presence`) em vez dos múltiplos `update` no cliente. Entregue SQL + refatore os chamadores.
9. **YouTube API key:** parar de trafegar a key pelo cliente em `createCourse`. Migrar a importação de playlist para uma Supabase Edge Function (`import-playlist`) que guarda a key como secret. Entregue o código da function + ajuste o admin para chamá-la.
10. Endurecer o guard de admin: manter a checagem de UI, mas deixar claro (comentário + policy) que a autorização real é a RLS.

## FASE 2 — Consolidação de UX
11. **Eliminar `prompt()`/`alert()` nativos** em `StartupDetail.tsx` (submissão e revisão de entregável). Usar o `UIContext` (`toast`/`confirm`) que já existe, e um modal de submissão com campo de link + descrição no padrão visual do `ReviewModal` do `AdminPanel`.
12. **`FounderPanel.tsx` órfão:** decidir e executar — (a) religar no router com uma rota `/painel` protegida para founders, ou (b) remover se a jornada do founder já vive em `StartupDetail`. Recomende com base na completude da página (ela tem tabs jornada/documentos/posts).
13. Unificar a interface `User` duplicada (`AuthContext` vs `mockData`) numa fonte só.

## FASE 3 — Performance & Qualidade
14. **Realtime granular:** hoje qualquer mudança em 3 tabelas dispara `loadData()` completo. Otimizar para atualizar só o registro afetado no estado, ou ao menos debounce, evitando o piscar e o refetch total.
15. Tipar os mappers e payloads do Supabase (eliminar `any` pervasivo) com interfaces de linha (`Row`) por tabela. **Zerar os 16 erros de tipo pré-existentes** listados na seção de restrições (campos `forumXp`/`attendanceXp` em `Startup`, import de `PlayCircle`, prop `title` em ícone Lucide, destructuring de arrays do Supabase).
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

A Fase 0 já está feita — **comece pela Fase 1**. Não avance para a Fase 2 sem meu OK, porque as RPCs/policies dependem de eu aplicar SQL no Supabase.

**Prioridade absoluta: segurança (Fase 1) > UX (Fase 2) > qualidade (Fase 3).**
