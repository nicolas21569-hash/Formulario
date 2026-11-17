import { DiagnosticSummary, Interview, KPIResult, ProcessDiagnostic } from '../types/domain';
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
  kpis: KPIResult[]
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

  // Process evaluation helper
  const processes: ProcessDiagnostic[] = [];

  // 1. Administración
  if (latestInterview) {
    const b1 = str(ans['B1']);
    const b2 = str(ans['B2']);
    const b5 = str(ans['B5']);
    const adminFindings: string[] = [];
    const adminEvidence: string[] = [];
    let adminStatus: ProcessDiagnostic['status'] = 'Óptimo';

    if (b1) adminEvidence.push(`Organigrama: ${b1}`);
    if (b2) adminEvidence.push(`Manuales: ${b2}`);
    if (b5) adminEvidence.push(`Metas: ${b5}`);

    if (includesAny(b1, ['Sí, documentado'])) {
      strengths.push(`Estructura organizacional formalizada (${b1}) [Sección B1].`);
    } else if (b1) {
      weaknesses.push(`Falta formalización del organigrama (${b1}) [Sección B1].`);
      adminFindings.push('Organigrama informal o ausente.');
      adminStatus = 'En atención';
    }

    if (includesAny(b2, ['Sí, para todos'])) {
      strengths.push('Manuales de funciones documentados para todos los cargos [Sección B2].');
    } else if (includesAny(b2, ['No existen', 'Parcialmente'])) {
      weaknesses.push(`Documentación incompleta de funciones (${b2}) [Sección B2].`);
      operationalRisks.push('Ambigüedad en responsabilidades y duplicidad operativa por falta de manuales completos [Sección B2].');
      adminFindings.push('Manuales de funciones incompletos o ausentes.');
      adminStatus = includesAny(b2, ['No existen']) ? 'Crítico' : 'En atención';
    }

    if (includesAny(b5, ['No se establecen'])) {
      weaknesses.push('Ausencia de metas periódicas formales [Sección B5].');
      improvementOpportunities.push('Implementar planeación de metas mensuales/trimestrales por área [Sección B5].');
    }

    processes.push({
      processName: 'Gestión Administrativa',
      sectionCode: 'B',
      status: adminEvidence.length === 0 ? 'Sin evaluar' : adminStatus,
      findings: adminFindings.length ? adminFindings : ['Proceso administrativo documentado sin alertas graves registradas.'],
      evidence: adminEvidence,
    });
  } else {
    processes.push({
      processName: 'Gestión Administrativa',
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
    if (c7) evidence.push(`Evaluación: ${c7}`);

    if (includesAny(c5, ['retrasos', '<70%'])) {
      logisticsProblems.push(`Retrasos frecuentes de proveedores (${c5}) [Sección C5].`);
      amenazas.push('Vulnerabilidad en continuidad de suministro por incumplimiento de proveedores [Sección C5].');
      findings.push('Incumplimiento recurrente en tiempos de proveedores.');
      status = 'Crítico';
    } else if (includesAny(c5, ['Siempre'])) {
      strengths.push(`Alta puntualidad de proveedores (${c5}) [Sección C5].`);
    }

    if (includesAny(c3, ['intuición'])) {
      weaknesses.push('Planeación de compras basada en intuición sin pronóstico formal [Sección C3].');
      operationalRisks.push('Riesgo de quiebres de stock o sobrecompra por falta de cálculo de demanda [Sección C3].');
      status = status === 'Crítico' ? 'Crítico' : 'En atención';
    }

    if (includesAny(c7, ['No se evalúan'])) {
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

  // 3. Recepción
  {
    const d2 = str(ans['D2']);
    const d3 = str(ans['D3']);
    const d4 = str(ans['D4']);
    const evidence: string[] = [];
    const findings: string[] = [];
    let status: ProcessDiagnostic['status'] = 'Óptimo';

    if (d2) evidence.push(`Verificación: ${d2}`);
    if (d3) evidence.push(`Calidad: ${d3}`);
    if (d4) evidence.push(`Registro: ${d4}`);

    if (includesAny(d2, ['No se verifica', 'Solo se revisa la factura'])) {
      logisticsProblems.push(`Verificación deficiente en recepción de mercancías (${d2}) [Sección D2].`);
      operationalRisks.push('Ingreso de faltantes no detectados al inventario [Sección D2].');
      findings.push('Falta conteo físico riguroso en recepción.');
      status = 'Crítico';
    } else if (includesAny(d2, ['100%'])) {
      strengths.push('Conteo físico 100% contra orden de compra en recepción [Sección D2].');
    }

    if (includesAny(d3, ['No se realizan'])) {
      weaknesses.push('No se realizan inspecciones de calidad al recibir mercancía [Sección D3].');
      status = status === 'Crítico' ? 'Crítico' : 'En atención';
    }

    if (includesAny(d4, ['Planillas', 'Solo se archiva'])) {
      improvementOpportunities.push('Digitalizar el registro de entradas directamente al sistema de inventarios [Sección D4].');
    }

    processes.push({
      processName: 'Recepción de Mercancías',
      sectionCode: 'D',
      status: evidence.length === 0 ? 'Sin evaluar' : status,
      findings: findings.length ? findings : ['Control de recepción adecuado según información registrada.'],
      evidence,
    });
  }

  // 4. Almacenamiento e Inventarios
  {
    const e1 = str(ans['E1']);
    const e4 = str(ans['E4']);
    const e5 = str(ans['E5']);
    const e7 = str(ans['E7']);
    const areaKpis = kpis.filter((k) => k.area === 'Almacenamiento e Inventarios');
    const evidence: string[] = [];
    const findings: string[] = [];
    let status: ProcessDiagnostic['status'] = 'Óptimo';

    if (e1) evidence.push(`Almacén: ${e1}`);
    if (e4) evidence.push(`Conteos físicos: ${e4}`);
    if (e5) evidence.push(`Diferencias: ${e5}`);
    if (e7) evidence.push(`Software: ${e7}`);

    if (includesAny(e5, ['Frecuentemente', 'Se desconoce'])) {
      logisticsProblems.push(`Desviaciones de inventario (${e5}) [Sección E5].`);
      findings.push('Faltantes o sobrantes recurrentes / falta de conciliación.');
      status = 'Crítico';
    }
    if (includesAny(e7, ['No utilizan', 'Solo hojas'])) {
      weaknesses.push(`Control tecnológico limitado en inventarios (${e7}) [Sección E7].`);
      improvementOpportunities.push('Adoptar software de control de inventarios en tiempo real [Sección E7].');
      if (status === 'Óptimo') status = 'En atención';
    } else if (includesAny(e7, ['ERP'])) {
      strengths.push('Uso de software especializado/ERP para control de inventarios [Sección E7].');
    }

    for (const k of areaKpis) {
      if (k.value !== null) evidence.push(`${k.name}: ${k.formattedValue} (Meta ${k.formattedTarget})`);
      if (k.status === 'critico') {
        status = 'Crítico';
        weaknesses.push(`${k.name} en nivel crítico (${k.formattedValue} vs meta ${k.formattedTarget}) [KPI].`);
        findings.push(`${k.name} requiere intervención inmediata.`);
      } else if (k.status === 'alerta') {
        if (status === 'Óptimo') status = 'En atención';
        weaknesses.push(`${k.name} en alerta (${k.formattedValue}) [KPI].`);
      } else if (k.status === 'cumple') {
        strengths.push(`Indicador favorable en ${k.name}: ${k.formattedValue} [KPI].`);
      }
    }

    processes.push({
      processName: 'Almacenamiento e Inventarios',
      sectionCode: 'E',
      status: evidence.length === 0 ? 'Sin evaluar' : status,
      findings: findings.length ? findings : ['Gestión de almacenamiento controlada.'],
      evidence,
    });
  }

  // 5. Producción u Operación
  {
    const hasProd = latestInterview?.hasProductionProcess ?? true;
    if (!hasProd) {
      processes.push({
        processName: 'Producción u Operación',
        sectionCode: 'F',
        status: 'No aplica',
        findings: ['La empresa indicó que no realiza procesos de producción / manufactura.'],
        evidence: ['Sección F marcada como no aplicable en la entrevista.'],
      });
    } else {
      const f4 = str(ans['F4']);
      const f5 = str(ans['F5']);
      const areaKpis = kpis.filter((k) => k.area === 'Producción');
      const evidence: string[] = [];
      const findings: string[] = [];
      let status: ProcessDiagnostic['status'] = 'Óptimo';

      if (f4) evidence.push(`Control calidad: ${f4}`);
      if (f5) evidence.push(`Desperdicios: ${f5}`);

      if (includesAny(f4, ['Sin control'])) {
        weaknesses.push('Ausencia de control formal de calidad en producción/operación [Sección F4].');
        status = 'Crítico';
        findings.push('Sin control formal de calidad.');
      }
      if (includesAny(f5, ['Altos'])) {
        logisticsProblems.push('Altos niveles de desperdicio operativo reportados [Sección F5].');
        status = 'Crítico';
        findings.push('Desperdicios altos en operación.');
      }

      for (const k of areaKpis) {
        if (k.value !== null) evidence.push(`${k.name}: ${k.formattedValue} (Meta ${k.formattedTarget})`);
        if (k.status === 'critico') {
          status = 'Crítico';
          weaknesses.push(`${k.name} fuera de meta (${k.formattedValue}) [KPI].`);
        } else if (k.status === 'alerta') {
          if (status === 'Óptimo') status = 'En atención';
        } else if (k.status === 'cumple') {
          strengths.push(`${k.name} cumple objetivo (${k.formattedValue}) [KPI].`);
        }
      }

      processes.push({
        processName: 'Producción u Operación',
        sectionCode: 'F',
        status: evidence.length === 0 ? 'Sin evaluar' : status,
        findings: findings.length ? findings : ['Operación productiva sin desviaciones críticas registradas.'],
        evidence,
      });
    }
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

    if (g3) evidence.push(`Ruteo: ${g3}`);
    if (g5) evidence.push(`Retrasos: ${g5}`);
    if (g6) evidence.push(`Costos transporte: ${g6}`);

    if (includesAny(g5, ['Frecuentemente', '>15%'])) {
      logisticsProblems.push(`Retrasos frecuentes en entregas (${g5}) [Sección G5].`);
      amenazas.push('Pérdida de competitividad y clientes por demoras en entregas [Sección G5].');
      status = 'Crítico';
      findings.push('Retrasos frecuentes en distribución.');
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

  // 7. Servicio al Cliente y Gestión de KPIs
  {
    const h4 = str(ans['H4']);
    const i1 = str(ans['I1']);
    const areaKpis = kpis.filter((k) => k.area === 'Servicio al Cliente' || k.area === 'Financieros');
    const evidence: string[] = [];
    const findings: string[] = [];
    let status: ProcessDiagnostic['status'] = 'Óptimo';

    if (h4) evidence.push(`Medición satisfacción: ${h4}`);
    if (i1) evidence.push(`Uso de KPIs: ${i1}`);

    if (includesAny(h4, ['No se mide'])) {
      weaknesses.push('No se mide sistemáticamente la satisfacción del cliente [Sección H4].');
      improvementOpportunities.push('Instaurar encuesta postventa para medir satisfacción y NPS [Sección H4].');
      status = 'En atención';
    }
    if (includesAny(i1, ['No utiliza'])) {
      weaknesses.push('La empresa no contaba con tablero formal de indicadores de gestión [Sección I1].');
      improvementOpportunities.push('Adoptar tablero mensual de KPIs logísticos y financieros [Sección I1].');
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

  // Explicit interview text evidence (A6, A7, J1, J2, J3, J4, J5, J6)
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
  if (j2) operationalRisks.push(`Foco de mayores costos reportado: "${j2}" [Sección J2].`);
  if (j3) logisticsProblems.push(`Pérdida de tiempo identificada: "${j3}" [Sección J3].`);
  if (j4) criticalProcesses.push(`Proceso de mejora urgente: "${j4}" [Sección J4].`);
  if (j5) improvementOpportunities.push(`Cambio propuesto por la empresa: "${j5}" [Sección J5].`);

  for (const p of processes) {
    if (p.status === 'Crítico') {
      criticalProcesses.push(`${p.processName} (Sección ${p.sectionCode}): estado crítico detectado.`);
    }
  }

  // External threats grounded in weak areas
  if (kpis.some((k) => k.area === 'Financieros' && (k.status === 'critico' || k.status === 'alerta'))) {
    amenazas.push('Presión sobre márgenes y rentabilidad por costos logísticos o de ventas elevados [KPIs Financieros].');
  }
  if (kpis.some((k) => k.area === 'Servicio al Cliente' && (k.status === 'critico' || k.status === 'alerta'))) {
    amenazas.push('Riesgo de deserción de clientes por devoluciones, reclamos o baja satisfacción [KPIs Servicio].');
  }
  if (amenazas.length === 0 && (latestInterview || kpis.some((k) => k.value !== null))) {
    amenazas.push('Posible incremento de costos de transporte/abastecimiento del mercado si no se formalizan controles preventivos.');
  }

  // Deduplicate
  const uniq = (arr: string[]) => Array.from(new Set(arr));

  return {
    companyId,
    generatedAt: new Date().toISOString(),
    overallCompliance: getOverallCompliance(kpis),
    processes,
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
