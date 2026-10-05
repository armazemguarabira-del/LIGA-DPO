export type JobRole = 'ajudante' | 'empilhador' | 'conferente' | 'manobrista';

export type AccessLevel = 'operador' | 'supervisor' | 'gerente';

export interface MetaItem {
  ordem: number; // 1, 2, 3, 4
  descricao: string;
  pontos: number; // typically 2, 2, 1, 1 summing to 6 pts max
  categoria?: 'eficiencia' | 'qualidade' | 'seguranca' | '5s' | 'operacao';
}

export interface User {
  id: string;
  matricula: string; // Ex: G1154, G1001
  pin: string;       // Password / PIN (default: 1234)
  name: string;
  role: JobRole;
  roleTitle: string;
  accessLevel: AccessLevel;
  avatar: string;    // Base64 or URL
  status: 'ativo' | 'inativo';
  desqualificado?: boolean;           // Desqualificado da Liga pelo gestor
  motivoDesqualificacao?: string;     // Motivo informado pelo gestor
  dataDesqualificacao?: string;       // Data/hora da desqualificação
  desqualificadoPor?: string;         // Nome do gestor responsável
  pontuacaoMaxima: number; // 6
  metas: MetaItem[]; // Exactly 4 individual metas summing to 6 points
}

export interface DailyRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  month: number; // 1 - 12
  year: number;  // 2026
  metaStatus: Record<number, boolean>; // ordem (1,2,3,4) -> boolean achieved
  metaNotes?: Record<number, string>;
  calculatedScore: number; // 0 to 6.0 points
  fiveSPhotoUrl?: string;
  fiveSSector?: string;
  fiveSApproved?: boolean;
  notes?: string;
}

export interface FiveSSubmission {
  id: string;
  userId: string;
  userName: string;
  userRole: JobRole;
  date: string;
  sector: string;
  photoUrl: string;
  seiri: boolean;    // Utilização & Descarte
  seiton: boolean;   // Organização & Identificação
  seiso: boolean;    // Limpeza & Inspeção
  seiketsu: boolean; // Padronização & Saúde
  shitsuke: boolean; // Autodisciplina & Segurança/EPI
  notes: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  pointsAwarded: number; // e.g. 1 or 2 pts
  evaluatedBy?: string;
  evaluatedAt?: string;
  feedback?: string;
  isExtraArea?: boolean; // 5S em mais de uma área do armazém (critério de desempate)
  importedByConferente?: string; // e.g. "Cicero (Conferente)"
}

export interface SafetyAnomalyReport {
  id: string;
  userId: string;
  userName: string;
  userMatricula: string;
  userRole: JobRole;
  date: string; // YYYY-MM-DD
  time: string;
  sector: string;
  photoUrl: string; // Captured via WebCam or upload
  description: string;
  type: 'seguranca' | 'anomalia';
  status: 'pendente' | 'aprovado' | 'rejeitado';
  notes?: string;
  evaluatedBy?: string;
  evaluatedAt?: string;
  pointsAwarded?: number;
  feedback?: string;
}

export interface DPONotification {
  id: string;
  userId: string; // Colaborador destinatário ou 'gestor'
  type: '5s_approved' | '5s_rejected' | 'anomaly_approved' | 'anomaly_rejected' | 'critique_resolved' | 'pending_review' | 'colaborador_desqualificado' | 'colaborador_requalificado';
  title: string;
  message: string;
  pointsAwarded?: number;
  date: string;
  timestamp: string;
  read: boolean;
  relatedId?: string;
  photoUrl?: string;
  sector?: string;
  authorName?: string;
}

export interface CritiqueRequest {
  id: string;
  userId: string;
  userName: string;
  userMatricula: string;
  userRole: JobRole;
  date: string; // YYYY-MM-DD
  month: number; // 1 - 12
  metaDescricao: string;
  metaOrdem?: number;
  justification: string;
  evidencePhotoUrl?: string; // Evidência fotográfica para o Gestor avaliar
  requestedPoints: number;
  status: 'pendente' | 'deferida' | 'indeferida';
  createdAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  supervisorNotes?: string;
  pointsAwarded?: number;
}

