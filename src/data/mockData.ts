// src/data/mockData.ts

export type MemberRole = 'Tech' | 'Negócios' | 'Outro';
export type DeliverableStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface StartupMember {
  id: string;
  name: string;
  email?: string;
  role: MemberRole;
  customRole?: string;
  isLeader: boolean;
  avatarUrl?: string;
  academyXp?: number;
}

export interface DeliverableType {
  id: string;
  title: string;
  description: string;
  xpValue: number;
  icon: string;
  requiresLink: boolean;
  sortOrder: number;
}

export interface StartupDeliverable {
  id: string;
  typeId: string;
  status: DeliverableStatus;
  evidenceUrl?: string;
  evidenceNotes?: string;
  description?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  xpEarned: number;
  type?: DeliverableType; // Join do banco
}

export interface StartupPost {
  id: string;
  startupId: string;
  authorId?: string;
  title: string;
  body?: string;            // Markdown
  coverImageUrl?: string;
  tags: string[];
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId?: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  title: string;
  body: string;
  authorId?: string;
  authorName: string;
  authorRole?: string;
  startupId?: string;
  startupName?: string;
  createdAt: string;
  upvotes: number;
  commentsCount: number;
  tags: string[];
  category?: string;
  comments?: ForumComment[];
  userHasVoted?: boolean;
}

export interface StartupDocument {
  id: string;
  startupId: string;
  deliverableTypeId?: string;
  name: string;
  fileUrl: string;
  fileType: 'pdf' | 'image' | 'video' | 'link' | string;
  fileSizeBytes?: number;
  description?: string;
  uploadedBy?: string;
  createdAt?: string;
}

