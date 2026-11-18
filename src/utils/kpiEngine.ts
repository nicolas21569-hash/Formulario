import { KPIArea, KPIResult, KPIStatus, MonthlyMetrics } from '../types/domain';

export const DEFAULT_KPI_TARGETS: Record<string, number> = {
  cumplimiento_proveedores: 92,
  costo_compras: 60,
  tiempo_abastecimiento: 5,
  rotacion_inventarios: 4,
  exactitud_inventario: 98,
  nivel_faltantes: 2,
  costo_almacenamiento: 5,
  porcentaje_vencidos: 1,
  productividad_trabajador: 25,
  productividad_laboral: 10,
  productos_defectuosos: 2,
  porcentaje_desperdicios: 1.5,
  eficiencia_produccion: 96,
  entregas_a_tiempo: 95,
  costo_por_entrega: 15,
  cumplimiento_pedidos: 97,
  tiempo_promedio_entrega: 24,
  nivel_satisfaccion: 90,
  porcentaje_devoluciones: 2,
  porcentaje_reclamaciones: 2,
  margen_utilidad: 25,
  rentabilidad: 20,
  relacion_costos_ventas: 75,
};

export interface AggregateMetrics {
  periodLabel: string;
  monthsIncluded: number;
  totalOrdersReceived: number | null;
  totalOrdersDelivered: number | null;
  ordersDeliveredOnTime: number | null;
  ordersWithErrors: number | null;
  purchasesMade: number | null;
  supplierOrdersOnTime: number | null;
  totalSupplyDays: number | null;
  totalPurchaseValue: number | null;
  totalSalesValue: number | null;
  storageCosts: number | null;
  transportCosts: number | null;
  totalDeliveryHours: number | null;
  unitsProduced: number | null;
  defectiveUnits: number | null;
  totalPreparationHours: number | null;
  expiredGoodsValue: number | null;
  returnsCount: number | null;
  claimsCount: number | null;
  customersServed: number | null;
  satisfiedCustomers: number | null;
  wasteAndLossValue: number | null;
  initialInventory: number | null;
  finalInventory: number | null;
  inventoryReferencesChecked: number | null;
  inventoryReferencesAccurate: number | null;
  costOfSales: number | null;
  hoursWorked: number | null;
  workersCount: number | null;
}

function sumNullable(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((acc, v) => acc + v, 0);
}

function avgNullable(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((acc, v) => acc + v, 0) / valid.length;
}

export function aggregateMonthlyMetrics(records: MonthlyMetrics[]): AggregateMetrics | null {
  if (!records || records.length === 0) return null;
  const sorted = [...records].sort((a, b) => a.period.localeCompare(b.period));
  const periodLabel =
    sorted.length === 1
      ? sorted[0].period
      : `${sorted[0].period} a ${sorted[sorted.length - 1].period} (${sorted.length} meses)`;

  return {
    periodLabel,
    monthsIncluded: sorted.length,
    totalOrdersReceived: sumNullable(sorted.map((m) => m.totalOrdersReceived)),
    totalOrdersDelivered: sumNullable(sorted.map((m) => m.totalOrdersDelivered)),
    ordersDeliveredOnTime: sumNullable(sorted.map((m) => m.ordersDeliveredOnTime)),
    ordersWithErrors: sumNullable(sorted.map((m) => m.ordersWithErrors)),
    purchasesMade: sumNullable(sorted.map((m) => m.purchasesMade)),
    supplierOrdersOnTime: sumNullable(sorted.map((m) => m.supplierOrdersOnTime)),
    totalSupplyDays: sumNullable(sorted.map((m) => m.totalSupplyDays)),
    totalPurchaseValue: sumNullable(sorted.map((m) => m.totalPurchaseValue)),
    totalSalesValue: sumNullable(sorted.map((m) => m.totalSalesValue)),
    storageCosts: sumNullable(sorted.map((m) => m.storageCosts)),
    transportCosts: sumNullable(sorted.map((m) => m.transportCosts)),
    totalDeliveryHours: sumNullable(sorted.map((m) => m.totalDeliveryHours)),
    unitsProduced: sumNullable(sorted.map((m) => m.unitsProduced)),
    defectiveUnits: sumNullable(sorted.map((m) => m.defectiveUnits)),
    totalPreparationHours: sumNullable(sorted.map((m) => m.totalPreparationHours)),
    expiredGoodsValue: sumNullable(sorted.map((m) => m.expiredGoodsValue)),
    returnsCount: sumNullable(sorted.map((m) => m.returnsCount)),
    claimsCount: sumNullable(sorted.map((m) => m.claimsCount)),
    customersServed: sumNullable(sorted.map((m) => m.customersServed)),
    satisfiedCustomers: sumNullable(sorted.map((m) => m.satisfiedCustomers)),
    wasteAndLossValue: sumNullable(sorted.map((m) => m.wasteAndLossValue)),
    initialInventory: sorted[0].initialInventory ?? null,
    finalInventory: sorted[sorted.length - 1].finalInventory ?? null,
    inventoryReferencesChecked: sumNullable(sorted.map((m) => m.inventoryReferencesChecked)),
    inventoryReferencesAccurate: sumNullable(sorted.map((m) => m.inventoryReferencesAccurate)),
    costOfSales: sumNullable(sorted.map((m) => m.costOfSales)),
    hoursWorked: sumNullable(sorted.map((m) => m.hoursWorked)),
    workersCount: avgNullable(sorted.map((m) => m.workersCount)),
  };
}

