import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DEFAULT_PAGE_CONFIG, INTERVIEW_SECTIONS } from '../data/interviewSchema';
import {
  AIAnalysisReport,
  Company,
  DiagnosticSummary,
  ImprovementAction,
  Interview,
  InterviewSection,
  KPIArea,
  KPIResult,
  MonthlyMetrics,
  PageConfig,
} from '../types/domain';
import { generateDiagnosticSummary } from './diagnosticEngine';
import { formatPeriodLabel } from './formatters';
import { calculateKPIs, getOverallCompliance } from './kpiEngine';

const NAVY: [number, number, number] = [11, 30, 59];
const GREEN: [number, number, number] = [21, 128, 61];
const SLATE: [number, number, number] = [71, 85, 105];
const LIGHT_BG: [number, number, number] = [248, 250, 252];

function addSectionHeading(doc: jsPDF, title: string, y: number): number {
  if (y > 258) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text(title, 14, y);
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.6);
  doc.line(14, y + 2, 196, y + 2);
  return y + 9;
}

function addParagraph(doc: jsPDF, text: string, y: number, fontSize = 10): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(30, 41, 59);
  const lines = doc.splitTextToSize(text, 182) as string[];
  for (const line of lines) {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 14, y);
    y += 5;
  }
  return y + 2;
}

function addBulletList(doc: jsPDF, items: string[], y: number, emptyText = 'Sin registros para esta categoría.'): number {
  if (items.length === 0) {
    return addParagraph(doc, `• ${emptyText}`, y, 9.5);
  }
  for (const item of items) {
    y = addParagraph(doc, `• ${item}`, y, 9.5);
  }
  return y;
}

function drawVectorAreaChart(doc: jsPDF, kpis: KPIResult[], startY: number): number {
  let y = startY;
  if (y > 195) {
    doc.addPage();
    y = 20;
  }

  const areas: KPIArea[] = [
    'Compras y Abastecimiento',
    'Almacenamiento e Inventarios',
    'Producción',
    'Transporte y Distribución',
    'Servicio al Cliente',
    'Financieros',
  ];

  const areaStats = areas.map((area) => {
    const list = kpis.filter((k) => k.area === area && k.complianceLevel !== null);
    const avg = list.length
      ? list.reduce((a, k) => a + Math.min(100, k.complianceLevel ?? 0), 0) / list.length
      : null;
    return { area, avg };
  });

  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 74, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Gráfica Estadística: Nivel de Cumplimiento Promedio por Área (%)', 18, y + 8);

  let rowY = y + 17;
  const barX = 80;
  const maxBarW = 92;

  for (const item of areaStats) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(item.area, 18, rowY + 3.5);

    doc.setFillColor(226, 232, 240);
    doc.rect(barX, rowY, maxBarW, 4.5, 'F');

    if (item.avg !== null) {
      const pct = Math.min(100, Math.max(0, item.avg));
      const fillW = (pct / 100) * maxBarW;
      if (pct >= 90) {
        doc.setFillColor(...GREEN);
      } else if (pct >= 75) {
        doc.setFillColor(217, 119, 6);
      } else {
        doc.setFillColor(220, 38, 38);
      }
      doc.rect(barX, rowY, fillW, 4.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text(`${pct.toFixed(1)}%`, barX + maxBarW + 4, rowY + 3.5);
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...SLATE);
      doc.text('Sin datos', barX + maxBarW + 4, rowY + 3.5);
    }
    rowY += 9;
  }

  return y + 80;
}

function getLastTableY(doc: jsPDF, fallback: number): number {
  const anyDoc = doc as unknown as { lastAutoTable?: { finalY?: number } };
  return (anyDoc.lastAutoTable?.finalY ?? fallback) + 8;
}

