import { User, DailyRecord, FiveSSubmission, DPOParameters, CritiqueRequest } from '../types/dpo';

export const INITIAL_PARAMETERS: DPOParameters = {
  ligaNome: 'LIGA DPO',
  pontuacaoMaximaPorColaborador: 6,
  observacao: 'A liga não diferencia horário. Os colaboradores competem por cargo, cada um com suas metas individuais.',
  temporadaAtiva: 'Ciclo 2026',
  lastUpdated: '2026-09-29',
};

// STRICTLY AND EXCLUSIVELY THE 15 COLLABORATORS FROM THE DPO SPECIFICATION
export const INITIAL_USERS: User[] = [
  // ==========================================
  // CARGO: AJUDANTE DE ARMAZÉM (9 Colaboradores)
  // ==========================================
  {
    id: 'u-g1154',
    matricula: 'G1154',
    pin: '1234',
    name: 'Edilson',
    role: 'ajudante',
    roleTitle: 'Ajudante de Armazém',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: 'EFM maior ou igual a 85%', pontos: 2, categoria: 'eficiencia' },
      { ordem: 2, descricao: 'Erros de montagem > 2%', pontos: 2, categoria: 'qualidade' },
      { ordem: 3, descricao: 'Relato de anomalia/segurança', pontos: 1, categoria: 'seguranca' },
      { ordem: 4, descricao: '5S Armazém', pontos: 1, categoria: '5s' },
    ],
  },
  {
    id: 'u-g1147',
    matricula: 'G1147',
    pin: '1234',
    name: 'Luis',
    role: 'ajudante',
    roleTitle: 'Ajudante de Armazém',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: 'EFM maior ou igual a 85%', pontos: 2, categoria: 'eficiencia' },
      { ordem: 2, descricao: 'Erros de montagem > 2%', pontos: 2, categoria: 'qualidade' },
      { ordem: 3, descricao: 'Relato de anomalia/segurança', pontos: 1, categoria: 'seguranca' },
      { ordem: 4, descricao: '5S Armazém', pontos: 1, categoria: '5s' },
    ],
  },
  {
    id: 'u-g1128',
    matricula: 'G1128',
    pin: '1234',
    name: 'Eldenkleber',
    role: 'ajudante',
    roleTitle: 'Ajudante de Armazém',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: 'EFM maior ou igual a 85%', pontos: 2, categoria: 'eficiencia' },
      { ordem: 2, descricao: 'Erros de montagem > 2%', pontos: 2, categoria: 'qualidade' },
      { ordem: 3, descricao: 'Relato de anomalia/segurança', pontos: 1, categoria: 'seguranca' },
      { ordem: 4, descricao: '5S Armazém', pontos: 1, categoria: '5s' },
    ],
  },
  {
    id: 'u-g1125',
    matricula: 'G1125',
    pin: '1234',
    name: 'Natanael',
    role: 'ajudante',
    roleTitle: 'Ajudante de Armazém',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: 'EFM maior ou igual a 85%', pontos: 2, categoria: 'eficiencia' },
      { ordem: 2, descricao: 'Erros de montagem > 2%', pontos: 2, categoria: 'qualidade' },
      { ordem: 3, descricao: 'Relato de anomalia/segurança', pontos: 1, categoria: 'seguranca' },
      { ordem: 4, descricao: '5S Armazém', pontos: 1, categoria: '5s' },
    ],
  },
  {
    id: 'u-g1161',
    matricula: 'G1161',
    pin: '1234',
    name: 'Dimas',
    role: 'ajudante',
    roleTitle: 'Ajudante de Armazém',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: 'EFM maior ou igual a 85%', pontos: 2, categoria: 'eficiencia' },
      { ordem: 2, descricao: 'Erros de montagem > 2%', pontos: 2, categoria: 'qualidade' },
      { ordem: 3, descricao: 'Relato de anomalia/segurança', pontos: 1, categoria: 'seguranca' },
      { ordem: 4, descricao: '5S Armazém', pontos: 1, categoria: '5s' },
    ],
  },
  {
    id: 'u-g1160',
    matricula: 'G1160',
    pin: '1234',
    name: 'Admilton',
    role: 'ajudante',
    roleTitle: 'Ajudante de Armazém',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: 'EFM maior ou igual a 85%', pontos: 2, categoria: 'eficiencia' },
      { ordem: 2, descricao: 'Erros de montagem > 2%', pontos: 2, categoria: 'qualidade' },
      { ordem: 3, descricao: 'Relato de anomalia/segurança', pontos: 1, categoria: 'seguranca' },
      { ordem: 4, descricao: '5S Armazém', pontos: 1, categoria: '5s' },
    ],
  },
  {
    id: 'u-g1137',
    matricula: 'G1137',
    pin: '1234',
    name: 'Ozenildo',
    role: 'ajudante',
    roleTitle: 'Ajudante de Armazém',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: 'Garantir o mínimo de 50 SKUs de repack ou zerar a demanda', pontos: 2, categoria: 'operacao' },
      { ordem: 2, descricao: 'Abastecimento do picking diário', pontos: 2, categoria: 'operacao' },
      { ordem: 3, descricao: 'Garantir envio de quebras', pontos: 1, categoria: 'qualidade' },
      { ordem: 4, descricao: 'Garantir 5S do ambiente', pontos: 1, categoria: '5s' },
    ],
  },
  {
    id: 'u-g1001',
    matricula: 'G1001',
    pin: '1234',
    name: 'Dejean',
    role: 'ajudante',
    roleTitle: 'Ajudante de Armazém',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: '5S Armazém', pontos: 2, categoria: '5s' },
      { ordem: 2, descricao: 'Pallet rebatido', pontos: 2, categoria: 'operacao' },
      { ordem: 3, descricao: 'Recolhimento/colocação de NRI', pontos: 1, categoria: 'operacao' },
      { ordem: 4, descricao: 'Conferência da devolução', pontos: 1, categoria: 'qualidade' },
    ],
  },
  {
    id: 'u-g1088',
    matricula: 'G1088',
    pin: '1234',
    name: 'Gilson',
    role: 'ajudante',
    roleTitle: 'Ajudante de Armazém',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: '98% de acuracidade no recolhimento de validades', pontos: 2, categoria: 'qualidade' },
      { ordem: 2, descricao: '5S e abastecimento do picking', pontos: 2, categoria: '5s' },
      { ordem: 3, descricao: 'Relato de anomalia/bloqueio de PNC', pontos: 1, categoria: 'seguranca' },
      { ordem: 4, descricao: '100% de precisão no FEFO', pontos: 1, categoria: 'qualidade' },
    ],
  },

  // ==========================================
  // CARGO: CONFERENTE (2 Colaboradores)
  // ==========================================
  {
    id: 'u-g1121',
    matricula: 'G1121',
    pin: '1234',
    name: 'Cicero',
    role: 'conferente',
    roleTitle: 'Conferente',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: 'Zero carta controle', pontos: 2, categoria: 'qualidade' },
      { ordem: 2, descricao: '98% de eficiência nas conferências de mix', pontos: 2, categoria: 'eficiencia' },
      { ordem: 3, descricao: 'Envio dos IVs do armazém (quebras/jornada/ressuprimento)', pontos: 1, categoria: 'operacao' },
      { ordem: 4, descricao: '5S Armazém', pontos: 1, categoria: '5s' },
    ],
  },
  {
    id: 'u-g1145',
    matricula: 'G1145',
    pin: '1234',
    name: 'Gladson',
    role: 'conferente',
    roleTitle: 'Conferente',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: 'Menos de 15 minutos de conferência', pontos: 2, categoria: 'eficiencia' },
      { ordem: 2, descricao: '95% de acuracidade na primeira contagem', pontos: 2, categoria: 'qualidade' },
      { ordem: 3, descricao: 'Organização de ativos de giro', pontos: 1, categoria: 'operacao' },
      { ordem: 4, descricao: 'Aderência à blitz de refugo (2 veículos por dia)', pontos: 1, categoria: 'qualidade' },
    ],
  },

  // ==========================================
  // CARGO: EMPILHADOR (3 Colaboradores)
  // ==========================================
  {
    id: 'u-g1013',
    matricula: 'G1013',
    pin: '1234',
    name: 'Paulo Pereira',
    role: 'empilhador',
    roleTitle: 'Empilhador',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: 'Zero quebras por movimentação', pontos: 2, categoria: 'qualidade' },
      { ordem: 2, descricao: 'EFC maior ou igual a 96%', pontos: 2, categoria: 'eficiencia' },
      { ordem: 3, descricao: 'Relato de segurança/anomalia', pontos: 1, categoria: 'seguranca' },
      { ordem: 4, descricao: '5S Área de Empilhadeira', pontos: 1, categoria: '5s' },
    ],
  },
  {
    id: 'u-g1093',
    matricula: 'G1093',
    pin: '1234',
    name: 'Ronildo',
    role: 'empilhador',
    roleTitle: 'Empilhador',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: 'Zero quebras por movimentação', pontos: 2, categoria: 'qualidade' },
      { ordem: 2, descricao: 'Veículos descarregados antes das 22:00', pontos: 2, categoria: 'eficiencia' },
      { ordem: 3, descricao: 'Relatos de segurança/anomalia', pontos: 1, categoria: 'seguranca' },
      { ordem: 4, descricao: '5S Empilhadeira', pontos: 1, categoria: '5s' },
    ],
  },
  {
    id: 'u-g1071',
    matricula: 'G1071',
    pin: '1234',
    name: 'Marivaldo',
    role: 'empilhador',
    roleTitle: 'Empilhador',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: 'Zero quebras por movimentação', pontos: 2, categoria: 'qualidade' },
      { ordem: 2, descricao: 'Descarregamento dentro da meta de 01:20', pontos: 2, categoria: 'eficiencia' },
      { ordem: 3, descricao: 'Relatos de segurança/anomalia', pontos: 1, categoria: 'seguranca' },
      { ordem: 4, descricao: '5S Empilhadeira', pontos: 1, categoria: '5s' },
    ],
  },

  // ==========================================
  // CARGO: MANOBRISTA (1 Colaborador)
  // ==========================================
  {
    id: 'u-g1055',
    matricula: 'G1055',
    pin: '1234',
    name: 'Diogenes',
    role: 'manobrista',
    roleTitle: 'Manobrista',
    accessLevel: 'operador',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    pontuacaoMaxima: 6,
    metas: [
      { ordem: 1, descricao: '5S Frota', pontos: 2, categoria: '5s' },
      { ordem: 2, descricao: 'Abastecimento 100% diesel', pontos: 2, categoria: 'operacao' },
      { ordem: 3, descricao: 'Abastecer com ARLA ao menos uma vez por semana em 100% da frota', pontos: 1, categoria: 'operacao' },
      { ordem: 4, descricao: 'Relatos de segurança/anomalia', pontos: 1, categoria: 'seguranca' },
    ],
  },
];

// Base zerada para início real da Liga DPO (sem registros inventados)
export const INITIAL_DAILY_RECORDS: DailyRecord[] = [];

// Pontuação histórica inicial zerada para todos os 15 colaboradores
export const HISTORICAL_SCORES: Record<string, number> = {};

// Submissões 5S zeradas
export const INITIAL_FIVE_S: FiveSSubmission[] = [];

// Contestações e críticas zeradas
export const INITIAL_CRITIQUES: CritiqueRequest[] = [];

