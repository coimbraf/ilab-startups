# Diretrizes para Desenvolvedores IA (Contexto do Projeto)

**IMPORTANTE: ESTE ARQUIVO DEVE SER LIDO ANTES DE QUALQUER ALTERAÇÃO NO CÓDIGO.**

## 🎯 Regras de Edição "In Locus"
Para evitar retrabalho e inconsistências, siga estritamente estas diretrizes:

1. **Alterações Cirúrgicas**: O usuário solicitará alterações em seções específicas (ex: "Ranking", "Header", "Página de Startup"). Você DEVE limitar suas edições apenas aos arquivos e blocos de código que compõem essas seções.
2. **Preservação de Lógica**: Não altere lógicas de backend, hooks globais ou serviços de dados (como Supabase) a menos que seja explicitamente solicitado ou necessário para corrigir um bug direto na seção alvo.
3. **Estilo e Identidade**: Mantenha a paleta de cores (Fox, Gold, Brown) e a tipografia estabelecida. O design deve ser "Advanced/State-of-the-Art", removendo qualquer aparência de design genérico de IA.
4. **Foco no Usuário**: Se o usuário apontar uma sobreposição ou bug visual, corrija apenas o CSS/Tailwind necessário para resolver esse conflito específico.
5. **Nomenclatura**: Respeite o nome oficial: **Ranking Ilab**. Não utilize nomes em inglês ou termos genéricos.

## 🛠 Stack Técnica
- Não instale novas bibliotecas sem justificar.
- Utilize `motion` para qualquer transição de estado ou carregamento.
- Mantenha o serviço `supabaseService.ts` como a única fonte de verdade para dados externos.