export function exportCompanyReportPDF(params: {
  company: Company;
  interviews: Interview[];
  metrics: MonthlyMetrics[];
  plans: ImprovementAction[];
  aiReport?: AIAnalysisReport;
  customTargets?: Record<string, number>;
  customSections?: InterviewSection[];
  pageConfig?: PageConfig;
}): void {
  const {
    company,
    interviews,
    metrics,
    plans,
    aiReport,
    customTargets,
    customSections = INTERVIEW_SECTIONS,
    pageConfig = DEFAULT_PAGE_CONFIG,
  } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const kpis = calculateKPIs(metrics, customTargets);
  const diagnostic: DiagnosticSummary = generateDiagnosticSummary(company.id, interviews, kpis);
  const latestInterview = [...interviews].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const overall = getOverallCompliance(kpis);

  // 1. PORTADA
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 95, 'F');
  doc.setFillColor(...GREEN);
  doc.rect(0, 95, 210, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(187, 247, 208);
  doc.text(
    pageConfig.pdfHeaderTitle || 'INFORME TÉCNICO DE DIAGNÓSTICO EMPRESARIAL Y GESTIÓN LOGÍSTICA',
    16,
    26
  );

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(company.name, 178) as string[];
  doc.text(titleLines, 16, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(226, 232, 240);
  doc.text(`NIT: ${company.nit || 'No registrado'}  ·  Sector: ${company.sector}`, 16, 72);
  doc.text(`Ciudad: ${company.city || 'No registrada'}  ·  Representante: ${company.representativeName || 'No registrado'}`, 16, 80);

  if (company.isDemo) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(253, 224, 71);
    doc.text('DOCUMENTO GENERADO CON DATOS DE DEMOSTRACIÓN', 16, 89);
  }

  let y = 115;
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, y, 178, 52, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text('Resumen Ejecutivo del Expediente', 22, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Fecha de emisión del informe: ${new Date().toLocaleDateString('es-CO')}`, 22, y + 20);
  doc.text(`Entrevistas registradas: ${interviews.length}`, 22, y + 27);
  doc.text(`Periodos cuantitativos analizados: ${metrics.length > 0 ? metrics.map((m) => formatPeriodLabel(m.period)).join(', ') : 'Sin periodos cargados'}`, 22, y + 34);
  doc.text(`Indicadores calculados: ${kpis.filter((k) => k.value !== null).length} de ${kpis.length}`, 22, y + 41);
  doc.text(`Cumplimiento general empresarial: ${overall !== null ? `${overall}%` : 'Información insuficiente'}`, 22, y + 48);

  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text('Diagnóstico Empresarial y Gestión Logística · Reporte Corporativo Integral', 16, 282);

  // Page 2 onwards
  doc.addPage();
  y = 20;

  // 2. INTRODUCCIÓN
  y = addSectionHeading(doc, '2. Introducción', y);
  y = addParagraph(
    doc,
    pageConfig.pdfIntroText?.trim()
      ? pageConfig.pdfIntroText
      : `El presente informe consolida los resultados del diagnóstico empresarial y evaluación de procesos logísticos aplicado a ${company.name} (sector ${company.sector}). La evaluación integra información cualitativa recolectada en entrevista estructurada y datos cuantitativos operativos y financieros, con el propósito de detectar brechas, calcular indicadores de gestión y formular acciones concretas de mejoramiento.`,
    y
  );

  // 3. OBJETIVOS DEL DIAGNÓSTICO
  y = addSectionHeading(doc, '3. Objetivos del Diagnóstico', y + 2);
  y = addBulletList(doc, [
    'Conocer el funcionamiento administrativo, operativo y logístico actual de la organización.',
    'Identificar cuellos de botella, riesgos operativos, sobrecostos y oportunidades de mejora en la cadena logística.',
    'Calcular automáticamente los indicadores clave de desempeño (KPI) por área y compararlos frente a metas establecidas.',
    'Construir la matriz DOFA y un plan de mejoramiento accionable con responsables, metas y cronograma.',
  ], y);

  // 4. INFORMACIÓN GENERAL
  y = addSectionHeading(doc, '4. Información General de la Empresa', y + 2);
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    head: [['Campo', 'Detalle', 'Campo', 'Detalle']],
    body: [
      ['Razón Social', company.name, 'NIT', company.nit || '—'],
      ['Sector', company.sector, 'Actividad Económica', company.economicActivity || '—'],
      ['Dirección', company.address || '—', 'Ciudad', company.city || '—'],
      ['Representante', company.representativeName || '—', 'Cargo Entrevistado', company.intervieweeRole || '—'],
      ['Empleados', String(company.employeesCount ?? '—'), 'Tiempo Operando', company.yearsOperating || '—'],
      ['Teléfono', company.phone || '—', 'Correo Electrónico', company.email || '—'],
    ],
  });
  y = getLastTableY(doc, y + 40);

  // 5. METODOLOGÍA DE ENTREVISTA
  y = addSectionHeading(doc, '5. Metodología de Entrevista', y);
  y = addParagraph(
    doc,
    'Se aplicó un instrumento estructurado dividido en 10 secciones temáticas (Secciones A a J), combinando preguntas abiertas, selección única, selección múltiple y datos cuantitativos de los últimos meses evaluados. Cada hallazgo fue contrastado con la evidencia numérica disponible sin supuestos ni datos fabricados.'
    , y
  );

  // 6. RESULTADOS DE LA ENTREVISTA
  y = addSectionHeading(doc, '6. Resultados de la Entrevista', y + 2);
  if (!latestInterview) {
    y = addParagraph(doc, 'No se ha registrado ninguna entrevista para esta empresa.', y);
  } else {
    y = addParagraph(
      doc,
      `Entrevista: ${latestInterview.title} · Fecha: ${latestInterview.interviewDate} · Estado: ${latestInterview.status.toUpperCase()}`,
      y,
      9.5
    );
    const interviewRows: string[][] = [];
    for (const sec of customSections) {
      if (sec.optional && !latestInterview.hasProductionProcess) {
        interviewRows.push([sec.title, 'No aplica']);
        continue;
      }
      for (const q of sec.questions) {
        const raw = latestInterview.answers[q.id];
        const formatted = Array.isArray(raw) ? raw.join(', ') : raw !== undefined && raw !== '' ? String(raw) : 'Sin respuesta';
        interviewRows.push([`${sec.code}${q.number}. ${q.label}`, formatted]);
      }
    }
    autoTable(doc, {
      startY: y,
      theme: 'striped',
      headStyles: { fillColor: NAVY, textColor: 255, fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      columnStyles: { 0: { cellWidth: 78 }, 1: { cellWidth: 104 } },
      head: [['Pregunta / Sección', 'Respuesta Registrada']],
      body: interviewRows,
    });
    y = getLastTableY(doc, y + 40);
  }

  // 7. MAPA DE PROCESOS LOGÍSTICOS
  y = addSectionHeading(doc, '7. Mapa de Procesos Logísticos', y);
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    head: [['Proceso Logístico', 'Sección', 'Estado', 'Hallazgos Principales']],
    body: diagnostic.processes.map((p) => [
      p.processName,
      p.sectionCode,
      p.status,
      p.findings.join(' '),
    ]),
  });
  y = getLastTableY(doc, y + 30);

  // 8. DIAGNÓSTICO EMPRESARIAL
  y = addSectionHeading(doc, '8. Diagnóstico Empresarial', y);
  y = addParagraph(doc, 'Procesos Críticos Identificados:', y, 10);
  y = addBulletList(doc, diagnostic.criticalProcesses, y, 'No se detectaron procesos críticos con la información actual.');
  y = addParagraph(doc, 'Problemas Logísticos:', y + 1, 10);
  y = addBulletList(doc, diagnostic.logisticsProblems, y, 'Sin problemas logísticos críticos reportados.');
  y = addParagraph(doc, 'Riesgos Operativos:', y + 1, 10);
  y = addBulletList(doc, diagnostic.operationalRisks, y, 'Sin riesgos operativos graves detectados.');

  // 9. INDICADORES CON FÓRMULAS Y RESULTADOS
  y = addSectionHeading(doc, '9. Indicadores de Gestión (KPIs) con Fórmulas y Resultados', y + 2);
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 28 },
      2: { cellWidth: 44 },
      3: { cellWidth: 26 },
      4: { cellWidth: 20 },
      5: { cellWidth: 30 },
    },
    head: [['Indicador', 'Área', 'Fórmula Matemática', 'Resultado', 'Meta', 'Estado / Cumpl.']],
    body: kpis.map((k) => [
      k.name,
      k.area,
      k.formula,
      k.formattedValue,
      k.formattedTarget,
      k.complianceLevel !== null ? `${k.status.toUpperCase()} (${k.complianceLevel}%)` : 'Insuficiente',
    ]),
  });
  y = getLastTableY(doc, y + 50);

  // 10. GRÁFICAS ESTADÍSTICAS
  y = addSectionHeading(doc, '10. Gráficas Estadísticas', y);
  y = drawVectorAreaChart(doc, kpis, y);

  // 11. ANÁLISIS DE RESULTADOS
  y = addSectionHeading(doc, '11. Análisis de Resultados', y + 2);
  const computedCount = kpis.filter((k) => k.value !== null).length;
  const criticalCount = kpis.filter((k) => k.status === 'critico').length;
  const alertCount = kpis.filter((k) => k.status === 'alerta').length;
  const okCount = kpis.filter((k) => k.status === 'cumple').length;
  y = addParagraph(
    doc,
    `De los ${kpis.length} indicadores evaluados, se calcularon ${computedCount} indicadores con datos reales del periodo. De ellos, ${okCount} cumplen satisfactoriamente la meta, ${alertCount} se encuentran en estado de alerta y ${criticalCount} en estado crítico. El porcentaje general de cumplimiento empresarial se ubica en ${overall !== null ? `${overall}%` : 'Información insuficiente para calcular'}.`,
    y
  );
  if (aiReport) {
    y = addParagraph(doc, `Interpretación Analítica IA: ${aiReport.kpiInterpretation}`, y, 9.5);
  }

  // 12. MATRIZ DOFA
  y = addSectionHeading(doc, '12. Matriz DOFA', y + 2);
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59], valign: 'top' },
    head: [['Fortalezas (Interno Positivo)', 'Debilidades (Interno Negativo)']],
    body: [[
      diagnostic.swot.fortalezas.map((x) => `• ${x}`).join('\n') || 'Sin fortalezas registradas.',
      diagnostic.swot.debilidades.map((x) => `• ${x}`).join('\n') || 'Sin debilidades registradas.',
    ]],
  });
  y = getLastTableY(doc, y + 25);
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: GREEN, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59], valign: 'top' },
    head: [['Oportunidades (Externo / Mejora)', 'Amenazas (Riesgos del Entorno)']],
    body: [[
      diagnostic.swot.oportunidades.map((x) => `• ${x}`).join('\n') || 'Sin oportunidades registradas.',
      diagnostic.swot.amenazas.map((x) => `• ${x}`).join('\n') || 'Sin amenazas registradas.',
    ]],
  });
  y = getLastTableY(doc, y + 25);

  // 13. RECOMENDACIONES
  y = addSectionHeading(doc, '13. Recomendaciones Estratégicas y de Mejora', y);
  if (aiReport) {
    y = addParagraph(doc, `Resumen Ejecutivo IA (${aiReport.periodLabel}): ${aiReport.executiveSummary}`, y, 9.5);
    y = addParagraph(doc, 'Estrategias Logísticas Recomendadas:', y, 9.5);
    y = addBulletList(doc, aiReport.logisticsStrategies, y);
  } else {
    const kpiRecs = kpis
      .filter((k) => k.status === 'critico' || k.status === 'alerta')
      .map((k) => `[${k.area} - ${k.name}] ${k.recommendation}`);
    y = addBulletList(doc, kpiRecs, y, 'Todos los indicadores calculados cumplen con sus metas establecidas o faltan datos numéricos.');
  }

  // 14. PLAN DE MEJORAMIENTO
  y = addSectionHeading(doc, '14. Plan de Mejoramiento', y + 2);
  if (plans.length === 0) {
    y = addParagraph(doc, 'No hay acciones registradas en el Plan de Mejoramiento para esta empresa.', y);
  } else {
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: NAVY, textColor: 255, fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      head: [['Problema', 'Área', 'Acción de Mejora', 'KPI / Meta', 'Responsable', 'Plazo', 'Estado']],
      body: plans.map((p) => [
        p.problemIdentified,
        p.responsibleArea,
        p.improvementAction,
        `${p.relatedKpi} (${p.target})`,
        p.responsiblePerson,
        `${p.startDate} / ${p.endDate}`,
        p.status,
      ]),
    });
    y = getLastTableY(doc, y + 35);
  }

  // 15. CONCLUSIONES
  y = addSectionHeading(doc, '15. Conclusiones', y);
  if (aiReport?.conclusions) {
    addParagraph(doc, aiReport.conclusions, y);
  } else {
    addParagraph(
      doc,
      `El diagnóstico aplicado a ${company.name} permite visualizar con objetividad la situación de sus procesos logísticos y administrativos. Con un cumplimiento general del ${overall !== null ? `${overall}%` : 'pendiente por falta de datos numéricos'}, se recomienda ejecutar prioritariamente las acciones del Plan de Mejoramiento enfocadas en los procesos críticos y mantener la medición mensual de indicadores para validar el impacto de cada intervención.`,
      y
    );
  }

  const safeSlug = company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  doc.save(`informe-diagnostico-${safeSlug}.pdf`);
}

export function exportConsolidatedReportPDF(params: {
  companies: Company[];
  interviews: Interview[];
  metrics: MonthlyMetrics[];
  plans: ImprovementAction[];
  customTargets: Record<string, Record<string, number>>;
}): void {
  const { companies, interviews, metrics, plans, customTargets } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 72, 'F');
  doc.setFillColor(...GREEN);
  doc.rect(0, 72, 210, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('INFORME CONSOLIDADO DE DIAGNÓSTICO EMPRESARIAL', 16, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(226, 232, 240);
  doc.text(`Empresas evaluadas: ${companies.length}  ·  Fecha: ${new Date().toLocaleDateString('es-CO')}`, 16, 48);

  let y = 88;
  y = addSectionHeading(doc, '1. Resumen Comparativo de Empresas', y);

  const summaryRows = companies.map((c) => {
    const cInterviews = interviews.filter((i) => i.companyId === c.id);
    const cMetrics = metrics.filter((m) => m.companyId === c.id);
    const cKpis = calculateKPIs(cMetrics, customTargets[c.id]);
    const compliance = getOverallCompliance(cKpis);
    const critCount = cKpis.filter((k) => k.status === 'critico').length;
    const cPlans = plans.filter((p) => p.companyId === c.id).length;
    return [
      c.name,
      c.sector,
      c.city || '—',
      String(cInterviews.length),
      compliance !== null ? `${compliance}%` : 'Sin datos',
      String(critCount),
      String(cPlans),
    ];
  });

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    head: [['Empresa', 'Sector', 'Ciudad', 'Entrevistas', 'Cumplimiento', 'KPIs Críticos', 'Acciones Plan']],
    body: summaryRows,
  });

  y = getLastTableY(doc, y + 40);
  y = addSectionHeading(doc, '2. Estado Global de Planes de Mejoramiento', y);
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    headStyles: { fillColor: GREEN, textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    head: [['Empresa', 'Área', 'Acción de Mejora', 'Meta', 'Responsable', 'Estado']],
    body: plans.map((p) => {
      const compName = companies.find((c) => c.id === p.companyId)?.name ?? p.companyId;
      return [compName, p.responsibleArea, p.improvementAction, p.target, p.responsiblePerson, p.status];
    }),
  });

  doc.save(`informe-consolidado-diagnostico-empresarial.pdf`);
}
