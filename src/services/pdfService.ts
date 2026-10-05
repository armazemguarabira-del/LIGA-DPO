import jsPDF from 'jspdf';
import { JobRole, ROLE_LABELS } from '../types/dpo';
import { storageService } from './storageService';

export interface SupervisorReportData {
  supervisorName: string;
  supervisorRole: string;
  date: string;
  department: string;
  roleFilter?: JobRole | 'all';
}

export function generateSupervisorPDF(data: SupervisorReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const rankings = storageService.calculateRanking(data.roleFilter);
  const fiveSSubmissions = storageService.getFiveSSubmissions();
  const params = storageService.getParameters();

  // Metrics summary
  const totalCollaborators = rankings.length;
  const avgAttainment =
    totalCollaborators > 0
      ? (rankings.reduce((acc, r) => acc + r.avgAttainment, 0) / totalCollaborators).toFixed(1)
      : '0';
  const totalScoreToday = rankings.reduce((acc, r) => acc + r.todayScore, 0);
  const avgScoreToday =
    totalCollaborators > 0 ? (totalScoreToday / totalCollaborators).toFixed(1) : '0';
  const approved5SCount = fiveSSubmissions.filter(
    (s) => s.status === 'aprovado' && s.date === data.date
  ).length;

  // Header Background Banner
  doc.setFillColor(11, 15, 23); // dark industrial slate
  doc.rect(0, 0, 210, 40, 'F');

  // Title
  doc.setTextColor(245, 158, 11); // amber-500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LIGA DPO DO ARMAZÉM - RELATÓRIO DO SUPERVISOR', 14, 16);

  // Subtitle
  doc.setTextColor(226, 232, 240); // slate-200
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Excelência em Metas & Gestão Operacional • ${params.temporadaAtiva} • Teto 6.0 Pts`,
    14,
    24
  );
  doc.text(`Data de Emissão: ${data.date} | Setor: ${data.department}`, 14, 31);

  // Status Badge in header
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(150, 10, 46, 20, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ATINGIMENTO DPO', 173, 17, { align: 'center' });
  doc.setFontSize(13);
  doc.text(`${avgAttainment}%`, 173, 25, { align: 'center' });

  // 1. DADOS DA SUPERVISÃO
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. DADOS OPERACIONAIS & SUPERVISÃO', 14, 50);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 54, 182, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Supervisor Responsável:', 18, 61);
  doc.text('Filtro de Cargo:', 18, 68);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.supervisorName, 62, 61);
  doc.text(
    data.roleFilter && data.roleFilter !== 'all' ? ROLE_LABELS[data.roleFilter] : 'Geral (Todos os 4 Cargos)',
    62,
    68
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total de Operadores:', 122, 61);
  doc.text('Média Pontos Hoje:', 122, 68);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalCollaborators} colaboradores`, 162, 61);
  doc.text(`${avgScoreToday} / 6.0 pts`, 162, 68);

  // Key KPI Cards (3 boxes)
  const cardY = 82;
  // Box 1: Atingimento
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(14, cardY, 56, 18, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14);
  doc.text('ATINGIMENTO MÉDIO', 18, cardY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${avgAttainment}%`, 18, cardY + 14);

  // Box 2: 5S Concluído
  doc.setFillColor(209, 250, 229); // emerald-100
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(77, cardY, 56, 18, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(6, 95, 70);
  doc.text('AUDITORIAS 5S NO DIA', 81, cardY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${approved5SCount} Aprovadas`, 81, cardY + 14);

  // Box 3: Pontos Totais
  doc.setFillColor(224, 231, 255); // indigo-100
  doc.setDrawColor(99, 102, 241);
  doc.roundedRect(140, cardY, 56, 18, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 48, 163);
  doc.text('PONTUAÇÃO MÁXIMA', 144, cardY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('6.0 Pontos/Dia', 144, cardY + 14);

  // 2. TABELA DE RANKING & METAS
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. RANKING DA LIGA & METAS INDIVIDUAIS DOS COLABORADORES', 14, 110);

  // Table Header
  let tableY = 116;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, tableY, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('POS', 17, tableY + 5.5);
  doc.text('MATRÍCULA', 27, tableY + 5.5);
  doc.text('COLABORADOR', 48, tableY + 5.5);
  doc.text('CARGO', 92, tableY + 5.5);
  doc.text('METAS', 132, tableY + 5.5);
  doc.text('HOJE', 152, tableY + 5.5);
  doc.text('ATING.%', 168, tableY + 5.5);
  doc.text('ACUM.', 184, tableY + 5.5);

  tableY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  rankings.forEach((entry, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(14, tableY, 182, 7, 'F');

    // Podium highlight
    if (idx === 0) doc.setTextColor(217, 119, 6); // gold
    else if (idx === 1) doc.setTextColor(71, 85, 105); // silver
    else if (idx === 2) doc.setTextColor(180, 83, 9); // bronze
    else doc.setTextColor(15, 23, 42);

    doc.setFont('helvetica', 'bold');
    doc.text(`#${entry.position}`, 17, tableY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(entry.user.matricula, 27, tableY + 5);
    doc.text(entry.user.name.substring(0, 22), 48, tableY + 5);
    doc.text(ROLE_LABELS[entry.user.role], 92, tableY + 5);

    // Metas count
    doc.text(`${entry.metasCompletedToday}/4`, 134, tableY + 5);

    // Today score
    doc.setFont('helvetica', 'bold');
    doc.text(`${entry.todayScore.toFixed(1)}/6.0`, 152, tableY + 5);

    // Attainment %
    doc.text(`${entry.avgAttainment}%`, 169, tableY + 5);

    // Total score
    doc.text(`${entry.totalScore} pts`, 184, tableY + 5);

    tableY += 7;
  });

  // Observations / DPO Rule
  const obsY = tableY + 10;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, obsY, 182, 18, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('OBSERVAÇÕES DA LIGA DPO:', 18, obsY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(
    params.observacao ||
      'A liga não diferencia horário. Os colaboradores competem por cargo, cada um com suas metas individuais.',
    18,
    obsY + 12
  );

  // Signatures
  const sigY = obsY + 28;
  doc.setDrawColor(148, 163, 184);
  doc.line(20, sigY + 12, 85, sigY + 12);
  doc.line(125, sigY + 12, 190, sigY + 12);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Assinatura do Supervisor DPO', 32, sigY + 17);
  doc.text('Assinatura da Gerência de Armazém', 135, sigY + 17);

  // Save PDF
  const filename = `relatorio-liga-dpo-${data.date}.pdf`;
  doc.save(filename);
}
