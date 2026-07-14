# Como aplicar o hardening no Supabase

## 1. SQL (obrigatório, nesta ordem)
No painel do Supabase → **SQL Editor** → New query:

1. Cole e execute **`policies.sql`** (RLS + helpers `is_admin`/`my_startup_id`)
2. Cole e execute **`rpc.sql`** (RPCs transacionais + trigger de notificação)

> Se alguma tabela não existir no seu projeto (ex.: `course_completions`), comente a linha correspondente e siga — o resto aplica normalmente.

## 2. Edge Function (importação de playlist do YouTube)
Requer [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase login                       # abre o browser
supabase link --project-ref SEU_REF # ref do projeto (Settings → General)
supabase functions deploy import-playlist
supabase secrets set YOUTUBE_API_KEY=AIzaSy...
```

## 3. Testar localmente
Crie `.env` na raiz (copie de `.env.example`):

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

`npm run dev` e valide:

| Fluxo | Como testar | O que deve acontecer |
|---|---|---|
| Login | admin e founder | entra normal |
| Ranking | Home | pontuações aparecem; breakdown de XP preenchido |
| Voto no fórum | dar/tirar upvote 2× | contagem sobe/desce 1; sem duplicar |
| Aula concluída | assistir >85% | XP creditado 1× (repetir não duplica) |
| Presença | admin marca/desmarca | ±100 XP; founder NÃO consegue marcar |
| Submeter entregável | founder, via modal | vai para "Em análise"; founder não se auto-aprova |
| Aprovar | admin, via modal | XP + notificação chegam |
| Cadastro | código de convite + whitelist | funciona; código esgotado é recusado |
| Importar playlist | admin, sem campo de API key | curso criado (precisa da Edge Function no ar) |

## Erros esperados se o SQL NÃO foi aplicado
- `function public.toggle_forum_vote does not exist` → rode `rpc.sql`
- `new row violates row-level security policy` em fluxo legítimo → rode `policies.sql` (ou a policy da tabela citada falhou — verifique nomes de coluna)