function isValidNumber(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtNum(n: number, decimals = 1): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

interface KPISpec {
  id: string;
  name: string;
  area: KPIArea;
  objective: string;
  formula: string;
  unit: string;
  higherIsBetter: boolean;
  compute: (m: AggregateMetrics) => { value: number | null; dataUsed: string };
  interpret: (status: KPIStatus, value: number | null, target: number, unit: string) => {
    interpretation: string;
    recommendation: string;
  };
}

const KPI_SPECS: KPISpec[] = [
  // 1. COMPRAS Y ABASTECIMIENTO
  {
    id: 'cumplimiento_proveedores',
    name: 'Cumplimiento de proveedores',
    area: 'Compras y Abastecimiento',
    objective: 'Medir la puntualidad y confiabilidad de los proveedores frente a las fechas acordadas.',
    formula: '(Pedidos recibidos a tiempo / Compras realizadas) × 100',
    unit: '%',
    higherIsBetter: true,
    compute: (m) => {
      if (!isValidNumber(m.supplierOrdersOnTime) || !isValidNumber(m.purchasesMade) || m.purchasesMade <= 0) {
        return { value: null, dataUsed: 'Faltan compras realizadas o pedidos recibidos a tiempo.' };
      }
      return {
        value: (m.supplierOrdersOnTime / m.purchasesMade) * 100,
        dataUsed: `Recibidos a tiempo: ${m.supplierOrdersOnTime} / Compras: ${m.purchasesMade}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre el número de compras realizadas y los pedidos recibidos en la fecha pactada.',
          }
        : status === 'cumple'
        ? {
            interpretation: `El ${fmtNum(v!)}% de las órdenes de compra llegaron puntualmente, superando la meta del ${t}%.`,
            recommendation: 'Mantener acuerdos de nivel de servicio (SLA) y exigencia de vida útil mínima en lotes.',
          }
        : {
            interpretation: `El cumplimiento de proveedores (${fmtNum(v!)}%) está por debajo de la meta (${t}%), generando riesgo de desabastecimiento.`,
            recommendation: 'Implementar evaluación trimestral de proveedores y desarrollar proveedores alternos de concentrados y accesorios.',
          },
  },
  {
    id: 'costo_compras',
    name: 'Costo de compras',
    area: 'Compras y Abastecimiento',
    objective: 'Evaluar la proporción de los ingresos por ventas destinada a la adquisición de alimentos y productos para mascotas.',
    formula: '(Valor total de compras / Valor total de ventas) × 100',
    unit: '%',
    higherIsBetter: false,
    compute: (m) => {
      if (!isValidNumber(m.totalPurchaseValue) || !isValidNumber(m.totalSalesValue) || m.totalSalesValue <= 0) {
        return { value: null, dataUsed: 'Falta valor total de compras o valor total de ventas.' };
      }
      return {
        value: (m.totalPurchaseValue / m.totalSalesValue) * 100,
        dataUsed: `Compras: ${fmtMoney(m.totalPurchaseValue)} / Ventas: ${fmtMoney(m.totalSalesValue)}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre el valor total de compras y el valor total de ventas del periodo.',
          }
        : status === 'cumple'
        ? {
            interpretation: `El peso de las compras sobre las ventas es del ${fmtNum(v!)}%, dentro del límite objetivo (≤ ${t}%).`,
            recommendation: 'Conservar políticas de negociación por volumen y control presupuestal de abastecimiento.',
          }
        : {
            interpretation: `Las compras representan el ${fmtNum(v!)}% de las ventas, superando el máximo esperado (${t}%).`,
            recommendation: 'Renegociar tarifas con distribuidores, evitar compras urgentes y ajustar lotes según rotación real.',
          },
  },
  {
    id: 'tiempo_abastecimiento',
    name: 'Tiempo promedio de abastecimiento',
    area: 'Compras y Abastecimiento',
    objective: 'Determinar los días promedio transcurridos desde la emisión de la orden hasta la recepción en bodega.',
    formula: 'Días totales de abastecimiento / Compras realizadas',
    unit: 'días',
    higherIsBetter: false,
    compute: (m) => {
      if (!isValidNumber(m.totalSupplyDays) || !isValidNumber(m.purchasesMade) || m.purchasesMade <= 0) {
        return { value: null, dataUsed: 'Faltan días totales de abastecimiento o compras realizadas.' };
      }
      return {
        value: m.totalSupplyDays / m.purchasesMade,
        dataUsed: `Días acumulados: ${m.totalSupplyDays} / Compras: ${m.purchasesMade}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre la suma de días de entrega de proveedores y el número de órdenes de compra.',
          }
        : status === 'cumple'
        ? {
            interpretation: `El ciclo de reposición promedia ${fmtNum(v!)} días, cumpliendo el límite objetivo (≤ ${t} días).`,
            recommendation: 'Ajustar puntos de reorden usando este tiempo real de reposición.',
          }
        : {
            interpretation: `El tiempo promedio de abastecimiento (${fmtNum(v!)} días) excede la meta de ${t} días.`,
            recommendation: 'Pre-acordar entregas programadas, usar órdenes abiertas y diversificar proveedores regionales.',
          },
  },

  // 2. ALMACENAMIENTO E INVENTARIOS
  {
    id: 'rotacion_inventarios',
    name: 'Rotación de inventarios',
    area: 'Almacenamiento e Inventarios',
    objective: 'Medir cuántas veces se renueva el inventario de alimentos y productos durante el periodo analizado.',
    formula: 'Costo de ventas / ((Inventario inicial + Inventario final) / 2)',
    unit: 'veces',
    higherIsBetter: true,
    compute: (m) => {
      if (
        !isValidNumber(m.costOfSales) ||
        !isValidNumber(m.initialInventory) ||
        !isValidNumber(m.finalInventory)
      ) {
        return { value: null, dataUsed: 'Falta costo de ventas, inventario inicial o inventario final.' };
      }
      const avgInv = (m.initialInventory + m.finalInventory) / 2;
      if (avgInv <= 0) {
        return { value: null, dataUsed: 'El inventario promedio debe ser mayor a cero.' };
      }
      return {
        value: m.costOfSales / avgInv,
        dataUsed: `Costo ventas: ${fmtMoney(m.costOfSales)} / Inv. prom.: ${fmtMoney(avgInv)}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Ingrese inventario inicial, inventario final y costo de ventas del periodo.',
          }
        : status === 'cumple'
        ? {
            interpretation: `El inventario rotó ${fmtNum(v!, 2)} veces en el periodo, superando la meta de ${t} veces y reduciendo riesgo de vencimiento.`,
            recommendation: 'Vigilar stock de seguridad por categoría y mantener salida estricta FEFO.',
          }
        : {
            interpretation: `La rotación (${fmtNum(v!, 2)} veces) es inferior a la meta (${t}), aumentando el riesgo de vencimiento de alimentos.`,
            recommendation: 'Aplicar clasificación ABC, impulsar promociones de baja rotación y ajustar tamaños de compra.',
          },
  },
  {
    id: 'exactitud_inventario',
    name: 'Exactitud del inventario',
    area: 'Almacenamiento e Inventarios',
    objective: 'Verificar la confiabilidad entre el inventario físico en bodega y el registrado en el sistema.',
    formula: '(Referencias sin diferencias / Referencias evaluadas) × 100',
    unit: '%',
    higherIsBetter: true,
    compute: (m) => {
      if (
        !isValidNumber(m.inventoryReferencesAccurate) ||
        !isValidNumber(m.inventoryReferencesChecked) ||
        m.inventoryReferencesChecked <= 0
      ) {
        return { value: null, dataUsed: 'Falta el conteo de referencias evaluadas y referencias exactas.' };
      }
      return {
        value: (m.inventoryReferencesAccurate / m.inventoryReferencesChecked) * 100,
        dataUsed: `Exactas: ${m.inventoryReferencesAccurate} / Evaluadas: ${m.inventoryReferencesChecked}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre cuántas referencias se verificaron en conteo físico y cuántas coincidieron exactamente.',
          }
        : status === 'cumple'
        ? {
            interpretation: `La confiabilidad del inventario es del ${fmtNum(v!)}%, cumpliendo el estándar (≥ ${t}%).`,
            recommendation: 'Mantener conteos cíclicos y control estricto de entradas y salidas por lote.',
          }
        : {
            interpretation: `La exactitud del inventario (${fmtNum(v!)}%) está por debajo de la meta (${t}%).`,
            recommendation: 'Implementar conteos cíclicos semanales, codificación de estanterías y registro inmediato de bajas.',
          },
  },
  {
    id: 'porcentaje_vencidos',
    name: 'Porcentaje de productos vencidos',
    area: 'Almacenamiento e Inventarios',
    objective: 'Cuantificar el porcentaje del inventario final perdido por caducidad de alimentos, snacks o medicamentos.',
    formula: '(Valor de productos vencidos / Inventario final) × 100',
    unit: '%',
    higherIsBetter: false,
    compute: (m) => {
      if (!isValidNumber(m.expiredGoodsValue) || !isValidNumber(m.finalInventory) || m.finalInventory <= 0) {
        return { value: null, dataUsed: 'Falta valor de productos vencidos o inventario final.' };
      }
      return {
        value: (m.expiredGoodsValue / m.finalInventory) * 100,
        dataUsed: `Vencidos: ${fmtMoney(m.expiredGoodsValue)} / Inv. final: ${fmtMoney(m.finalInventory)}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre el valor de los productos vencidos dados de baja y el inventario final del periodo.',
          }
        : status === 'cumple'
        ? {
            interpretation: `Los productos vencidos representan el ${fmtNum(v!, 2)}% del inventario final, dentro del umbral aceptable (≤ ${t}%).`,
            recommendation: 'Continuar con rotación FEFO, alertas tempranas a 60 días y negociación de cambios con proveedores.',
          }
        : {
            interpretation: `Los vencimientos alcanzan el ${fmtNum(v!, 2)}% del inventario final, superando la meta máxima (${t}%).`,
            recommendation: 'Implantar método FEFO obligatorio, semáforo de vencimientos y control de vida útil mínima en recepción.',
          },
  },
  {
    id: 'nivel_faltantes',
    name: 'Nivel de faltantes',
    area: 'Almacenamiento e Inventarios',
    objective: 'Medir la proporción de pedidos afectados por errores, quiebres de stock o faltantes.',
    formula: '(Pedidos con errores o faltantes / Total de pedidos recibidos) × 100',
    unit: '%',
    higherIsBetter: false,
    compute: (m) => {
      if (!isValidNumber(m.ordersWithErrors) || !isValidNumber(m.totalOrdersReceived) || m.totalOrdersReceived <= 0) {
        return { value: null, dataUsed: 'Faltan pedidos con errores o total de pedidos recibidos.' };
      }
      return {
        value: (m.ordersWithErrors / m.totalOrdersReceived) * 100,
        dataUsed: `Con errores/faltantes: ${m.ordersWithErrors} / Recibidos: ${m.totalOrdersReceived}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre los pedidos con errores/faltantes y el total de pedidos recibidos.',
          }
        : status === 'cumple'
        ? {
            interpretation: `El nivel de faltantes y errores es del ${fmtNum(v!)}%, dentro del límite aceptable (≤ ${t}%).`,
            recommendation: 'Continuar con doble verificación en alistamiento (picking).',
          }
        : {
            interpretation: `El ${fmtNum(v!)}% de los pedidos presenta faltantes o errores, superando el tope del ${t}%.`,
            recommendation: 'Establecer stocks de seguridad para referencias de alta rotación y listas de chequeo previas al despacho.',
          },
  },
  {
    id: 'costo_almacenamiento',
    name: 'Costo de almacenamiento',
    area: 'Almacenamiento e Inventarios',
    objective: 'Cuantificar el impacto de los costos de bodegaje frente al volumen total de ventas.',
    formula: '(Costos de almacenamiento / Valor total de ventas) × 100',
    unit: '%',
    higherIsBetter: false,
    compute: (m) => {
      if (!isValidNumber(m.storageCosts) || !isValidNumber(m.totalSalesValue) || m.totalSalesValue <= 0) {
        return { value: null, dataUsed: 'Faltan costos de almacenamiento o valor total de ventas.' };
      }
      return {
        value: (m.storageCosts / m.totalSalesValue) * 100,
        dataUsed: `Almacenamiento: ${fmtMoney(m.storageCosts)} / Ventas: ${fmtMoney(m.totalSalesValue)}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre los costos mensuales de bodega/almacenamiento y las ventas totales.',
          }
        : status === 'cumple'
        ? {
            interpretation: `El costo de almacenamiento representa el ${fmtNum(v!)}% de las ventas, cumpliendo la meta (≤ ${t}%).`,
            recommendation: 'Preservar la optimización del espacio estibado y evitar sobrestock.',
          }
        : {
            interpretation: `El almacenamiento consume el ${fmtNum(v!)}% de las ventas, superando el objetivo (${t}%).`,
            recommendation: 'Mejorar densidad de estanterías, depurar obsoletos y acelerar rotación de inventario.',
          },
  },

  // 3. PREPARACIÓN DE PEDIDOS Y OPERACIONES INTERNAS
  {
    id: 'productividad_trabajador',
    name: 'Productividad por trabajador',
    area: 'Preparación de Pedidos y Operaciones',
    objective: 'Evaluar la cantidad promedio de pedidos despachados por cada trabajador operativo en el periodo.',
    formula: 'Total de pedidos entregados / Número de trabajadores',
    unit: 'ped/trab',
    higherIsBetter: true,
    compute: (m) => {
      if (!isValidNumber(m.totalOrdersDelivered) || !isValidNumber(m.workersCount) || m.workersCount <= 0) {
        return { value: null, dataUsed: 'Falta total de pedidos entregados o número promedio de trabajadores.' };
      }
      return {
        value: m.totalOrdersDelivered / m.workersCount,
        dataUsed: `Entregados: ${m.totalOrdersDelivered} / Trabajadores: ${fmtNum(m.workersCount, 1)}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre el total de pedidos entregados y el número de trabajadores operativos.',
          }
        : status === 'cumple'
        ? {
            interpretation: `Cada trabajador aporta en promedio ${fmtNum(v!, 1)} pedidos entregados, superando la meta de ${t} ped/trab.`,
            recommendation: 'Documentar flujos de alistamiento estándar y mantener balance de cargas por área.',
          }
        : {
            interpretation: `La productividad por trabajador (${fmtNum(v!, 1)} ped/trab) está debajo de la meta (${t} ped/trab).`,
            recommendation: 'Eliminar tiempos de búsqueda en bodega, redefinir funciones claras y estandarizar rutas internas.',
          },
  },
  {
    id: 'productividad_laboral',
    name: 'Productividad en preparación de pedidos',
    area: 'Preparación de Pedidos y Operaciones',
    objective: 'Medir el volumen de pedidos o unidades preparadas por cada hora trabajada en operaciones internas.',
    formula: 'Pedidos/unidades preparadas / Horas de preparación (o trabajadas)',
    unit: 'und/h',
    higherIsBetter: true,
    compute: (m) => {
      const hours = isValidNumber(m.totalPreparationHours) && m.totalPreparationHours > 0
        ? m.totalPreparationHours
        : m.hoursWorked;
      if (!isValidNumber(m.unitsProduced) || !isValidNumber(hours) || hours <= 0) {
        return { value: null, dataUsed: 'Faltan pedidos/unidades preparadas u horas de preparación/trabajadas.' };
      }
      return {
        value: m.unitsProduced / hours,
        dataUsed: `Preparados: ${m.unitsProduced} / Horas: ${hours}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre pedidos o unidades preparadas y horas dedicadas a preparación u operación.',
          }
        : status === 'cumple'
        ? {
            interpretation: `Se preparan ${fmtNum(v!, 2)} unidades/pedidos por hora, superando la meta de ${t} und/h.`,
            recommendation: 'Sostener listas de alistamiento digitales y ubicación ABC en bodega.',
          }
        : {
            interpretation: `La productividad horaria en preparación (${fmtNum(v!, 2)} und/h) está por debajo de la meta (${t} und/h).`,
            recommendation: 'Agrupar picking por zonas y reducir desplazamientos innecesarios en almacén.',
          },
  },
  {
    id: 'productos_defectuosos',
    name: 'Porcentaje de pedidos con error o daño',
    area: 'Preparación de Pedidos y Operaciones',
    objective: 'Determinar la tasa de errores en alistamiento, empaques rotos o averías sobre el total preparado.',
    formula: '(Pedidos/unidades con error o daño / Total preparado) × 100',
    unit: '%',
    higherIsBetter: false,
    compute: (m) => {
      if (!isValidNumber(m.defectiveUnits) || !isValidNumber(m.unitsProduced) || m.unitsProduced <= 0) {
        return { value: null, dataUsed: 'Faltan pedidos/unidades con error o total preparado.' };
      }
      return {
        value: (m.defectiveUnits / m.unitsProduced) * 100,
        dataUsed: `Con error/daño: ${m.defectiveUnits} / Preparados: ${m.unitsProduced}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre los pedidos/unidades preparadas y los que presentaron errores o empaque dañado.',
          }
        : status === 'cumple'
        ? {
            interpretation: `La tasa de error o daño en preparación es del ${fmtNum(v!, 2)}%, dentro del estándar (≤ ${t}%).`,
            recommendation: 'Mantener doble chequeo de referencia, lote y estado de bolsas/bultos antes de despacho.',
          }
        : {
            interpretation: `Los errores/daños alcanzan el ${fmtNum(v!, 2)}%, superando el máximo permitido (${t}%).`,
            recommendation: 'Implantar lista de verificación previa al cierre de empaque y capacitar en manipulación de bultos.',
          },
  },
  {
    id: 'porcentaje_desperdicios',
    name: 'Porcentaje de mermas y averías',
    area: 'Preparación de Pedidos y Operaciones',
    objective: 'Medir el peso financiero de bultos rotos, mermas y pérdidas operativas respecto a las ventas.',
    formula: '(Valor de pérdidas, mermas y averías / Valor total de ventas) × 100',
    unit: '%',
    higherIsBetter: false,
    compute: (m) => {
      if (!isValidNumber(m.wasteAndLossValue) || !isValidNumber(m.totalSalesValue) || m.totalSalesValue <= 0) {
        return { value: null, dataUsed: 'Falta valor de pérdidas/mermas o valor total de ventas.' };
      }
      return {
        value: (m.wasteAndLossValue / m.totalSalesValue) * 100,
        dataUsed: `Mermas/Averías: ${fmtMoney(m.wasteAndLossValue)} / Ventas: ${fmtMoney(m.totalSalesValue)}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Cuantifique el valor económico de bultos rotos, mermas y pérdidas del periodo.',
          }
        : status === 'cumple'
        ? {
            interpretation: `Las mermas y averías representan el ${fmtNum(v!, 2)}% de las ventas (meta ≤ ${t}%).`,
            recommendation: 'Continuar monitoreo de manipulación de sacos y control preventivo de plagas.',
          }
        : {
            interpretation: `Las mermas equivalen al ${fmtNum(v!, 2)}% de las ventas, excediendo la meta (${t}%).`,
            recommendation: 'Proteger estanterías contra humedad y roedores, y estandarizar embalaje de sacos pesados.',
          },
  },
  {
    id: 'eficiencia_produccion',
    name: 'Eficiencia en preparación de pedidos',
    area: 'Preparación de Pedidos y Operaciones',
    objective: 'Calcular la proporción de pedidos preparados correctamente a la primera sin reprocesos ni averías.',
    formula: '((Total preparado - Con error o daño) / Total preparado) × 100',
    unit: '%',
    higherIsBetter: true,
    compute: (m) => {
      if (!isValidNumber(m.unitsProduced) || !isValidNumber(m.defectiveUnits) || m.unitsProduced <= 0) {
        return { value: null, dataUsed: 'Faltan unidades/pedidos preparados o con error.' };
      }
      return {
        value: ((m.unitsProduced - m.defectiveUnits) / m.unitsProduced) * 100,
        dataUsed: `Perfectos: ${m.unitsProduced - m.defectiveUnits} / Preparados: ${m.unitsProduced}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Ingrese pedidos/unidades preparadas y los que tuvieron error para calcular eficiencia.',
          }
        : status === 'cumple'
        ? {
            interpretation: `La eficiencia en preparación es del ${fmtNum(v!)}%, superando la meta del ${t}%.`,
            recommendation: 'Sostener protocolo de alistamiento y verificación de lotes.',
          }
        : {
            interpretation: `La eficiencia (${fmtNum(v!)}%) está debajo de la meta (${t}%) por errores o daños en empaque.`,
            recommendation: 'Implementar lectura de código de barras y zona diferenciada de verificación.',
          },
  },

  // 4. TRANSPORTE Y DISTRIBUCIÓN
  {
    id: 'entregas_a_tiempo',
    name: 'Entregas a tiempo',
    area: 'Transporte y Distribución',
    objective: 'Medir el porcentaje de despachos entregados dentro de la ventana horaria prometida.',
    formula: '(Pedidos entregados a tiempo / Total de pedidos entregados) × 100',
    unit: '%',
    higherIsBetter: true,
    compute: (m) => {
      if (!isValidNumber(m.ordersDeliveredOnTime) || !isValidNumber(m.totalOrdersDelivered) || m.totalOrdersDelivered <= 0) {
        return { value: null, dataUsed: 'Faltan pedidos entregados a tiempo o total de entregados.' };
      }
      return {
        value: (m.ordersDeliveredOnTime / m.totalOrdersDelivered) * 100,
        dataUsed: `A tiempo: ${m.ordersDeliveredOnTime} / Entregados: ${m.totalOrdersDelivered}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre los pedidos entregados totales y los entregados puntualmente.',
          }
        : status === 'cumple'
        ? {
            interpretation: `El ${fmtNum(v!)}% de las entregas se realizó a tiempo, cumpliendo la meta (≥ ${t}%).`,
            recommendation: 'Mantener planeación anticipada de rutas y cortes horarios de alistamiento.',
          }
        : {
            interpretation: `Solo el ${fmtNum(v!)}% de las entregas fue puntual, por debajo de la meta (${t}%).`,
            recommendation: 'Optimizar zonificación de rutas, adelantar preparación nocturna y monitorear tiempos en ruta.',
          },
  },
  {
    id: 'costo_por_entrega',
    name: 'Costo por entrega',
    area: 'Transporte y Distribución',
    objective: 'Conocer el costo unitario de distribución por cada pedido entregado al cliente.',
    formula: 'Costos de transporte / Total de pedidos entregados',
    unit: '$/entrega',
    higherIsBetter: false,
    compute: (m) => {
      if (!isValidNumber(m.transportCosts) || !isValidNumber(m.totalOrdersDelivered) || m.totalOrdersDelivered <= 0) {
        return { value: null, dataUsed: 'Faltan costos de transporte o total de pedidos entregados.' };
      }
      return {
        value: m.transportCosts / m.totalOrdersDelivered,
        dataUsed: `Transporte: ${fmtMoney(m.transportCosts)} / Entregados: ${m.totalOrdersDelivered}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre el costo total de transporte y la cantidad de pedidos entregados.',
          }
        : status === 'cumple'
        ? {
            interpretation: `Cada entrega cuesta en promedio ${fmtMoney(v!)}, dentro del presupuesto objetivo (≤ ${fmtMoney(t)}).`,
            recommendation: 'Seguir consolidando carga por zona para mantener la eficiencia en fletes.',
          }
        : {
            interpretation: `El costo por entrega (${fmtMoney(v!)}) supera el referente esperado (${fmtMoney(t)}).`,
            recommendation: 'Consolidar despachos por zona, optimizar capacidad vehicular y negociar tarifas de fletes.',
          },
  },
  {
    id: 'cumplimiento_pedidos',
    name: 'Cumplimiento de pedidos',
    area: 'Transporte y Distribución',
    objective: 'Evaluar la capacidad operativa para despachar la totalidad de los pedidos recibidos.',
    formula: '(Total de pedidos entregados / Total de pedidos recibidos) × 100',
    unit: '%',
    higherIsBetter: true,
    compute: (m) => {
      if (!isValidNumber(m.totalOrdersDelivered) || !isValidNumber(m.totalOrdersReceived) || m.totalOrdersReceived <= 0) {
        return { value: null, dataUsed: 'Falta total de pedidos entregados o recibidos.' };
      }
      return {
        value: (m.totalOrdersDelivered / m.totalOrdersReceived) * 100,
        dataUsed: `Entregados: ${m.totalOrdersDelivered} / Recibidos: ${m.totalOrdersReceived}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre los pedidos recibidos de clientes y los efectivamente entregados.',
          }
        : status === 'cumple'
        ? {
            interpretation: `Se completó el ${fmtNum(v!)}% de los pedidos recibidos, superando la meta (${t}%).`,
            recommendation: 'Sostener sincronización entre ventas, inventario y despacho.',
          }
        : {
            interpretation: `El cumplimiento de pedidos (${fmtNum(v!)}%) está por debajo de la meta (${t}%).`,
            recommendation: 'Identificar pedidos represados por quiebres de inventario o falta de vehículos.',
          },
  },
  {
    id: 'tiempo_promedio_entrega',
    name: 'Tiempo promedio de entrega',
    area: 'Transporte y Distribución',
    objective: 'Medir la velocidad de respuesta logística desde el despacho hasta el cliente final.',
    formula: 'Horas totales de entrega / Total de pedidos entregados',
    unit: 'horas',
    higherIsBetter: false,
    compute: (m) => {
      if (!isValidNumber(m.totalDeliveryHours) || !isValidNumber(m.totalOrdersDelivered) || m.totalOrdersDelivered <= 0) {
        return { value: null, dataUsed: 'Faltan horas totales de entrega o total de pedidos entregados.' };
      }
      return {
        value: m.totalDeliveryHours / m.totalOrdersDelivered,
        dataUsed: `Horas acumuladas: ${m.totalDeliveryHours} h / Entregados: ${m.totalOrdersDelivered}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre la suma de horas de entrega de los pedidos despachados.',
          }
        : status === 'cumple'
        ? {
            interpretation: `El tiempo medio de entrega es de ${fmtNum(v!)} horas, mejor que el límite de ${t} horas.`,
            recommendation: 'Comunicar este tiempo de respuesta como ventaja comercial.',
          }
        : {
            interpretation: `Las entregas promedian ${fmtNum(v!)} horas, excediendo la meta de ${t} horas.`,
            recommendation: 'Implementar cortes de despacho más frecuentes y pre-alistamiento anticipado.',
          },
  },

  // 5. SERVICIO AL CLIENTE
  {
    id: 'nivel_satisfaccion',
    name: 'Nivel de satisfacción',
    area: 'Servicio al Cliente',
    objective: 'Conocer la percepción positiva de los clientes respecto al producto y servicio recibido.',
    formula: '(Clientes satisfechos / Clientes atendidos) × 100',
    unit: '%',
    higherIsBetter: true,
    compute: (m) => {
      if (!isValidNumber(m.satisfiedCustomers) || !isValidNumber(m.customersServed) || m.customersServed <= 0) {
        return { value: null, dataUsed: 'Faltan clientes satisfechos o clientes atendidos.' };
      }
      return {
        value: (m.satisfiedCustomers / m.customersServed) * 100,
        dataUsed: `Satisfechos: ${m.satisfiedCustomers} / Atendidos: ${m.customersServed}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre clientes atendidos y clientes satisfechos (mediante encuesta breve postventa).',
          }
        : status === 'cumple'
        ? {
            interpretation: `El ${fmtNum(v!)}% de los clientes reporta satisfacción, superando la meta (${t}%).`,
            recommendation: 'Implementar programas de fidelización para veterinarias, pet shops y clientes recurrentes.',
          }
        : {
            interpretation: `La satisfacción (${fmtNum(v!)}%) está por debajo de la meta (${t}%).`,
            recommendation: 'Atender causas raíz de insatisfacción (vencimientos, bultos rotos o demoras).',
          },
  },
  {
    id: 'porcentaje_devoluciones',
    name: 'Tasa de devoluciones',
    area: 'Servicio al Cliente',
    objective: 'Medir la proporción de pedidos retornados por vencimiento cercano, daño de empaque o error de despacho.',
    formula: '(Número de devoluciones / Total de pedidos entregados) × 100',
    unit: '%',
    higherIsBetter: false,
    compute: (m) => {
      if (!isValidNumber(m.returnsCount) || !isValidNumber(m.totalOrdersDelivered) || m.totalOrdersDelivered <= 0) {
        return { value: null, dataUsed: 'Falta número de devoluciones o total de pedidos entregados.' };
      }
      return {
        value: (m.returnsCount / m.totalOrdersDelivered) * 100,
        dataUsed: `Devoluciones: ${m.returnsCount} / Entregados: ${m.totalOrdersDelivered}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Registre el número de devoluciones del periodo y pedidos entregados.',
          }
        : status === 'cumple'
        ? {
            interpretation: `La tasa de devoluciones es del ${fmtNum(v!, 2)}%, dentro del umbral óptimo (≤ ${t}%).`,
            recommendation: 'Mantener verificación de empaque, lote y confirmación previa del pedido.',
          }
        : {
            interpretation: `Las devoluciones (${fmtNum(v!, 2)}%) superan el límite (${t}%), elevando costos de logística inversa.`,
            recommendation: 'Clasificar motivos de devolución (avería, vencimiento, error de picking) e intervenir el principal.',
          },
  },
  {
    id: 'porcentaje_reclamaciones',
    name: 'Porcentaje de reclamaciones',
    area: 'Servicio al Cliente',
    objective: 'Evaluar la incidencia de quejas y reclamaciones formales sobre el total de clientes atendidos.',
    formula: '(Número de reclamaciones / Clientes atendidos) × 100',
    unit: '%',
    higherIsBetter: false,
    compute: (m) => {
      if (!isValidNumber(m.claimsCount) || !isValidNumber(m.customersServed) || m.customersServed <= 0) {
        return { value: null, dataUsed: 'Falta número de reclamaciones o clientes atendidos.' };
      }
      return {
        value: (m.claimsCount / m.customersServed) * 100,
        dataUsed: `Reclamaciones: ${m.claimsCount} / Atendidos: ${m.customersServed}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Lleve registro formal de quejas/reclamaciones recibidas por periodo.',
          }
        : status === 'cumple'
        ? {
            interpretation: `Solo el ${fmtNum(v!, 2)}% de los clientes presentó reclamaciones (meta ≤ ${t}%).`,
            recommendation: 'Conservar tiempos ágiles de respuesta en PQRS.',
          }
        : {
            interpretation: `Las reclamaciones alcanzan el ${fmtNum(v!, 2)}%, por encima del máximo deseado (${t}%).`,
            recommendation: 'Crear protocolo de atención en menos de 24h y corregir fallas recurrentes de despacho.',
          },
  },

  // 6. FINANCIEROS
  {
    id: 'margen_utilidad',
    name: 'Margen de utilidad',
    area: 'Financieros',
    objective: 'Determinar el porcentaje de utilidad bruta obtenida sobre las ventas totales.',
    formula: '((Valor total de ventas - Costo de ventas) / Valor total de ventas) × 100',
    unit: '%',
    higherIsBetter: true,
    compute: (m) => {
      if (!isValidNumber(m.totalSalesValue) || !isValidNumber(m.costOfSales) || m.totalSalesValue <= 0) {
        return { value: null, dataUsed: 'Falta valor total de ventas o costo de ventas.' };
      }
      return {
        value: ((m.totalSalesValue - m.costOfSales) / m.totalSalesValue) * 100,
        dataUsed: `Ventas: ${fmtMoney(m.totalSalesValue)} - Costo ventas: ${fmtMoney(m.costOfSales)}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Ingrese ventas totales y costo de ventas del periodo.',
          }
        : status === 'cumple'
        ? {
            interpretation: `El margen bruto de utilidad es del ${fmtNum(v!)}%, cumpliendo la meta (≥ ${t}%).`,
            recommendation: 'Proteger precios y mix de alimentos premium, snacks y accesorios de mayor margen.',
          }
        : {
            interpretation: `El margen bruto (${fmtNum(v!)}%) está por debajo de la meta (${t}%).`,
            recommendation: 'Revisar estructura de costos directos, negociar descuentos por volumen y evitar mermas por vencimiento.',
          },
  },
  {
    id: 'rentabilidad',
    name: 'Rentabilidad operativa logística',
    area: 'Financieros',
    objective: 'Medir el retorno obtenido tras descontar costo de ventas, almacenamiento y transporte sobre los costos invertidos.',
    formula: '((Ventas - Costo ventas - Alm. - Transp.) / (Costo ventas + Alm. + Transp.)) × 100',
    unit: '%',
    higherIsBetter: true,
    compute: (m) => {
      if (
        !isValidNumber(m.totalSalesValue) ||
        !isValidNumber(m.costOfSales) ||
        !isValidNumber(m.storageCosts) ||
        !isValidNumber(m.transportCosts)
      ) {
        return { value: null, dataUsed: 'Faltan ventas, costo de ventas, costos de almacenamiento o transporte.' };
      }
      const totalCost = m.costOfSales + m.storageCosts + m.transportCosts;
      if (totalCost <= 0) {
        return { value: null, dataUsed: 'El costo operativo total debe ser mayor a cero.' };
      }
      const netOp = m.totalSalesValue - totalCost;
      return {
        value: (netOp / totalCost) * 100,
        dataUsed: `Utilidad op.: ${fmtMoney(netOp)} / Costo total: ${fmtMoney(totalCost)}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Complete ventas, costo de ventas, almacenamiento y transporte para evaluar rentabilidad.',
          }
        : status === 'cumple'
        ? {
            interpretation: `La rentabilidad sobre el costo operativo es del ${fmtNum(v!)}%, superando el objetivo (${t}%).`,
            recommendation: 'Reinvertir excedentes en mejoras de trazabilidad, estantería y ruteo.',
          }
        : {
            interpretation: `La rentabilidad (${fmtNum(v!)}%) está por debajo de la meta (${t}%).`,
            recommendation: 'Contener costos logísticos (bodegaje y fletes) e impulsar líneas de mayor contribución.',
          },
  },
  {
    id: 'relacion_costos_ventas',
    name: 'Relación entre costos y ventas',
    area: 'Financieros',
    objective: 'Evaluar qué porcentaje de las ventas absorben conjuntamente el costo de ventas y los costos logísticos.',
    formula: '((Costo de ventas + Almacenamiento + Transporte) / Valor total de ventas) × 100',
    unit: '%',
    higherIsBetter: false,
    compute: (m) => {
      if (
        !isValidNumber(m.totalSalesValue) ||
        !isValidNumber(m.costOfSales) ||
        !isValidNumber(m.storageCosts) ||
        !isValidNumber(m.transportCosts) ||
        m.totalSalesValue <= 0
      ) {
        return { value: null, dataUsed: 'Faltan ventas, costo de ventas, almacenamiento o transporte.' };
      }
      const totalCost = m.costOfSales + m.storageCosts + m.transportCosts;
      return {
        value: (totalCost / m.totalSalesValue) * 100,
        dataUsed: `Costos totales: ${fmtMoney(totalCost)} / Ventas: ${fmtMoney(m.totalSalesValue)}`,
      };
    },
    interpret: (status, v, t) =>
      status === 'insuficiente'
        ? {
            interpretation: 'Información insuficiente para calcular.',
            recommendation: 'Ingrese ventas, costo de ventas, almacenamiento y transporte.',
          }
        : status === 'cumple'
        ? {
            interpretation: `Los costos absorbidos equivalen al ${fmtNum(v!)}% de las ventas, bajo el techo del ${t}%.`,
            recommendation: 'Mantener disciplina presupuestal en toda la cadena.',
          }
        : {
            interpretation: `Los costos absorben el ${fmtNum(v!)}% de las ventas, superando el máximo esperado (${t}%).`,
            recommendation: 'Ejecutar plan de reducción de costos en abastecimiento, vencimientos y fletes.',
          },
  },
];

export function formatKpiValue(value: number | null, unit: string): string {
  if (value === null || !Number.isFinite(value)) return 'Información insuficiente para calcular';
  if (unit === '$/entrega') return fmtMoney(value);
  if (unit === '%') return `${fmtNum(value, 1)}%`;
  if (unit === 'veces' || unit === 'und/h' || unit === 'ped/trab') return `${fmtNum(value, 2)} ${unit}`;
  return `${fmtNum(value, 1)} ${unit}`;
}

export function formatTargetValue(target: number, unit: string): string {
  if (unit === '$/entrega') return fmtMoney(target);
  if (unit === '%') return `${fmtNum(target, 1)}%`;
  return `${fmtNum(target, 1)} ${unit}`;
}

export function calculateKPIs(
  metricsRecords: MonthlyMetrics[],
  customTargets: Record<string, number> = {}
): KPIResult[] {
  const agg = aggregateMonthlyMetrics(metricsRecords);

  return KPI_SPECS.map((spec) => {
    const target = customTargets[spec.id] ?? DEFAULT_KPI_TARGETS[spec.id];
    if (!agg) {
      return {
        id: spec.id,
        name: spec.name,
        area: spec.area,
        objective: spec.objective,
        formula: spec.formula,
        dataUsed: 'Sin datos numéricos registrados para el periodo.',
        value: null,
        formattedValue: 'Información insuficiente para calcular',
        unit: spec.unit,
        target,
        formattedTarget: formatTargetValue(target, spec.unit),
        higherIsBetter: spec.higherIsBetter,
        complianceLevel: null,
        status: 'insuficiente' as KPIStatus,
        interpretation: 'Información insuficiente para calcular.',
        recommendation: 'Registre los datos cuantitativos en el Módulo de Datos Numéricos.',
      };
    }

    const { value, dataUsed } = spec.compute(agg);
    if (value === null || !Number.isFinite(value)) {
      const { interpretation, recommendation } = spec.interpret('insuficiente', null, target, spec.unit);
      return {
        id: spec.id,
        name: spec.name,
        area: spec.area,
        objective: spec.objective,
        formula: spec.formula,
        dataUsed,
        value: null,
        formattedValue: 'Información insuficiente para calcular',
        unit: spec.unit,
        target,
        formattedTarget: formatTargetValue(target, spec.unit),
        higherIsBetter: spec.higherIsBetter,
        complianceLevel: null,
        status: 'insuficiente' as KPIStatus,
        interpretation,
        recommendation,
      };
    }

    let complianceLevel = 0;
    if (spec.higherIsBetter) {
      complianceLevel = target > 0 ? Math.min(120, Math.max(0, (value / target) * 100)) : 100;
    } else {
      if (value <= 0) {
        complianceLevel = 100;
      } else {
        complianceLevel = Math.min(120, Math.max(0, (target / value) * 100));
      }
    }

    const meetsTarget = spec.higherIsBetter ? value >= target : value <= target;
    let status: KPIStatus = 'cumple';
    if (!meetsTarget) {
      status = complianceLevel >= 80 ? 'alerta' : 'critico';
    }

    const { interpretation, recommendation } = spec.interpret(status, value, target, spec.unit);

    return {
      id: spec.id,
      name: spec.name,
      area: spec.area,
      objective: spec.objective,
      formula: spec.formula,
      dataUsed,
      value,
      formattedValue: formatKpiValue(value, spec.unit),
      unit: spec.unit,
      target,
      formattedTarget: formatTargetValue(target, spec.unit),
      higherIsBetter: spec.higherIsBetter,
      complianceLevel: Number(complianceLevel.toFixed(1)),
      status,
      interpretation,
      recommendation,
    };
  });
}

export function getOverallCompliance(kpis: KPIResult[]): number | null {
  const valid = kpis.filter((k) => k.complianceLevel !== null);
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, k) => acc + Math.min(100, k.complianceLevel ?? 0), 0);
  return Number((sum / valid.length).toFixed(1));
}
