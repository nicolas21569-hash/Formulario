import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Save, Trash2 } from 'lucide-react';
import { Company, MonthlyMetrics } from '../types/domain';
import { formatPeriodLabel, generateId, getRecentThreeMonths } from '../utils/formatters';
import { NavSection } from './Sidebar';

interface MetricsViewProps {
  company: Company | undefined;
  metrics: MonthlyMetrics[];
  onSaveMetrics: (record: MonthlyMetrics) => void;
  onDeleteMetrics: (id: string) => void;
  onNavigate: (section: NavSection) => void;
}

type NumericFieldKey = keyof Omit<MonthlyMetrics, 'id' | 'companyId' | 'period' | 'updatedAt' | 'isDemo'>;

interface FieldGroup {
  title: string;
  subtitle: string;
  fields: Array<{ key: NumericFieldKey; label: string; unit?: string }>;
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    title: 'Pedidos, Entregas y Distribución',
    subtitle: 'Volumen de órdenes atendidas, puntualidad, tiempos y devoluciones.',
    fields: [
      { key: 'totalOrdersReceived', label: 'Total de pedidos recibidos', unit: 'pedidos' },
      { key: 'totalOrdersDelivered', label: 'Total de pedidos entregados', unit: 'pedidos' },
      { key: 'ordersDeliveredOnTime', label: 'Pedidos entregados a tiempo', unit: 'pedidos' },
      { key: 'ordersWithErrors', label: 'Pedidos con errores o faltantes', unit: 'pedidos' },
      { key: 'totalDeliveryHours', label: 'Horas totales de entrega (acumulado)', unit: 'horas' },
      { key: 'returnsCount', label: 'Número de devoluciones', unit: 'devoluciones' },
    ],
  },
  {
    title: 'Compras y Abastecimiento',
    subtitle: 'Órdenes emitidas, puntualidad de proveedores y montos de compra.',
    fields: [
      { key: 'purchasesMade', label: 'Compras realizadas (órdenes)', unit: 'órdenes' },
      { key: 'supplierOrdersOnTime', label: 'Pedidos recibidos a tiempo (proveedores)', unit: 'órdenes' },
      { key: 'totalSupplyDays', label: 'Días totales de abastecimiento (suma)', unit: 'días' },
      { key: 'totalPurchaseValue', label: 'Valor total de compras', unit: '$' },
    ],
  },
  {
    title: 'Ventas, Costos Logísticos y Finanzas',
    subtitle: 'Ingresos, costos de ventas, almacenamiento, transporte y desperdicios.',
    fields: [
      { key: 'totalSalesValue', label: 'Valor total de ventas', unit: '$' },
      { key: 'costOfSales', label: 'Costo de ventas', unit: '$' },
      { key: 'storageCosts', label: 'Costos de almacenamiento', unit: '$' },
      { key: 'transportCosts', label: 'Costos de transporte', unit: '$' },
      { key: 'wasteAndLossValue', label: 'Valor de pérdidas y desperdicios', unit: '$' },
    ],
  },
  {
    title: 'Inventarios y Conteos Físicos',
    subtitle: 'Saldos inicial/final y resultados de verificación física de referencias.',
    fields: [
      { key: 'initialInventory', label: 'Inventario inicial', unit: '$' },
      { key: 'finalInventory', label: 'Inventario final', unit: '$' },
      { key: 'inventoryReferencesChecked', label: 'Referencias evaluadas en conteo', unit: 'SKUs' },
      { key: 'inventoryReferencesAccurate', label: 'Referencias sin diferencias', unit: 'SKUs' },
    ],
  },
  {
    title: 'Producción, Talento Humano y Servicio al Cliente',
    subtitle: 'Unidades producidas, horas laboradas, personal y satisfacción.',
    fields: [
      { key: 'unitsProduced', label: 'Unidades producidas', unit: 'und' },
      { key: 'defectiveUnits', label: 'Unidades defectuosas', unit: 'und' },
      { key: 'hoursWorked', label: 'Horas trabajadas', unit: 'horas' },
      { key: 'workersCount', label: 'Número de trabajadores', unit: 'personas' },
      { key: 'customersServed', label: 'Clientes atendidos', unit: 'clientes' },
      { key: 'satisfiedCustomers', label: 'Clientes satisfechos', unit: 'clientes' },
      { key: 'claimsCount', label: 'Número de reclamaciones / quejas', unit: 'reclamos' },
    ],
  },
];

function createEmptyRecord(companyId: string, period: string): MonthlyMetrics {
  return {
    id: generateId('met'),
    companyId,
    period,
    totalOrdersReceived: null,
    totalOrdersDelivered: null,
    ordersDeliveredOnTime: null,
    ordersWithErrors: null,
    purchasesMade: null,
    supplierOrdersOnTime: null,
    totalSupplyDays: null,
    totalPurchaseValue: null,
    totalSalesValue: null,
    storageCosts: null,
    transportCosts: null,
    totalDeliveryHours: null,
    unitsProduced: null,
    defectiveUnits: null,
    returnsCount: null,
    claimsCount: null,
    customersServed: null,
    satisfiedCustomers: null,
    wasteAndLossValue: null,
    initialInventory: null,
    finalInventory: null,
    inventoryReferencesChecked: null,
    inventoryReferencesAccurate: null,
    costOfSales: null,
    hoursWorked: null,
    workersCount: null,
    updatedAt: new Date().toISOString(),
  };
}

