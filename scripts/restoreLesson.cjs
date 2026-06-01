const fs = require('fs');
let content = fs.readFileSync('src/data/supabaseService.ts', 'utf8');

const replacement = `  return data || [];
}

export async function createLesson(lesson: {
  title: string; description: string; youtube_id: string; duration: string;
  type?: 'gravacao' | 'externo'; level?: string; xp?: number; tags?: string[];
}) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('aulas').insert(lesson);
  if (error) throw error;
}

export async function updateLesson(id: string, lesson: {
  title: string; description: string; youtube_id: string; duration: string;
  type?: 'gravacao' | 'externo'; level?: string; xp?: number; tags?: string[];
}) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('aulas').update(lesson).eq('id', id);
  if (error) throw error;
}

export async function deleteLesson(id: string) {`;

content = content.replace(/export async function deleteLesson\(id: string\) \{/, replacement);
fs.writeFileSync('src/data/supabaseService.ts', content);
console.log('Restored createLesson and updateLesson');
