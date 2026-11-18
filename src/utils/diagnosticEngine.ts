import {
  DiagnosticProblem,
  DiagnosticSummary,
  Interview,
  KPIResult,
  ProcessDiagnostic,
  Worker,
  WorkerInterview,
} from '../types/domain';
import { getOverallCompliance } from './kpiEngine';

function str(val: unknown): string {
  if (typeof val === 'string') return val.trim();
  if (Array.isArray(val)) return val.join(', ').trim();
  if (typeof val === 'number') return String(val);
  return '';
}

function includesAny(text: string, terms: string[]): boolean {
  const low = text.toLowerCase();
  return terms.some((t) => low.includes(t.toLowerCase()));
}

export function generateDiagnosticSummary(
  companyId: string,
  interviews: Interview[],
  kpis: KPIResult[],
  workerInterviews: WorkerInterview[] = [],
  workers: Worker[] = [],
  customProblems: DiagnosticProblem[] = []
): DiagnosticSummary {
  const latestInterview = [...interviews].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const ans = latestInterview?.answers ?? {};

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const criticalProcesses: string[] = [];
  const logisticsProblems: string[] = [];
  const operationalRisks: string[] = [];
  const improvementOpportunities: string[] = [];
  const amenazas: string[] = [];
  const autoProblems: DiagnosticProblem[] = [];

  const nowIso = new Date().toISOString();
  const addAutoProblem = (p: Omit<DiagnosticProblem, 'companyId' | 'isAutoDetected' | 'updatedAt'>) => {
    autoProblems.push({
      ...p,
      companyId,
      isAutoDetected: true,
      updatedAt: nowIso,
    });
  };

  const processes: ProcessDiagnostic[] = [];

  // 1. Administración y Estructura Organizacional
  if (latestInterview) {
    const b1 = str(ans['B1']);
    const b2 = str(ans['B2']);
    const b5 = str(ans['B5']);
    const adminFindings: string[] = [];
    const adminEvidence: string[] = [];
    let adminStatus: ProcessDiagnostic['status'] = 'Óptimo';

    if (b1) adminEvidence.push(`Organigrama: ${b1}`);
    if (b2) adminEvidence.push(`Manuales de funciones: ${b2}`);
    if (b5) adminEvidence.push(`Metas periódicas: ${b5}`);

    if (b1 === 'Sí' || includesAny(b1, ['Sí, documentado'])) {
      strengths.push(`Estructura organizacional formalizada con organigrama (${b1}) [Sección B1].`);
    } else if (b1) {
      weaknesses.push(`Falta formalización del organigrama (${b1}) [Sección B1].`);
      adminFindings.push('Organigrama informal o ausente.');
      adminStatus = 'En atención';
      addAutoProblem({
        id: `auto-${companyId}-org`,
        affectedArea: 'Administración y Personal',
        affectedProcess: 'Estructura Organizacional',
        description: 'La empresa no cuenta con un organigrama formal actualizado y socializado.',
        frequency: 'Mensual',
        severity: 'Medio',
        consequences: 'Desconocimiento de líneas de autoridad, cruces de órdenes y demoras en escalamiento.',
        possibleCauses: 'Crecimiento operativo sin actualización de documentos administrativos.',
        evidence: `Respuesta B1 en entrevista: "${b1}"`,
        recommendations: 'Definir y socializar el organigrama oficial indicando áreas, cargos y líneas de reporte.',
      });
    }

    if (includesAny(b2, ['Sí, para todos'])) {
      strengths.push('Manuales de funciones documentados para todos los cargos [Sección B2].');
    } else if (includesAny(b2, ['No existen', 'Parcialmente'])) {
      weaknesses.push(`Documentación incompleta de manuales de funciones (${b2}) [Sección B2].`);
      operationalRisks.push('Ambigüedad en responsabilidades y duplicidad operativa por falta de manuales completos [Sección B2].');
      adminFindings.push('Manuales de funciones incompletos o ausentes.');
      adminStatus = includesAny(b2, ['No existen']) ? 'Crítico' : 'En atención';
      addAutoProblem({
        id: `auto-${companyId}-manuals`,
        affectedArea: 'Administración y Personal',
        affectedProcess: 'Gestión de Funciones y Cargos',
        description: `Manuales de funciones incompletos o inexistentes (${b2}).`,
        frequency: 'Diaria',
        severity: includesAny(b2, ['No existen']) ? 'Alto' : 'Medio',
        consequences: 'Superposición de tareas, reprocesos entre bodega/ventas y falta de claridad en responsabilidades.',
        possibleCauses: 'Asignación verbal de funciones y ausencia de estandarización por puesto.',
        evidence: `Respuesta B2: "${b2}"`,
        recommendations: 'Documentar fichas de cargo con funciones diarias, inicio/fin de jornada e indicadores por trabajador.',
      });
    }

    if (b5 === 'No' || includesAny(b5, ['No se establecen'])) {
      weaknesses.push('Ausencia de metas periódicas formales por área [Sección B5].');
      improvementOpportunities.push('Implementar planeación de metas mensuales por área y trabajador [Sección B5].');
    }

    processes.push({
      processName: 'Gestión Administrativa y Estructura',
      sectionCode: 'B',
      status: adminEvidence.length === 0 ? 'Sin evaluar' : adminStatus,
      findings: adminFindings.length ? adminFindings : ['Proceso administrativo documentado sin alertas graves registradas.'],
      evidence: adminEvidence,
    });
  } else {
    processes.push({
      processName: 'Gestión Administrativa y Estructura',
      sectionCode: 'B',
      status: 'Sin evaluar',
      findings: ['Pendiente entrevista Sección B.'],
      evidence: [],
    });
  }

  // 2. Compras y Abastecimiento
  {
    const c3 = str(ans['C3']);
    const c5 = str(ans['C5']);
    const c6 = str(ans['C6']);
    const c7 = str(ans['C7']);
    const areaKpis = kpis.filter((k) => k.area === 'Compras y Abastecimiento');
    const findings: string[] = [];
    const evidence: string[] = [];
    let status: ProcessDiagnostic['status'] = 'Óptimo';

    if (c5) evidence.push(`Cumplimiento proveedores: ${c5}`);
    if (c6) evidence.push(`Novedades en pedidos: ${c6}`);
    if (c7) evidence.push(`Evaluación proveedores: ${c7}`);

    if (includesAny(c5, ['retrasos', '<70%'])) {
      logisticsProblems.push(`Retrasos frecuentes de proveedores (${c5}) [Sección C5].`);
      amenazas.push('Vulnerabilidad en continuidad de suministro por incumplimiento de proveedores [Sección C5].');
      findings.push('Incumplimiento recurrente en tiempos de proveedores.');
      status = 'Crítico';
      addAutoProblem({
        id: `auto-${companyId}-sup-delay`,
        affectedArea: 'Compras y Abastecimiento',
        affectedProcess: 'Reposición de Proveedores',
        description: 'Incumplimiento recurrente en fechas de entrega pactadas con proveedores.',
        frequency: 'Semanal',
        severity: 'Alto',
        consequences: 'Quiebres de stock en referencias de alta rotación y pérdida de ventas.',
        possibleCauses: 'Falta de acuerdos SLA, dependencia de proveedor único o pedidos de compra tardíos.',
        evidence: `Sección C5: "${c5}". Novedades C6: "${c6 || 'Sin detalle'}"`,
        recommendations: 'Establecer evaluación trimestral de proveedores y homologar proveedores alternos.',
      });
    } else if (includesAny(c5, ['Siempre'])) {
      strengths.push(`Alta puntualidad de proveedores (${c5}) [Sección C5].`);
    }

    if (includesAny(c6, ['próximos a vencer', 'rotos', 'dañados'])) {
      logisticsProblems.push(`Problemas de calidad o vida útil corta en compras (${c6}) [Sección C6].`);
      if (status === 'Óptimo') status = 'En atención';
      addAutoProblem({
        id: `auto-${companyId}-sup-quality`,
        affectedArea: 'Compras y Abastecimiento',
        affectedProcess: 'Recepción y Vida Útil de Lotes',
        description: `Ingreso de mercancía con vida útil corta o empaques dañados (${c6}).`,
        frequency: 'Semanal',
        severity: 'Alto',
        consequences: 'Incremento de devoluciones, mermas y riesgo de vencimiento en bodega.',
        possibleCauses: 'Ausencia de cláusula de vida útil mínima en órdenes de compra.',
        evidence: `Sección C6: "${c6}"`,
        recommendations: 'Exigir vida útil mínima (≥ 6 meses en concentrados/medicamentos) y política formal de cambio.',
      });
    }

    if (includesAny(c3, ['intuición'])) {
      weaknesses.push('Planeación de compras basada en intuición sin pronóstico formal [Sección C3].');
      operationalRisks.push('Riesgo de quiebres de stock o sobrecompra con riesgo de vencimiento [Sección C3].');
      status = status === 'Crítico' ? 'Crítico' : 'En atención';
    }

    if (c7 === 'No' || includesAny(c7, ['No se evalúan'])) {
      weaknesses.push('No existe evaluación formal de proveedores [Sección C7].');
      improvementOpportunities.push('Instaurar matriz de evaluación periódica de proveedores [Sección C7].');
    }

    for (const k of areaKpis) {
      if (k.value !== null) evidence.push(`${k.name}: ${k.formattedValue} (Meta ${k.formattedTarget})`);
      if (k.status === 'critico') {
        status = 'Crítico';
        weaknesses.push(`${k.name} en nivel crítico (${k.formattedValue} vs meta ${k.formattedTarget}) [KPI].`);
        findings.push(`${k.name} por debajo del umbral esperado.`);
      } else if (k.status === 'alerta') {
        if (status === 'Óptimo') status = 'En atención';
        weaknesses.push(`${k.name} en alerta (${k.formattedValue} vs meta ${k.formattedTarget}) [KPI].`);
      } else if (k.status === 'cumple') {
        strengths.push(`Buen desempeño en ${k.name}: ${k.formattedValue} [KPI].`);
      }
    }

    processes.push({
      processName: 'Compras y Abastecimiento',
      sectionCode: 'C',
      status: evidence.length === 0 ? 'Sin evaluar' : status,
      findings: findings.length ? findings : ['Proceso de abastecimiento dentro de parámetros aceptables.'],
      evidence,
    });
  }

  // 3. Recepción de Mercancías y Control de Lotes
  {
    const d2 = str(ans['D2']);
    const d3 = str(ans['D3']);
    const d4 = str(ans['D4']);
    const evidence: string[] = [];
    const findings: string[] = [];
    let status: ProcessDiagnostic['status'] = 'Óptimo';

    if (d2) evidence.push(`Verificación cantidades: ${d2}`);
    if (d3) evidence.push(`Control vencimiento/lote: ${d3}`);
    if (d4) evidence.push(`Registro entradas: ${d4}`);

    if (includesAny(d2, ['No se verifica', 'Solo se revisa la factura'])) {
      logisticsProblems.push(`Verificación deficiente en recepción de mercancías (${d2}) [Sección D2].`);
      operationalRisks.push('Ingreso de faltantes o bultos dañados no detectados al inventario [Sección D2].');
      findings.push('Falta conteo físico riguroso en recepción.');
      status = 'Crítico';
      addAutoProblem({
        id: `auto-${companyId}-rec-count`,
        affectedArea: 'Recepción y Bodega',
        affectedProcess: 'Recepción de Mercancías',
        description: `Verificación insuficiente de cantidades al recibir pedidos (${d2}).`,
        frequency: 'Diaria',
        severity: 'Alto',
        consequences: 'Diferencias desde el origen entre inventario físico y contable.',
        possibleCauses: 'Falta de tiempo asignado o protocolo de recepción contra orden de compra.',
        evidence: `Sección D2: "${d2}"`,
        recommendations: 'Implementar lista de chequeo en muelle con conteo físico 100% antes de ingresar a rack.',
      });
    } else if (includesAny(d2, ['100%'])) {
      strengths.push('Conteo físico 100% contra orden de compra en recepción [Sección D2].');
    }

    if (d3 === 'No' || includesAny(d3, ['No se realizan'])) {
      weaknesses.push('No se verifican fechas de vencimiento y lotes al recibir mercancía [Sección D3].');
      status = 'Crítico';
      findings.push('Sin control de lotes ni vencimientos al ingreso.');
      addAutoProblem({
        id: `auto-${companyId}-rec-lot`,
        affectedArea: 'Recepción y Bodega',
        affectedProcess: 'Trazabilidad y Control de Vencimientos',
        description: 'No se inspeccionan fechas de vencimiento, lotes ni integridad de empaques en recepción.',
        frequency: 'Diaria',
        severity: 'Crítico',
        consequences: 'Ingreso de alimento próximo a vencer, pérdida de trazabilidad y mermas ocultas.',
        possibleCauses: 'Carencia de protocolo de inspección sanitaria y recepción rápida sin registro de lote.',
        evidence: `Sección D3: "${d3}"`,
        recommendations: 'Exigir registro de lote y fecha de vencimiento en cada entrada y rechazar bultos rotos.',
      });
    } else if (d3 === 'Sí') {
      strengths.push('Control de fechas de vencimiento, lote e integridad de empaque en recepción [Sección D3].');
    }

    if (includesAny(d4, ['Planillas', 'Solo se archiva', 'sin registro de lote'])) {
      improvementOpportunities.push('Digitalizar el registro de entradas con lote y fecha de vencimiento en el sistema [Sección D4].');
    }

    processes.push({
      processName: 'Recepción de Mercancías y Trazabilidad',
      sectionCode: 'D',
      status: evidence.length === 0 ? 'Sin evaluar' : status,
      findings: findings.length ? findings : ['Control de recepción adecuado según información registrada.'],
      evidence,
    });
  }

  // 4. Almacenamiento, Inventarios, FEFO y Condiciones Sanitarias
  {
    const e1 = str(ans['E1']);
    const e3 = str(ans['E3']);
    const e4 = str(ans['E4']);
    const e5 = str(ans['E5']);
    const e7 = str(ans['E7']);
    const e8 = str(ans['E8']);
    const areaKpis = kpis.filter((k) => k.area === 'Almacenamiento e Inventarios');
    const evidence: string[] = [];
    const findings: string[] = [];
    let status: ProcessDiagnostic['status'] = 'Óptimo';

    if (e1) evidence.push(`Bodega: ${e1}`);
    if (e3) evidence.push(`FEFO y lotes: ${e3}`);
    if (e8) evidence.push(`Temp/Humedad/Plagas: ${e8}`);
    if (e4) evidence.push(`Conteos físicos: ${e4}`);
    if (e5) evidence.push(`Diferencias/Vencidos: ${e5}`);
    if (e7) evidence.push(`Software: ${e7}`);

    if (e3 === 'No') {
      status = 'Crítico';
      logisticsProblems.push('No se aplica el método FEFO ni trazabilidad por lotes en bodega [Sección E3].');
      findings.push('Ausencia de rotación FEFO y trazabilidad por lotes.');
      addAutoProblem({
        id: `auto-${companyId}-fefo`,
        affectedArea: 'Almacenamiento e Inventarios',
        affectedProcess: 'Control de Vencimientos y FEFO',
        description: 'No se aplica el método FEFO (primero en vencer, primero en salir) ni trazabilidad de lotes.',
        frequency: 'Diaria',
        severity: 'Crítico',
        consequences: 'Acumulación de alimentos vencidos en estanterías y despacho de lotes antiguos sin control.',
        possibleCauses: 'Almacenamiento por espacio disponible y falta de registro de vencimientos en sistema.',
        evidence: `Sección E3: "${e3}"`,
        recommendations: 'Reorganizar bodega con rotulación de lotes/vencimientos visibles y despacho obligatorio FEFO.',
      });
    } else if (e3 === 'Sí') {
      strengths.push('Aplicación de método FEFO y trazabilidad por lotes en bodega [Sección E3].');
    }

    if (e8 === 'No') {
      if (status === 'Óptimo') status = 'En atención';
      operationalRisks.push('Falta control ambiental (temperatura/humedad) y plan de control de plagas [Sección E8].');
      findings.push('Sin control de temperatura, humedad o plagas.');
      addAutoProblem({
        id: `auto-${companyId}-pest`,
        affectedArea: 'Almacenamiento e Inventarios',
        affectedProcess: 'Condiciones Ambientales y Sanidad',
        description: 'No se monitorea temperatura/humedad ni existe control documentado de plagas en bodega.',
        frequency: 'Semanal',
        severity: 'Alto',
        consequences: 'Deterioro de concentrados por humedad, proliferación de gorgojos o roedores y averías.',
        possibleCauses: 'Falta de termohigrómetro y cronograma de fumigación preventiva.',
        evidence: `Sección E8: "${e8}"`,
        recommendations: 'Instalar termohigrómetros, estibar al 100% separado de muros y contratar control de plagas.',
      });
    } else if (e8 === 'Sí') {
      strengths.push('Control activo de condiciones ambientales (temperatura/humedad) y plagas [Sección E8].');
    }

    if (includesAny(e5, ['Frecuentemente', 'Se desconoce'])) {
      logisticsProblems.push(`Desviaciones o productos dañados/vencidos frecuentes en inventario (${e5}) [Sección E5].`);
      findings.push('Faltantes, sobrantes o vencimientos recurrentes.');
      status = 'Crítico';
    }
    if (includesAny(e7, ['No utilizan', 'Solo hojas'])) {
      weaknesses.push(`Control tecnológico limitado en inventarios (${e7}) [Sección E7].`);
      improvementOpportunities.push('Adoptar software de inventarios con alertas de lote y vencimiento [Sección E7].');
      if (status === 'Óptimo') status = 'En atención';
    } else if (includesAny(e7, ['ERP', 'WMS'])) {
      strengths.push('Uso de software especializado con control de lotes y vencimientos [Sección E7].');
    }

    for (const k of areaKpis) {
      if (k.value !== null) evidence.push(`${k.name}: ${k.formattedValue} (Meta ${k.formattedTarget})`);
      if (k.status === 'critico') {
        status = 'Crítico';
        weaknesses.push(`${k.name} en nivel crítico (${k.formattedValue} vs meta ${k.formattedTarget}) [KPI].`);
        findings.push(`${k.name} requiere intervención inmediata.`);
        addAutoProblem({
          id: `auto-${companyId}-kpi-${k.id}`,
          affectedArea: k.area,
          affectedProcess: k.name,
          description: `${k.name} en nivel crítico: resultado ${k.formattedValue} frente a meta ${k.formattedTarget}.`,
          frequency: 'Mensual',
          severity: 'Crítico',
          consequences: k.interpretation,
          possibleCauses: `Desviación operativa en ${k.dataUsed}`,
          evidence: `KPI ${k.name} = ${k.formattedValue} (Meta: ${k.formattedTarget})`,
          recommendations: k.recommendation,
        });
      } else if (k.status === 'alerta') {
        if (status === 'Óptimo') status = 'En atención';
        weaknesses.push(`${k.name} en alerta (${k.formattedValue}) [KPI].`);
      } else if (k.status === 'cumple') {
        strengths.push(`Indicador favorable en ${k.name}: ${k.formattedValue} [KPI].`);
      }
    }

    processes.push({
      processName: 'Almacenamiento, Inventarios y FEFO',
      sectionCode: 'E',
      status: evidence.length === 0 ? 'Sin evaluar' : status,
      findings: findings.length ? findings : ['Gestión de almacenamiento y vencimientos controlada.'],
      evidence,
    });
  }

  // 5. Preparación de Pedidos y Operaciones Internas (reemplaza Producción)
  {
    const f2 = str(ans['F2']);
    const f3 = str(ans['F3']);
    const f6 = str(ans['F6']);
    const areaKpis = kpis.filter((k) => k.area === 'Preparación de Pedidos y Operaciones');
    const evidence: string[] = [];
    const findings: string[] = [];
    let status: ProcessDiagnostic['status'] = 'Óptimo';

    if (f2) evidence.push(`Método picking/empaque: ${f2}`);
    if (f3) evidence.push(`Doble verificación: ${f3}`);
    if (f6) evidence.push(`Errores frecuentes: ${f6}`);

    if (f3 === 'No') {
      weaknesses.push('No se realiza doble verificación antes de despachar pedidos [Sección F3].');
      status = 'Crítico';
      findings.push('Ausencia de doble verificación previa al despacho.');
      addAutoProblem({
        id: `auto-${companyId}-prep-check`,
        affectedArea: 'Preparación de Pedidos y Operaciones',
        affectedProcess: 'Verificación de Pedidos',
        description: 'No existe doble verificación de referencias, cantidades y vencimientos antes de entregar.',
        frequency: 'Diaria',
        severity: 'Alto',
        consequences: 'Envío de referencias trocadas, cantidades incompletas o bultos vencidos.',
        possibleCauses: 'Falta de responsable de chequeo o presión por despachar sin lista de verificación.',
        evidence: `Sección F3: "${f3}"`,
        recommendations: 'Instaurar punto de control obligatorio con firma de verificación contra pedido/remisión.',
      });
    } else if (f3 === 'Sí') {
      strengths.push('Doble verificación de cantidad, referencia y lote antes de despacho [Sección F3].');
    }

    if (includesAny(f2, ['sin orden estándar'])) {
      weaknesses.push('Alistamiento manual sin orden estándar de picking [Sección F2].');
      if (status === 'Óptimo') status = 'En atención';
    }

    if (includesAny(f6, ['trocado', 'incompletas', 'roto', 'vencido', 'Demoras'])) {
      logisticsProblems.push(`Errores recurrentes en preparación de pedidos (${f6}) [Sección F6].`);
      findings.push(`Errores reportados en alistamiento: ${f6}.`);
      if (status === 'Óptimo') status = 'En atención';
    }

    for (const k of areaKpis) {
      if (k.value !== null) evidence.push(`${k.name}: ${k.formattedValue} (Meta ${k.formattedTarget})`);
      if (k.status === 'critico') {
        status = 'Crítico';
        weaknesses.push(`${k.name} fuera de meta (${k.formattedValue}) [KPI].`);
        findings.push(`${k.name} requiere optimización.`);
      } else if (k.status === 'alerta') {
        if (status === 'Óptimo') status = 'En atención';
        weaknesses.push(`${k.name} en alerta (${k.formattedValue}) [KPI].`);
      } else if (k.status === 'cumple') {
        strengths.push(`${k.name} cumple objetivo (${k.formattedValue}) [KPI].`);
      }
    }

    processes.push({
      processName: 'Preparación de Pedidos y Operaciones Internas',
      sectionCode: 'F',
      status: evidence.length === 0 ? 'Sin evaluar' : status,
      findings: findings.length ? findings : ['Preparación de pedidos operando sin desviaciones críticas registradas.'],
      evidence,
    });
  }

  // 6. Transporte y Distribución
  {
    const g3 = str(ans['G3']);
    const g5 = str(ans['G5']);
    const g6 = str(ans['G6']);
    const areaKpis = kpis.filter((k) => k.area === 'Transporte y Distribución');
    const evidence: string[] = [];
    const findings: string[] = [];
    let status: ProcessDiagnostic['status'] = 'Óptimo';

    if (g3) evidence.push(`Ruteo y protección: ${g3}`);
    if (g5) evidence.push(`Retrasos: ${g5}`);
    if (g6) evidence.push(`Costos transporte: ${g6}`);

    if (includesAny(g5, ['Frecuentemente', '>15%'])) {
      logisticsProblems.push(`Retrasos frecuentes en entregas (${g5}) [Sección G5].`);
      amenazas.push('Pérdida de clientes (pet shops/veterinarias) por demoras en entregas [Sección G5].');
      status = 'Crítico';
      findings.push('Retrasos frecuentes en distribución.');
      addAutoProblem({
        id: `auto-${companyId}-dist-delay`,
        affectedArea: 'Transporte y Distribución',
        affectedProcess: 'Entregas y Ruteo',
        description: `Retrasos frecuentes en entregas a clientes (${g5}).`,
        frequency: 'Semanal',
        severity: 'Alto',
        consequences: 'Insatisfacción del cliente, cancelación de pedidos y pérdida de recompra.',
        possibleCauses: 'Ruteo empírico, demoras en alistamiento previo o sobrecarga vehicular.',
        evidence: `Sección G5: "${g5}"`,
        recommendations: 'Definir ventanas horarias de corte de pedidos y planificar rutas por zonas geográficas.',
      });
    }
    if (includesAny(g3, ['criterio del conductor'])) {
      weaknesses.push('Rutas asignadas sin planeación estructurada [Sección G3].');
      improvementOpportunities.push('Implementar zonificación y programación estructurada de rutas [Sección G3].');
      if (status === 'Óptimo') status = 'En atención';
    }
    if (includesAny(g6, ['No se discriminan'])) {
      weaknesses.push('Falta de control desagregado de costos de transporte [Sección G6].');
    }

    for (const k of areaKpis) {
      if (k.value !== null) evidence.push(`${k.name}: ${k.formattedValue} (Meta ${k.formattedTarget})`);
      if (k.status === 'critico') {
        status = 'Crítico';
        weaknesses.push(`${k.name} en nivel crítico (${k.formattedValue}) [KPI].`);
        findings.push(`${k.name} requiere optimización urgente.`);
        addAutoProblem({
          id: `auto-${companyId}-kpi-${k.id}`,
          affectedArea: k.area,
          affectedProcess: k.name,
          description: `${k.name} en nivel crítico (${k.formattedValue} vs meta ${k.formattedTarget}).`,
          frequency: 'Mensual',
          severity: 'Crítico',
          consequences: k.interpretation,
          possibleCauses: k.dataUsed,
          evidence: `KPI ${k.name}: ${k.formattedValue}`,
          recommendations: k.recommendation,
        });
      } else if (k.status === 'alerta') {
        if (status === 'Óptimo') status = 'En atención';
        weaknesses.push(`${k.name} en alerta (${k.formattedValue}) [KPI].`);
      } else if (k.status === 'cumple') {
        strengths.push(`Desempeño positivo en ${k.name}: ${k.formattedValue} [KPI].`);
      }
    }

    processes.push({
      processName: 'Transporte y Distribución',
      sectionCode: 'G',
      status: evidence.length === 0 ? 'Sin evaluar' : status,
      findings: findings.length ? findings : ['Distribución operando dentro de parámetros controlados.'],
      evidence,
    });
  }

  // 7. Ventas, Servicio al Cliente y Gestión de KPIs
  {
    const h3 = str(ans['H3']);
    const h4 = str(ans['H4']);
    const i1 = str(ans['I1']);
    const areaKpis = kpis.filter((k) => k.area === 'Servicio al Cliente' || k.area === 'Financieros');
    const evidence: string[] = [];
    const findings: string[] = [];
    let status: ProcessDiagnostic['status'] = 'Óptimo';

    if (h3) evidence.push(`Medición satisfacción: ${h3}`);
    if (h4) evidence.push(`Quejas frecuentes: ${h4}`);
    if (i1) evidence.push(`Uso de KPIs: ${i1}`);

    if (h3 === 'No' || includesAny(h3, ['No se mide'])) {
      weaknesses.push('No se mide formalmente la satisfacción del cliente [Sección H3].');
      improvementOpportunities.push('Instaurar encuesta breve postventa para medir satisfacción y motivos de recompra [Sección H3].');
      status = 'En atención';
    }
    if (i1 === 'No' || includesAny(i1, ['No utiliza'])) {
      weaknesses.push('La empresa no contaba con tablero formal de indicadores de gestión [Sección I1].');
      improvementOpportunities.push('Adoptar tablero mensual de KPIs logísticos, de vencimientos y financieros [Sección I1].');
      status = 'En atención';
    }

    for (const k of areaKpis) {
      if (k.value !== null) evidence.push(`${k.name}: ${k.formattedValue} (Meta ${k.formattedTarget})`);
      if (k.status === 'critico') {
        status = 'Crítico';
        weaknesses.push(`${k.name} crítico (${k.formattedValue} vs meta ${k.formattedTarget}) [KPI].`);
        findings.push(`${k.name} por debajo del umbral esperado.`);
      } else if (k.status === 'alerta') {
        if (status === 'Óptimo') status = 'En atención';
        weaknesses.push(`${k.name} en alerta (${k.formattedValue}) [KPI].`);
      } else if (k.status === 'cumple') {
        strengths.push(`${k.name} dentro de meta: ${k.formattedValue} [KPI].`);
      }
    }

    processes.push({
      processName: 'Ventas, Servicio al Cliente y Control',
      sectionCode: 'H / I',
      status: evidence.length === 0 ? 'Sin evaluar' : status,
      findings: findings.length ? findings : ['Servicio al cliente y seguimiento financiero estables.'],
      evidence,
    });
  }

  // Worker interview findings (W11)
  for (const wi of workerInterviews) {
    const worker = workers.find((w) => w.id === wi.workerId);
    const wName = worker?.fullName || str(wi.answers['W1']) || 'Trabajador';
    const wArea = worker?.area || str(wi.answers['W2']) || 'Operación';
    const wDiff = str(wi.answers['W11']);
    if (wDiff) {
      logisticsProblems.push(`[Entrevista ${wName} - ${wArea}] ${wDiff}`);
      addAutoProblem({
        id: `auto-wi-${wi.id}`,
        affectedArea: wArea,
        affectedProcess: `Actividades del cargo (${worker?.role || 'Trabajador'})`,
        description: wDiff,
        frequency: 'Diaria',
        severity: 'Medio',
        consequences: 'Pérdida de tiempo operativo, reprocesos o sobrecarga del trabajador.',
        possibleCauses: str(wi.answers['W9']) ? 'Fallas de coordinación o información entre áreas.' : 'Falta de estandarización de herramientas o flujos.',
        evidence: `Entrevista individual a ${wName} (${wi.interviewDate})`,
        recommendations: 'Revisar flujo de trabajo del cargo y eliminar cuellos de botella con el área relacionada.',
      });
    }
  }

  // Explicit interview text evidence (A6, A7, J1-J5)
  const a6 = str(ans['A6']);
  const a7 = str(ans['A7']);
  const j1 = str(ans['J1']);
  const j2 = str(ans['J2']);
  const j3 = str(ans['J3']);
  const j4 = str(ans['J4']);
  const j5 = str(ans['J5']);

  if (a6) strengths.unshift(`Fortaleza reportada en entrevista: "${a6}" [Sección A6].`);
  if (a7) weaknesses.unshift(`Dificultad reportada en entrevista: "${a7}" [Sección A7].`);
  if (j1) criticalProcesses.push(`Proceso señalado con mayores dificultades: ${j1} [Sección J1].`);
  if (j2) operationalRisks.push(`Foco de mayores costos o pérdidas reportado: "${j2}" [Sección J2].`);
  if (j3) logisticsProblems.push(`Pérdida de tiempo identificada: "${j3}" [Sección J3].`);
  if (j4) criticalProcesses.push(`Proceso de mejora urgente: "${j4}" [Sección J4].`);
  if (j5) improvementOpportunities.push(`Metas propuestas por la empresa: "${j5}" [Sección J5].`);

  for (const p of processes) {
    if (p.status === 'Crítico') {
      criticalProcesses.push(`${p.processName} (Sección ${p.sectionCode}): estado crítico detectado.`);
    }
  }

  if (kpis.some((k) => k.area === 'Financieros' && (k.status === 'critico' || k.status === 'alerta'))) {
    amenazas.push('Presión sobre márgenes y rentabilidad por costos logísticos o pérdidas por vencimiento [KPIs Financieros].');
  }
  if (kpis.some((k) => k.area === 'Servicio al Cliente' && (k.status === 'critico' || k.status === 'alerta'))) {
    amenazas.push('Riesgo de pérdida de clientes (veterinarias/tiendas) por devoluciones o demoras [KPIs Servicio].');
  }
  if (amenazas.length === 0 && (latestInterview || kpis.some((k) => k.value !== null))) {
    amenazas.push('Pérdida de competitividad y deterioro de inventarios perecederos si no se consolidan controles FEFO y de ruteo.');
  }

  const uniq = (arr: string[]) => Array.from(new Set(arr));

  // Combine manual/custom problems first, then auto-detected ones (avoid duplicate ids)
  const customIds = new Set(customProblems.map((p) => p.id));
  const mergedProblems = [...customProblems, ...autoProblems.filter((p) => !customIds.has(p.id))];

  return {
    companyId,
    generatedAt: new Date().toISOString(),
    overallCompliance: getOverallCompliance(kpis),
    processes,
    detailedProblems: mergedProblems,
    strengths: uniq(strengths),
    weaknesses: uniq(weaknesses),
    criticalProcesses: uniq(criticalProcesses),
    logisticsProblems: uniq(logisticsProblems),
    operationalRisks: uniq(operationalRisks),
    improvementOpportunities: uniq(improvementOpportunities),
    swot: {
      fortalezas: uniq(strengths),
      debilidades: uniq(weaknesses),
      oportunidades: uniq(improvementOpportunities),
      amenazas: uniq(amenazas),
    },
  };
}