export const MetricsView: React.FC<MetricsViewProps> = ({
  company,
  metrics,
  onSaveMetrics,
  onDeleteMetrics,
  onNavigate,
}) => {
  const recentMonths = useMemo(() => getRecentThreeMonths(), []);
  const availablePeriods = useMemo(() => {
    const existing = metrics.map((m) => m.period);
    return Array.from(new Set([...recentMonths, ...existing])).sort();
  }, [metrics, recentMonths]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(recentMonths[2]);
  const [customPeriodInput, setCustomPeriodInput] = useState<string>('');
  const [form, setForm] = useState<MonthlyMetrics | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!company) {
      setForm(null);
      return;
    }
    const existing = metrics.find((m) => m.companyId === company.id && m.period === selectedPeriod);
    if (existing) {
      setForm(existing);
    } else {
      setForm(createEmptyRecord(company.id, selectedPeriod));
    }
  }, [company?.id, selectedPeriod, metrics]);

  if (!company) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 font-display text-lg font-semibold text-[#0B1E3B]">
          Registre una empresa para ingresar datos numéricos
        </h3>
        <button
          type="button"
          onClick={() => onNavigate('companies')}
          className="mt-4 rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
        >
          Ir a Registro de Empresas
        </button>
      </div>
    );
  }

  const handleFieldChange = (key: NumericFieldKey, rawVal: string) => {
    if (!form) return;
    const parsed = rawVal === '' ? null : Number(rawVal);
    setForm({
      ...form,
      [key]: parsed !== null && Number.isFinite(parsed) ? parsed : null,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    onSaveMetrics({
      ...form,
      updatedAt: new Date().toISOString(),
    });
    setSavedNotice(`Datos de ${formatPeriodLabel(form.period)} guardados. Los 21 KPIs fueron recalculados.`);
    setTimeout(() => setSavedNotice(null), 4000);
  };

  const handleAddCustomPeriod = () => {
    if (!/^\d{4}-\d{2}$/.test(customPeriodInput)) return;
    setSelectedPeriod(customPeriodInput);
    setCustomPeriodInput('');
  };

  const existingRecord = metrics.find((m) => m.companyId === company.id && m.period === selectedPeriod);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
            Recolección de Datos Numéricos Mensuales
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Empresa: <span className="font-semibold text-slate-900">{company.name}</span> · Registre los últimos 3 meses o seleccione otro periodo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('kpis')}
          className="inline-flex items-center gap-2 rounded-lg border border-[#0B1E3B] bg-white px-4 py-2 text-sm font-medium text-[#0B1E3B] hover:bg-slate-50 whitespace-nowrap cursor-pointer"
        >
          <span>Ver Indicadores Calculados</span>
        </button>
      </div>

      {/* Period selector tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 mr-1">Periodo de análisis:</span>
          {availablePeriods.map((period) => {
            const hasSaved = metrics.some((m) => m.period === period);
            const active = period === selectedPeriod;
            return (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0B1E3B] text-white'
                    : hasSaved
                    ? 'border border-emerald-300 bg-emerald-50 text-[#15803D] hover:bg-emerald-100'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {formatPeriodLabel(period)} {hasSaved ? '· Cargado' : ''}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={customPeriodInput}
            onChange={(e) => setCustomPeriodInput(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono focus:border-[#0B1E3B] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddCustomPeriod}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Seleccionar mes
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {form && (
        <form onSubmit={handleSave} className="space-y-6">
          {FIELD_GROUPS.map((group) => (
            <div key={group.title} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
                  {group.title}
                </h3>
                <p className="text-xs text-slate-500">{group.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.fields.map((field) => {
                  const val = form[field.key];
                  return (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {field.label}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="any"
                          min={0}
                          value={val === null || val === undefined ? '' : val}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder="0"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-sm font-mono tabular-nums focus:border-[#0B1E3B] focus:outline-none"
                        />
                        {field.unit && (
                          <span className="absolute right-3 text-xs text-slate-400 pointer-events-none">
                            {field.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div className="text-xs text-slate-500">
              Periodo actual: <strong className="text-slate-900">{formatPeriodLabel(selectedPeriod)}</strong> · Los campos vacíos mostrarán "Información insuficiente para calcular" en su KPI respectivo.
            </div>
            <div className="flex items-center gap-3">
              {existingRecord && (
                <button
                  type="button"
                  onClick={() => onDeleteMetrics(existingRecord.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Borrar mes</span>
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-5 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Guardar Datos de {formatPeriodLabel(selectedPeriod)}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
