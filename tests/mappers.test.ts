// Testes dos mappers puros da camada de dados (snake_case → camelCase)
// e das regras de negócio de XP embutidas neles.
import { describe, it, expect } from 'vitest';
import { mapStartup, mapPost, mapDocument, StartupRow } from '../src/data/supabaseService';
import { deliverableTypes, getCategoryStyle, FORUM_CATEGORIES } from '../src/data/mockData';

const baseRow: StartupRow = {
  id: 's1',
  name: 'Equipe Teste',
  description: 'Uma startup de teste.',
  status: 'Pendente',
};

describe('mapStartup', () => {
  it('soma XP Duplo no totalScore: entregáveis aprovados + academy + fórum + eventos', () => {
    const row: StartupRow = {
      ...baseRow,
      academy_xp: 50,
      forum_xp: 20,
      attendance_xp: 100,
      startup_deliverables: [
        { id: 'd1', type_id: 'pitch_deck', status: 'approved', xp_earned: 100 },
        { id: 'd2', type_id: 'landing_page', status: 'approved', xp_earned: 80 },
        { id: 'd3', type_id: 'poc', status: 'submitted', xp_earned: 0 },     // não conta
        { id: 'd4', type_id: 'market_map', status: 'rejected', xp_earned: 120 }, // não conta
      ],
    };

    const s = mapStartup(row);
    expect(s.totalScore).toBe(100 + 80 + 50 + 20 + 100); // 350
    expect(s.academyXp).toBe(50);
    expect(s.forumXp).toBe(20);
    expect(s.attendanceXp).toBe(100);
  });

  it('zera XP quando colunas são null/ausentes', () => {
    const s = mapStartup(baseRow);
    expect(s.totalScore).toBe(0);
    expect(s.academyXp).toBe(0);
    expect(s.deliverables).toEqual([]);
    expect(s.members).toEqual([]);
  });

  it('mapeia membros com XP individual vindo do join user_roles', () => {
    const s = mapStartup({
      ...baseRow,
      startup_members: [
        {
          id: 'm1', name: 'Ana', role: 'Tech', is_leader: true,
          user_roles: { academy_xp: 30, forum_xp: 10, attendance_xp: 200 },
        },
        { id: 'm2', name: 'Bruno', role: 'Outro', custom_role: 'Designer', is_leader: false, user_roles: null },
      ],
    });

    expect(s.members[0]).toMatchObject({
      id: 'm1', name: 'Ana', isLeader: true,
      academyXp: 30, forumXp: 10, attendanceXp: 200,
    });
    expect(s.members[1]).toMatchObject({
      customRole: 'Designer', isLeader: false, academyXp: 0,
    });
  });

  it('anexa o tipo do dicionário deliverableTypes em cada entregável', () => {
    const s = mapStartup({
      ...baseRow,
      startup_deliverables: [
        { id: 'd1', type_id: 'demo_day', status: 'pending', xp_earned: 0 },
      ],
    });
    expect(s.deliverables[0].type).toBe(deliverableTypes['demo_day']);
    expect(s.deliverables[0].type?.xpValue).toBe(200);
  });

  it('usa "Pendente" como status default', () => {
    const s = mapStartup({ ...baseRow, status: null });
    expect(s.status).toBe('Pendente');
  });
});

describe('mapPost', () => {
  it('converte snake_case e defaults', () => {
    const p = mapPost({
      id: 'p1', startup_id: 's1', title: 'Novidade',
      body: 'corpo', cover_image_url: 'http://img', tags: null,
      is_published: true, created_at: '2026-01-01',
    });
    expect(p).toMatchObject({
      id: 'p1', startupId: 's1', title: 'Novidade',
      coverImageUrl: 'http://img', tags: [], isPublished: true,
    });
  });
});

describe('mapDocument', () => {
  it('converte snake_case e defaults', () => {
    const d = mapDocument({
      id: 'doc1', startup_id: 's1', name: 'pitch.pdf',
      file_url: 'http://f', file_type: 'pdf', file_size_bytes: 1024,
    });
    expect(d).toMatchObject({
      id: 'doc1', startupId: 's1', fileUrl: 'http://f',
      fileType: 'pdf', fileSizeBytes: 1024,
    });
    expect(d.deliverableTypeId).toBeUndefined();
  });
});

describe('deliverableTypes (regras de gamificação)', () => {
  it('tem os 10 entregáveis somando 1040 XP', () => {
    const types = Object.values(deliverableTypes);
    expect(types).toHaveLength(10);
    expect(types.reduce((s, t) => s + t.xpValue, 0)).toBe(1040);
  });
});

describe('getCategoryStyle', () => {
  it('devolve classes da categoria conhecida', () => {
    const cat = FORUM_CATEGORIES[0];
    expect(getCategoryStyle(cat.id)).toBe(`${cat.bg} ${cat.text}`);
  });

  it('cai no fallback para categoria desconhecida', () => {
    expect(getCategoryStyle('nao-existe')).toBe('bg-gray-200 text-gray-800');
  });
});
