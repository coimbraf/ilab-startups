import * as XLSX from 'xlsx';
import { Startup, StartupMember, Activity, Deliverable, mockStartups } from './mockData';

// Função para buscar e parsear um Google Sheets publicado como XLSX
export async function fetchStartupsFromGoogleSheet(sheetUrl: string): Promise<Startup[]> {
  try {
    let xlsxUrl = sheetUrl;
    if (sheetUrl.includes('/pubhtml') || sheetUrl.includes('output=csv')) {
      xlsxUrl = sheetUrl.replace(/\/pubhtml.*/, '/pub?output=xlsx').replace(/output=csv/, 'output=xlsx');
    } else if (sheetUrl.includes('/pub') && !sheetUrl.includes('output=xlsx')) {
        xlsxUrl = sheetUrl.split('?')[0] + '?output=xlsx';
    }

    const response = await fetch(xlsxUrl);
    if (!response.ok) {
      throw new Error('Falha ao baixar o arquivo XLSX do Google Sheets');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    let allStartups: Startup[] = [];

    // Cada aba da planilha é uma startup
    for (const sheetName of workbook.SheetNames) {
      if (sheetName.toLowerCase().includes('resumo') || sheetName.toLowerCase().includes('template')) {
        continue; // Ignorar abas de resumo ou templates
      }

      const worksheet = workbook.Sheets[sheetName];
      // header: 1 define para retornar array de arrays
      const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' }) as string[][];

      // Insert a dummy row representing NOME if it doesn't exist, using sheet name just in case
      // Or we can just adapt parseCustomVerticalFormat to accept sheetName
      const parsedStartups = parseCustomVerticalFormat(rows, sheetName);
      
      if (parsedStartups.length > 0) {
        allStartups = allStartups.concat(parsedStartups);
      }
    }

    if (allStartups.length > 0) {
      return allStartups;
    } else {
      console.warn("Nenhuma startup extraída da planilha. Usando dados de teste.");
      return mockStartups;
    }
  } catch (error) {
    console.error('Erro de conexão ao buscar Google Sheet:', error);
    return mockStartups;
  }
}

function parseCustomVerticalFormat(rows: string[][], sheetName?: string): Startup[] {
  const startups: Startup[] = [];
  
  // Encontrar o nome da startup
  let startupName = sheetName || 'Startup Desconhecida';
  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r];
    if (!row) continue;
    const firstText = row.find(c => c && String(c).trim() !== '');
    if (firstText) {
      const text = String(firstText).trim();
      if (text.toUpperCase() !== 'NOME' && text.toUpperCase() !== 'INTEGRANTES DA STARTUP') {
         startupName = text;
         break;
      }
    }
  }

  const currentStartup: Startup = {
    id: `gs-${Date.now()}-${sheetName}`,
    name: startupName,
    logoUrl: `https://images.unsplash.com/photo-1620287239308-ed8202c46f13?q=80&w=256&h=256&auto=format&fit=crop&sig=${Math.random()}`,
    description: 'Dados técnicos sincronizados e auditados via portal de transparência e banco de dados oficial do ecossistema.',
    totalScore: 0,
    leaderId: '',
    members: [],
    objectives: [],
    status: 'Pendente',
    activities: [],
    deliverables: []
  };

  let inDeliverablesSection = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();

    // Check headers to switch sections
    if (col0.includes('Objetivos do Semestre') || col1.includes('Objetivos do Semestre') || row.some(c => String(c).includes('Status de Andamento'))) {
      inDeliverablesSection = true;
      continue;
    }

    if (col0.includes('Explicações') || col1.includes('Explicações') || row.some(c => String(c).includes('Explicações'))) {
      inDeliverablesSection = false;
      continue; // Acabou a seção de entregas
    }

    if (!inDeliverablesSection) {
      // Members section
      if (col0.includes('CEO') || col0.includes('Chief Executive')) {
        if(col1) currentStartup.members.push(createMember(col1, 'CEO'));
      } else if (col0.includes('CTO') || col0.includes('Chief Tech')) {
        if(col1) currentStartup.members.push(createMember(col1, 'CTO'));
      } else if (col0.includes('PM') || col0.includes('Product Manager')) {
        if(col1) currentStartup.members.push(createMember(col1, 'PM'));
      } else if (col0.includes('CMO') || col0.includes('Chief Market')) {
        if(col1) currentStartup.members.push(createMember(col1, 'CMO'));
      } else if (col0.includes('Outro Cargo')) {
        if(col1) currentStartup.members.push(createMember(col1, 'Membro Executivo'));
      } else if (col0.includes('Líder Responsável')) {
        if(col1) currentStartup.leaderId = col1;
      }
    } else {
      // Deliverables section
      if (!col0 || col0.includes('Status de Andamento')) continue; // header row

      const itemName = col0.replace(':', '').trim();
      if (!itemName) continue;

      let status = '';
      let pontuacao = 0;
      let link = '';
      let dataConclusao = '';

      if (row.length >= 2) {
         // Remover colunas em branco e o próprio nome do item
         const nonEmptyCols = row.map(c => String(c || '').trim()).filter(c => c !== '' && c !== col0);
         
         if (nonEmptyCols.length >= 1) {
            status = nonEmptyCols[0];
         }
         
         const pontuacaoStr = nonEmptyCols.find(c => !isNaN(parseInt(c, 10)) && parseInt(c, 10) > 0 && parseInt(c,10) <= 200);
         if (pontuacaoStr) pontuacao = parseInt(pontuacaoStr, 10);

         const linkStr = nonEmptyCols.find(c => c.startsWith('http'));
         if (linkStr) link = linkStr;
         
         const dateStr = nonEmptyCols.find(c => (c.includes('/') || c.includes('-')) && c.length >= 5 && !c.includes('http') && c !== status);
         if (dateStr) dataConclusao = dateStr;
      }
      
      const isCompleted = status.toLowerCase() === 'concluído' || status.toLowerCase() === 'ok' || status.toLowerCase() === 'sim' || status.toLowerCase() === 'entregue';

      const isActivity = ['Discovery', 'Conta nas', 'Colabs', 'Eventos', 'Pitchs', 'Demo Day'].some(a => itemName.toLowerCase().includes(a.toLowerCase()));

      if (isActivity) {
        currentStartup.activities.push({
          id: `act-${Math.random()}`,
          title: itemName,
          isCompleted
        });
        if (isCompleted) currentStartup.totalScore += pontuacao;
      } else {
        currentStartup.deliverables.push({
          id: `del-${Math.random()}`,
          title: itemName,
          dueDate: dataConclusao || 'Pendente',
          accessLink: link || undefined,
          isConfidential: itemName.toLowerCase().includes('pitch') || itemName.toLowerCase().includes('mercado') || itemName.toLowerCase().includes('conceito')
        });
        if (isCompleted) currentStartup.totalScore += pontuacao;
      }
    }
  }

  if (currentStartup.totalScore >= 300) {
    currentStartup.status = 'Concluído';
  }

  startups.push(currentStartup);
  return startups;
}

function createMember(name: string, role: string): StartupMember {
  const shortName = name.replace(/[^a-zA-Z ]/g, '').substring(0, 2).toUpperCase() || 'MB';
  return {
    id: `m-${Math.random()}`,
    name,
    role: role as any,
    avatarUrl: `https://ui-avatars.com/api/?name=${shortName}&background=4B2B2C&color=FFECB3`
  };
}
