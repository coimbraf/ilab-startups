const fs = require('fs');
let content = fs.readFileSync('src/data/supabaseService.ts', 'utf8');

const oldCreate = `export async function createLesson(lesson: {
  title: string; description: string; youtube_id: string; duration: string;
}) {`;
const newCreate = `export async function createLesson(lesson: {
  title: string; description: string; youtube_id: string; duration: string;
  type?: 'gravacao' | 'externo'; level?: string; xp?: number; tags?: string[];
}) {`;

content = content.replace(oldCreate, newCreate);

const oldUpdate = `export async function updateLesson(id: string, lesson: {
  title: string; description: string; youtube_id: string; duration: string;
}) {`;
const newUpdate = `export async function updateLesson(id: string, lesson: {
  title: string; description: string; youtube_id: string; duration: string;
  type?: 'gravacao' | 'externo'; level?: string; xp?: number; tags?: string[];
}) {`;

content = content.replace(oldUpdate, newUpdate);

// Add progress functions
const progressFuncs = `
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

export async function markLessonCompleted(aulaId: string, xpEarned: number = 0) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('aula_progress')
    .insert({
      user_id: user.id,
      aula_id: aulaId,
      completed: true,
      xp_earned: xpEarned
    });

  if (error) {
    console.error('Erro ao salvar progresso:', error);
  }
}
`;

if (!content.includes('getLessonProgress')) {
  content = content + progressFuncs;
}

fs.writeFileSync('src/data/supabaseService.ts', content);
console.log('supabaseService updated');
