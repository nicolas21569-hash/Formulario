import * as XLSX from 'xlsx';
import { INTERVIEW_SECTIONS, WORKER_INTERVIEW_QUESTIONS } from '../data/interviewSchema';
import {
  Company,
  DiagnosticProblem,
  ImprovementAction,
  Interview,
  InterviewSection,
  MonthlyMetrics,
  Worker,
  WorkerInterview,
} from '../types/domain';
import { generateDiagnosticSummary } from './diagnosticEngine';
import { calculateKPIs, getOverallCompliance } from './kpiEngine';

function formatAns(val: unknown): string {
  if (Array.isArray(val)) return val.join(', ');
  if (val === undefined || val === null || val === '') return 'Sin respuesta';
  return String(val);
}

export function exportCompanyExcel(params: {
  company: Company;
  workers: Worker[];
  interviews: Interview[];
  workerInterviews: WorkerInterview[];
  metrics: MonthlyMetrics[];
  plans: ImprovementAction[];
  customProblems?: DiagnosticProblem[];
  customTargets?: Record<string, number>;
  customSections?: InterviewSection[];
}): void {
  const {
    company,
    workers,
    interviews,
    workerInterviews,
    metrics,
    plans,
    customProblems = [],
    customTargets = {},
    customSections = INTERVIEW_SECTIONS,
  } = params;

  const wb = XLSX.utils.book_new();
  const kpis = calculateKPIs(metrics, customTargets);
  const diagnostic = generateDiagnosticSummary(
    company.id,
    interviews,
    kpis,
    workerInterviews,
    workers,
    customProblems
  );
  const overall = getOverallCompliance(kpis);
  const latestInterview = [...interviews].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  // Hoja 1: Empresa y Organigrama
  const companyRows: Array<Record<string, string | number>> = [
    { Campo: 'Razón Social', Valor: company.name },
    { Campo: 'NIT', Valor: company.nit || '—' },
    { Campo: 'Sector', Valor: company.sector },
    { Campo: 'Actividad Económica', Valor: company.economicActivity || '—' },
    { Campo: 'Ciudad', Valor: company.city || '—' },
    { Campo: 'Dirección', Valor: company.address || '—' },
    { Campo: 'Teléfono Empresa', Valor: company.phone || '—' },
    { Campo: 'Correo Empresa', Valor: company.email || '—' },
    { Campo: 'Antigüedad de la Empresa', Valor: company.yearsOperating || '—' },
    { Campo: 'Número de Empleados', Valor: company.employeesCount ?? 0 },
    { Campo: 'Fecha de Registro', Valor: company.registrationDate || '—' },
    { Campo: 'Representante Legal / Propietario', Valor: company.representativeName || '—' },
    { Campo: 'Cargo del Representante', Valor: company.representativeRole || '—' },
    { Campo: 'Documento Representante', Valor: company.representativeDocument || '—' },
    { Campo: 'Teléfono Representante', Valor: company.representativePhone || '—' },
    { Campo: 'Correo Representante', Valor: company.representativeEmail || '—' },
    { Campo: 'Trabajador Entrevistado Principal', Valor: company.intervieweeName || '—' },
    { Campo: 'Cargo Entrevistado', Valor: company.intervieweeRole || '—' },
    { Campo: 'Área Entrevistado', Valor: company.intervieweeArea || '—' },
    { Campo: 'Antigüedad Entrevistado', Valor: company.intervieweeTenure || '—' },
    { Campo: 'Cuenta con Organigrama', Valor: company.hasOrgChart || '—' },
    { Campo: 'Descripción Organigrama', Valor: company.orgChartDescription || '—' },
    { Campo: 'Cumplimiento General KPIs (%)', Valor: overall !== null ? `${overall}%` : 'Información insuficiente' },
  ];
  const wsCompany = XLSX.utils.json_to_sheet(companyRows);

  if (company.existingPositions && company.existingPositions.length > 0) {
    XLSX.utils.sheet_add_aoa(
      wsCompany,
      [[''], ['CARGOS Y ESTRUCTURA ORGANIZACIONAL'], ['Cargo', 'Área', 'Trabajadores en el Cargo', 'Reporta a']],
      { origin: -1 }
    );
    XLSX.utils.sheet_add_aoa(
      wsCompany,
      company.existingPositions.map((p) => [p.positionTitle, p.area, p.employeesInRole, p.reportsTo || '—']),
      { origin: -1 }
    );
  }
  XLSX.utils.book_append_sheet(wb, wsCompany, 'Empresa y Organigrama');

  // Hoja 2: Trabajadores y Entrevistas Individuales
  const workerRows: Array<Record<string, string>> = [];
  for (const w of workers) {
    const wi = workerInterviews.find((item) => item.workerId === w.id);
    if (!wi) {
      workerRows.push({
        Trabajador: w.fullName,
        Cargo: w.role,
        Área: w.area,
        Antigüedad: w.tenure || '—',
        'Reporta a': w.reportsTo || '—',
        Estado_Entrevista: 'Sin entrevista',
        Pregunta: '—',
        Respuesta: 'Pendiente de entrevista individual',
      });
    } else {
      for (const q of WORKER_INTERVIEW_QUESTIONS) {
        workerRows.push({
          Trabajador: w.fullName,
          Cargo: w.role,
          Área: w.area,
          Antigüedad: w.tenure || '—',
          'Reporta a': w.reportsTo || '—',
          Estado_Entrevista: wi.status.toUpperCase(),
          Pregunta: `W${q.number}. ${q.label}`,
          Respuesta: formatAns(wi.answers[q.id]),
        });
      }
    }
  }
  const wsWorkers = XLSX.utils.json_to_sheet(
    workerRows.length > 0
      ? workerRows
      : [{ Mensaje: 'No hay trabajadores registrados para esta empresa.' }]
  );
  XLSX.utils.book_append_sheet(wb, wsWorkers, 'Entrevista Individual');

  // Hoja 3: Entrevista Logística
  const interviewRows: Array<Record<string, string>> = [];
  if (latestInterview) {
    for (const sec of customSections) {
      for (const q of sec.questions) {
        interviewRows.push({
          Sección: sec.title,
          Código: `${sec.code}${q.number}`,
          Pregunta: q.label,
          Respuesta: formatAns(latestInterview.answers[q.id]),
        });
      }
    }
  }
  const wsInterview = XLSX.utils.json_to_sheet(
    interviewRows.length > 0
      ? interviewRows
      : [{ Mensaje: 'Sin entrevista logística registrada.' }]
  );
  XLSX.utils.book_append_sheet(wb, wsInterview, 'Entrevista Logística');

  // Hoja 4: Datos Numéricos Mensuales
  const metricRows = [...metrics]
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((m) => ({
      Periodo: m.period,
      Pedidos_Recibidos: m.totalOrdersReceived ?? '',
      Pedidos_Entregados: m.totalOrdersDelivered ?? '',
      Entregas_A_Tiempo: m.ordersDeliveredOnTime ?? '',
      Pedidos_Con_Error: m.ordersWithErrors ?? '',
      Compras_Realizadas: m.purchasesMade ?? '',
      Proveedores_A_Tiempo: m.supplierOrdersOnTime ?? '',
      Dias_Abastecimiento: m.totalSupplyDays ?? '',
      Valor_Compras: m.totalPurchaseValue ?? '',
      Valor_Ventas: m.totalSalesValue ?? '',
      Costo_Ventas: m.costOfSales ?? '',
      Inventario_Inicial: m.initialInventory ?? '',
      Inventario_Final: m.finalInventory ?? '',
      Referencias_Evaluadas: m.inventoryReferencesChecked ?? '',
      Referencias_Exactas: m.inventoryReferencesAccurate ?? '',
      Valor_Productos_Vencidos: m.expiredGoodsValue ?? '',
      Costos_Almacenamiento: m.storageCosts ?? '',
      Costos_Transporte: m.transportCosts ?? '',
      Horas_Entrega: m.totalDeliveryHours ?? '',
      Pedidos_Preparados: m.unitsProduced ?? '',
      Pedidos_Con_Error_Prep: m.defectiveUnits ?? '',
      Horas_Preparacion: m.totalPreparationHours ?? '',
      Valor_Mermas_Averias: m.wasteAndLossValue ?? '',
      Devoluciones: m.returnsCount ?? '',
      Reclamaciones: m.claimsCount ?? '',
      Clientes_Atendidos: m.customersServed ?? '',
      Clientes_Satisfechos: m.satisfiedCustomers ?? '',
      Horas_Trabajadas: m.hoursWorked ?? '',
      Numero_Trabajadores: m.workersCount ?? '',
    }));
  const wsMetrics = XLSX.utils.json_to_sheet(
    metricRows.length > 0 ? metricRows : [{ Mensaje: 'Sin datos numéricos registrados.' }]
  );
  XLSX.utils.book_append_sheet(wb, wsMetrics, 'Datos Mensuales');

  // Hoja 5: Indicadores KPI
  const kpiRows = kpis.map((k) => ({
    Área: k.area,
    Indicador: k.name,
    Objetivo: k.objective,
    Fórmula: k.formula,
    Datos_Utilizados: k.dataUsed,
    Resultado: k.formattedValue,
    Meta: k.formattedTarget,
    Cumplimiento_Pct: k.complianceLevel !== null ? `${k.complianceLevel}%` : '—',
    Estado: k.status.toUpperCase(),
    Interpretación: k.interpretation,
    Recomendación: k.recommendation,
  }));
  const wsKpis = XLSX.utils.json_to_sheet(kpiRows);
  XLSX.utils.book_append_sheet(wb, wsKpis, 'Indicadores KPI');

  // Hoja 6: Diagnóstico Detallado de Problemas y Procesos
  const problemRows = diagnostic.detailedProblems.map((p) => ({
    Área_Afectada: p.affectedArea,
    Proceso_Afectado: p.affectedProcess,
    Descripción_Problema: p.description,
    Frecuencia: p.frequency,
    Nivel_Gravedad: p.severity,
    Consecuencias: p.consequences,
    Causas_Posibles: p.possibleCauses,
    Evidencias: p.evidence,
    Recomendaciones: p.recommendations,
    Origen: p.isAutoDetected ? 'Detectado automáticamente' : 'Registrado manualmente',
  }));
  const wsProblems = XLSX.utils.json_to_sheet(
    problemRows.length > 0 ? problemRows : [{ Mensaje: 'No hay problemas detallados registrados.' }]
  );
  XLSX.utils.book_append_sheet(wb, wsProblems, 'Diagnóstico Problemas');

  // Hoja 7: Plan de Mejoramiento
  const planRows = plans.map((p) => ({
    Problema_Identificado: p.problemIdentified,
    Área_Responsable: p.responsibleArea,
    Acción_Correctiva: p.improvementAction,
    Objetivo: p.objective,
    Indicador_Seguimiento: p.relatedKpi,
    Meta_Esperada: p.target,
    Responsable: p.responsiblePerson,
    Recursos_Necesarios: p.requiredResources,
    Fecha_Inicio: p.startDate,
    Fecha_Finalización: p.endDate,
    Estado: p.status,
  }));
  const wsPlan = XLSX.utils.json_to_sheet(
    planRows.length > 0 ? planRows : [{ Mensaje: 'Sin acciones registradas en el Plan de Mejoramiento.' }]
  );
  XLSX.utils.book_append_sheet(wb, wsPlan, 'Plan de Mejoramiento');

  const safeSlug = company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  XLSX.writeFile(wb, `diagnostico-empresarial-${safeSlug}.xlsx`);
}

