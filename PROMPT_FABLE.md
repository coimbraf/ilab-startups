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
- Trabalhe em branch separado (`refactor/hardening`). Commits pequenos, mensagens `conventional` (fix/feat/refactor/chore). Não faça push sem eu pedir.
- Rode `npm run lint` (tsc --noEmit) e garanta build limpo (`npm run build`) a cada etapa. **Zero erros de tipo novos.**
- Não instale libs sem justificar. Nada de mudança visual de regressão — se mexer em UI, mostre antes/depois.
- Ao mudar contrato de dados, ajuste TODOS os consumidores.

---

## OBJETIVO

Elevar o sistema a **produção segura e sustentável**, corrigindo segurança, consolidando UX e limpando dívida — **sem regressão visual**. Entregue em fases, cada fase compilando e testável isoladamente.

---

## FASE 0 — Higiene do repositório (rápido, baixo risco)
1. Remover os 8 arquivos `temp_*.txt`/`temp_*.json` da raiz e o diretório vazio `antigravity-awesome-skills/`.
2. Arquivar/remover os 29 scripts one-off em `scripts/` (mover para `scripts/_archive/` ou deletar os obsoletos de migração). Manter só o que ainda tem uso real.
3. Renomear `package.json` `name` de `"react-example"` para `"sanfran-ilab"`. Criar `.env.example` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Remover a dependência morta `@google/genai` e o `define GEMINI_API_KEY` do `vite.config.ts` (confirme que nada usa antes).
5. Resolver `googleSheetService.ts`: ele referencia tipos inexistentes (`Activity`, `Deliverable`, `leaderId`, `objectives`, `activities`) e não compila com o modelo atual. **Decisão:** remover o arquivo se o import de planilha foi aposentado, OU reescrevê-lo contra os tipos atuais de `mockData.ts`. Recomende e execute.

## FASE 1 — Segurança (crítico)
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
15. Tipar os mappers e payloads do Supabase (eliminar `any` pervasivo) com interfaces de linha (`Row`) por tabela.
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

Comece pela **Fase 0**, depois **Fase 1**. Não avance para a Fase 2 sem meu OK, porque as RPCs/policies dependem de eu aplicar SQL no Supabase.

**Prioridade absoluta: segurança (Fase 1) > UX (Fase 2) > higiene (Fase 0, pode ir junto) > qualidade (Fase 3).**