export interface Startup {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  coverImageUrl?: string;
  shortPitch?: string;
  sector?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  pitchUrl?: string;
  cohort?: string;
  leaderPhone?: string;
  archived?: boolean;
  instagramUrl?: string;
  startup_members?: any[];
  startup_deliverables?: any[];
  totalScore: number;
  academyXp?: number;
  status: string;
  members: StartupMember[];
  deliverables: StartupDeliverable[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'founder' | 'public';
  startupId?: string;
  track?: string;
}

export interface Invite {
  id: string;
  code: string;
  max_uses: number;
  used_count: number;
  expires_at: string;
  active: boolean;
  created_at?: string;
}

export type NotificationType = 'forum_reply' | 'forum_upvote' | 'deliverable_approved' | 'deliverable_rejected' | 'ranking_change' | 'new_meeting' | 'meeting_reminder' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface CourseEpisode {
  id: string;
  course_id: string;
  title: string;
  description: string;
  youtube_id: string;
  duration_minutes: number;
  xp: number;
  order_index: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  playlist_id: string;
  level: 'iniciante' | 'intermediario' | 'avancado';
  bonus_xp: number;
  created_at: string;
  episodes?: CourseEpisode[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  youtube_id: string;
  duration: string;
  type?: 'gravacao' | 'externo';
  level?: 'iniciante' | 'intermediario' | 'avancado';
  xp?: number;
  tags?: string[];
  created_at?: string;
}

export interface SquadInvite {
  id: string;
  user_id: string;
  startup_id: string;
  startup_name?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export type MeetingStatus = 'Concluído' | 'Próximo' | 'Em breve' | 'Cancelado';

export interface Meeting {
  id: string;
  title: string;
  date: string; // ISO format
  description: string;
  status: MeetingStatus;
  guest?: string;
  location?: string;
  createdAt?: string;
}

// ============================================================================
// DICIONÁRIO DE ENTREGÁVEIS (GAMIFICAÇÃO)
// ============================================================================
export const deliverableTypes: Record<string, DeliverableType> = {
  'pitch_deck': { id: 'pitch_deck', title: 'Pitch Deck', description: 'Apresentação comercial e institucional da startup.', xpValue: 100, icon: 'presentation', requiresLink: true, sortOrder: 1 },
  'landing_page': { id: 'landing_page', title: 'Landing Page', description: 'Site de aterrissagem para captura de leads e presença digital.', xpValue: 80, icon: 'globe', requiresLink: true, sortOrder: 2 },
  'market_map': { id: 'market_map', title: 'Mapeamento de Mercado', description: 'Documento com stakeholders, concorrentes, ICP e fluxos de dinheiro.', xpValue: 120, icon: 'map', requiresLink: true, sortOrder: 3 },
  'poc': { id: 'poc', title: 'Prova de Conceito', description: 'Protótipo inicial ou PoC validando a viabilidade técnica.', xpValue: 150, icon: 'beaker', requiresLink: true, sortOrder: 4 },
  'discovery_call': { id: 'discovery_call', title: 'Discovery Call', description: 'Call com pelo menos um cliente, documentada ou gravada.', xpValue: 100, icon: 'phone-call', requiresLink: true, sortOrder: 5 },
  'instagram': { id: 'instagram', title: 'Conta no Instagram', description: 'Perfil ativo no Instagram para marketing e comunidade.', xpValue: 50, icon: 'instagram', requiresLink: true, sortOrder: 6 },
  'collabs_growth': { id: 'collabs_growth', title: 'Colabs e Growth', description: 'Parcerias realizadas para crescimento mútuo e expansão.', xpValue: 80, icon: 'trending-up', requiresLink: true, sortOrder: 7 },
  'events': { id: 'events', title: 'Ida a Eventos', description: 'Representação da startup e aceleradora em eventos.', xpValue: 60, icon: 'ticket', requiresLink: true, sortOrder: 8 },
  'pitch_competition': { id: 'pitch_competition', title: 'Pitchs em Competições', description: 'Apresentação em competições e hackathons.', xpValue: 100, icon: 'award', requiresLink: true, sortOrder: 9 },
  'demo_day': { id: 'demo_day', title: 'Demo Day', description: 'Apresentação final para banca avaliadora.', xpValue: 200, icon: 'flag', requiresLink: false, sortOrder: 10 },
};

// ============================================================================
// MOCK DATA (Para usar enquanto não conecta o Supabase)
// ============================================================================
export const mockStartups: Startup[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Equipe Alpha',
    description: 'Plataforma para automação de diligência legal.',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256&h=256&auto=format&fit=crop',
    leaderPhone: '+55 11 99999-9999',
    instagramUrl: 'https://instagram.com/alpha',
    totalScore: 300,
    status: 'Concluído',
    members: [
      { id: 'm1', name: 'Ana Silva', role: 'Negócios', isLeader: true, avatarUrl: 'https://ui-avatars.com/api/?name=Ana+Silva&background=4B2B2C&color=FFECB3' },
      { id: 'm2', name: 'Bruno Costa', role: 'Tech', isLeader: false, avatarUrl: 'https://ui-avatars.com/api/?name=Bruno+Costa&background=4B2B2C&color=FFECB3' }
    ],
    deliverables: [
      { id: 'sd1', typeId: 'pitch_deck', status: 'approved', evidenceUrl: '#link', xpEarned: 100, type: deliverableTypes['pitch_deck'] },
      { id: 'sd2', typeId: 'landing_page', status: 'approved', evidenceUrl: '#link', xpEarned: 80, type: deliverableTypes['landing_page'] },
      { id: 'sd3', typeId: 'market_map', status: 'approved', evidenceUrl: '#link', xpEarned: 120, type: deliverableTypes['market_map'] },
      { id: 'sd4', typeId: 'poc', status: 'submitted', evidenceUrl: '#link', xpEarned: 0, type: deliverableTypes['poc'] }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Equipe Beta',
    description: 'Jurimetria para predição de decisões judiciais no STF.',
    logoUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=256&h=256&auto=format&fit=crop',
    leaderPhone: '+55 11 98888-8888',
    instagramUrl: 'https://instagram.com/beta',
    totalScore: 100,
    status: 'Pendente',
    members: [
      { id: 'm3', name: 'Carla Mendes', role: 'Negócios', isLeader: true, avatarUrl: 'https://ui-avatars.com/api/?name=Carla+Mendes&background=4B2B2C&color=FFECB3' },
      { id: 'm4', name: 'Daniel Souza', role: 'Negócios', isLeader: false, avatarUrl: 'https://ui-avatars.com/api/?name=Daniel+Souza&background=4B2B2C&color=FFECB3' }
    ],
    deliverables: [
      { id: 'sd5', typeId: 'pitch_deck', status: 'approved', evidenceUrl: '#link', xpEarned: 100, type: deliverableTypes['pitch_deck'] },
      { id: 'sd6', typeId: 'landing_page', status: 'rejected', evidenceUrl: '#link', evidenceNotes: 'Link quebrado, por favor reenvie.', xpEarned: 0, type: deliverableTypes['landing_page'] }
    ]
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Equipe Gama',
    description: 'Marketplace de advogados correspondentes em tempo real.',
    logoUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=256&h=256&auto=format&fit=crop',
    leaderPhone: '+55 11 97777-7777',
    instagramUrl: 'https://instagram.com/gama',
    totalScore: 0,
    status: 'Pendente',
    members: [
      { id: 'm5', name: 'Eduardo Lima', role: 'Negócios', isLeader: true, avatarUrl: 'https://ui-avatars.com/api/?name=Eduardo+Lima&background=4B2B2C&color=FFECB3' }
    ],
    deliverables: [
      { id: 'sd7', typeId: 'pitch_deck', status: 'submitted', evidenceUrl: '#link', xpEarned: 0, type: deliverableTypes['pitch_deck'] }
    ]
  }
];

export const mockUsers: Record<string, User> = {
  admin: {
    id: 'admin-1',
    name: 'Administrador',
    email: 'admin@foxlaw.com',
    role: 'admin'
  }
};

export const mockForumPosts: ForumPost[] = [
  {
    id: 'f1',
    title: 'Dúvida sobre a documentação de POC',
    body: 'Alguém sabe se a prova de conceito precisa estar hospedada publicamente para ser aprovada na plataforma?',
    authorName: 'Ana Silva',
    authorRole: 'CEO',
    startupName: 'Equipe Alpha',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    upvotes: 12,
    commentsCount: 2,
    tags: ['dúvida', 'poc', 'entregáveis'],
    comments: [
      {
        id: 'c1',
        postId: 'f1',
        authorName: 'Eduardo Lima',
        body: 'Não precisa, pode ser um vídeo demonstrando o funcionamento ou um link não listado.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: 'c2',
        postId: 'f1',
        authorName: 'Administrador',
        body: 'Exatamente o que o Eduardo disse. Vídeos curtos são super bem-vindos.',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      }
    ]
  },
  {
    id: 'f2',
    title: 'Evento LegalTech em SP - Quem vai?',
    body: 'Fala pessoal! Semana que vem tem o congresso de LegalTech. Seria legal nos encontrarmos lá e marcarmos presença como Sanfran iLab.',
    authorName: 'Daniel Souza',
    authorRole: 'PM',
    startupName: 'Equipe Beta',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    upvotes: 25,
    commentsCount: 0,
    tags: ['networking', 'eventos'],
    comments: []
  },
  {
    id: 'f3',
    title: 'Dica: Ferramenta de Jurimetria',
    body: 'Descobri uma API excelente para extrair jurisprudências do STJ com custo bem acessível. Quem tiver interesse me manda mensagem!',
    authorName: 'Carla Mendes',
    authorRole: 'CEO',
    startupName: 'Equipe Beta',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    upvotes: 8,
    commentsCount: 0,
    tags: ['dica', 'tecnologia', 'dados'],
    comments: []
  }
];

export const FORUM_CATEGORIES = [
  { id: 'Ferramentas & Recursos', label: 'Ferramentas & Recursos', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  { id: 'Tech', label: 'Tech', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  { id: 'Negócios', label: 'Negócios', bg: 'bg-amber-100', text: 'text-amber-800' },
  { id: 'Polinização', label: 'Polinização', bg: 'bg-pink-100', text: 'text-pink-800' },
  { id: 'Geral', label: 'Geral', bg: 'bg-gray-200', text: 'text-gray-800' }
];

export const getCategoryStyle = (categoryId?: string) => {
  const cat = FORUM_CATEGORIES.find(c => c.id === categoryId);
  return cat ? `${cat.bg} ${cat.text}` : 'bg-gray-200 text-gray-800';
};