export function exportConsolidatedExcel(params: {
  companies: Company[];
  workers: Worker[];
  interviews: Interview[];
  workerInterviews: WorkerInterview[];
  metrics: MonthlyMetrics[];
  plans: ImprovementAction[];
  customTargets: Record<string, Record<string, number>>;
}): void {
  const { companies, workers, interviews, workerInterviews, metrics, plans, customTargets } = params;
  const wb = XLSX.utils.book_new();

  const summaryRows = companies.map((c) => {
    const cInterviews = interviews.filter((i) => i.companyId === c.id);
    const cWorkers = workers.filter((w) => w.companyId === c.id);
    const cWI = workerInterviews.filter((wi) => wi.companyId === c.id);
    const cMetrics = metrics.filter((m) => m.companyId === c.id);
    const cKpis = calculateKPIs(cMetrics, customTargets[c.id]);
    const compliance = getOverallCompliance(cKpis);
    const cPlans = plans.filter((p) => p.companyId === c.id);
    return {
      Empresa: c.name,
      NIT: c.nit || '—',
      Sector: c.sector,
      Ciudad: c.city || '—',
      Empleados: c.employeesCount,
      Trabajadores_Registrados: cWorkers.length,
      Entrevistas_Individuales: cWI.length,
      Entrevistas_Logísticas: cInterviews.length,
      Meses_Evaluados: cMetrics.length,
      Cumplimiento_General: compliance !== null ? `${compliance}%` : 'Sin datos',
      KPIs_Críticos: cKpis.filter((k) => k.status === 'critico').length,
      Acciones_Mejora: cPlans.length,
    };
  });
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(summaryRows.length ? summaryRows : [{ Mensaje: 'Sin empresas registradas' }]),
    'Resumen Empresas'
  );

  const allPlans = plans.map((p) => ({
    Empresa: companies.find((c) => c.id === p.companyId)?.name ?? p.companyId,
    Problema: p.problemIdentified,
    Área: p.responsibleArea,
    Acción_Correctiva: p.improvementAction,
    Responsable: p.responsiblePerson,
    Indicador: p.relatedKpi,
    Meta: p.target,
    Inicio: p.startDate,
    Fin: p.endDate,
    Recursos: p.requiredResources,
    Estado: p.status,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(allPlans.length ? allPlans : [{ Mensaje: 'Sin planes registrados' }]),
    'Planes de Mejoramiento'
  );

  XLSX.writeFile(wb, 'informe-consolidado-diagnostico-empresarial.xlsx');
}
