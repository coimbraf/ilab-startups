const fs = require('fs');
let code = fs.readFileSync('src/data/supabaseService.ts', 'utf8');

const newFunctions = `
export async function getAllMembers() {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase
    .from('startup_members')
    .select('*, startups(name)');
  if (error) throw error;
  return data || [];
}

export async function updateMemberStatus(id: string, status: 'active' | 'inactive') {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase
    .from('startup_members')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}
`;

fs.writeFileSync('src/data/supabaseService.ts', code + '\n' + newFunctions);
console.log('Appended to supabaseService');