export interface DPOParameters {
  ligaNome: string;
  pontuacaoMaximaPorColaborador: number; // 6
  observacao: string;
  temporadaAtiva: string;
  lastUpdated: string;
}

export interface RankingEntry {
  userId: string;
  user: User;
  totalScore: number; // Accumulated points across the month or season
  todayScore: number; // Today points (0 to 6.0)
  maxScore: number;   // 6.0
  avgAttainment: number; // in % (todayScore / 6 * 100)
  metasCompletedToday: number; // e.g. 4/4 or 3/4
  fiveSApprovedCount: number;
  // CRITÉRIOS DE DESEMPATE OFICIAIS
  safetyReportsCount: number; // 1º Critério de desempate: Relatos de segurança/anomalia realizados
  extraFiveSCount: number;    // 2º Critério de desempate: 5S em mais de uma área do armazém
  position: number;   // In active filtered view
  categoryPosition: number; // In their specific cargo
  generalPosition: number;  // In the entire 15-collaborator league
  trend: 'up' | 'down' | 'equal';
  todayStatus: 'excelente' | 'atingiu' | 'parcial' | 'alerta';
  historyScores: { date: string; score: number }[];
  daysWorkedCount: number;
  isDesqualificado?: boolean;
  motivoDesqualificacao?: string;
  dataDesqualificacao?: string;
  desqualificadoPor?: string;
}

// JSON Schema for Import/Export matching user's requested specification
export interface LigaImportCargo {
  cargo: string;
  colaboradores: {
    nome: string;
    matricula?: string;
    pontuacao_maxima: number;
    metas: {
      ordem: number;
      descricao: string;
      pontos: number;
    }[];
  }[];
}

export interface LigaImportSchema {
  liga: string;
  observacao: string;
  pontuacao_maxima_por_colaborador: number;
  resumo?: {
    total_cargos: number;
    total_colaboradores: number;
    total_metas: number;
  };
  cargos: LigaImportCargo[];
}

export const ROLE_LABELS: Record<JobRole, string> = {
  ajudante: 'Ajudante de Armazém',
  conferente: 'Conferente',
  empilhador: 'Empilhador',
  manobrista: 'Manobrista',
};

export const ROLE_ICONS: Record<JobRole, string> = {
  ajudante: '📦',
  conferente: '📋',
  empilhador: '🚜',
  manobrista: '🚛',
};

export const ROLE_BADGE_COLORS: Record<JobRole, { bg: string; text: string; border: string; glow: string; bar: string }> = {
  ajudante: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/10',
    bar: 'from-amber-500 to-amber-400',
  },
  conferente: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/10',
    bar: 'from-emerald-500 to-emerald-400',
  },
  empilhador: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/10',
    bar: 'from-blue-500 to-blue-400',
  },
  manobrista: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/10',
    bar: 'from-purple-500 to-purple-400',
  },
};

export interface MonthInfo {
  number: number;
  name: string;
  shortName: string;
  daysInMonth: number;
}

export const MONTHS_OF_YEAR: MonthInfo[] = [
  { number: 1, name: 'Janeiro', shortName: 'Jan', daysInMonth: 31 },
  { number: 2, name: 'Fevereiro', shortName: 'Fev', daysInMonth: 28 },
  { number: 3, name: 'Março', shortName: 'Mar', daysInMonth: 31 },
  { number: 4, name: 'Abril', shortName: 'Abr', daysInMonth: 30 },
  { number: 5, name: 'Maio', shortName: 'Mai', daysInMonth: 31 },
  { number: 6, name: 'Junho', shortName: 'Jun', daysInMonth: 30 },
  { number: 7, name: 'Julho', shortName: 'Jul', daysInMonth: 31 },
  { number: 8, name: 'Agosto', shortName: 'Ago', daysInMonth: 31 },
  { number: 9, name: 'Setembro', shortName: 'Set', daysInMonth: 30 },
  { number: 10, name: 'Outubro', shortName: 'Out', daysInMonth: 31 },
  { number: 11, name: 'Novembro', shortName: 'Nov', daysInMonth: 30 },
  { number: 12, name: 'Dezembro', shortName: 'Dez', daysInMonth: 31 },
];
