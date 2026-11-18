import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  XCircle,
} from 'lucide-react';
import { Company, KPIArea, KPIResult, MonthlyMetrics } from '../types/domain';
import { formatPeriodLabel } from '../utils/formatters';
import { calculateKPIs, getOverallCompliance } from '../utils/kpiEngine';
import { NavSection } from './Sidebar';

interface KPIsViewProps {
  company: Company | undefined;
  metrics: MonthlyMetrics[];
  customTargets: Record<string, number>;
  onUpdateTarget: (companyId: string, kpiId: string, target: number) => void;
  onNavigate: (section: NavSection) => void;
}

const AREAS: Array<'Todas' | KPIArea> = [
  'Todas',
  'Compras y Abastecimiento',
  'Almacenamiento e Inventarios',
  'Preparación de Pedidos y Operaciones',
  'Transporte y Distribución',
  'Servicio al Cliente',
  'Financieros',
];

export const KPIsView: React.FC<KPIsViewProps> = ({
  company,
  metrics,
  customTargets,
  onUpdateTarget,
  onNavigate,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [selectedArea, setSelectedArea] = useState<'Todas' | KPIArea>('Todas');
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const periods = useMemo(
    () => [...metrics].map((m) => m.period).sort(),
    [metrics]
  );

  const filteredMetrics = useMemo(() => {
    if (selectedPeriod === 'ALL') return metrics;
    return metrics.filter((m) => m.period === selectedPeriod);
  }, [metrics, selectedPeriod]);

  const kpis = useMemo(
    () => calculateKPIs(filteredMetrics, customTargets),
    [filteredMetrics, customTargets]
  );

  const visibleKpis = useMemo(() => {
    return kpis.filter((k) => {
      if (selectedArea !== 'Todas' && k.area !== selectedArea) return false;
      if (onlyAlerts && k.status !== 'alerta' && k.status !== 'critico') return false;
      return true;
    });
  }, [kpis, selectedArea, onlyAlerts]);

  const overall = getOverallCompliance(kpis);
  const alertKpis = kpis.filter((k) => k.status === 'critico' || k.status === 'alerta');

  if (!company) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <Calculator className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 font-display text-lg font-semibold text-[#0B1E3B]">
          Seleccione una empresa para consultar sus indicadores
        </h3>
        <button
          type="button"
          onClick={() => onNavigate('companies')}
          className="mt-4 rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
        >
          Ir a Empresas
        </button>
      </div>
    );
  }

  const renderStatusBadge = (kpi: KPIResult) => {
    if (kpi.status === 'cumple') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Cumple ({kpi.complianceLevel}%)</span>
        </span>
      );
    }
    if (kpi.status === 'alerta') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>En alerta ({kpi.complianceLevel}%)</span>
        </span>
      );
    }
    if (kpi.status === 'critico') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
          <XCircle className="h-3.5 w-3.5" />
          <span>Crítico ({kpi.complianceLevel}%)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
        <Info className="h-3.5 w-3.5" />
        <span>Insuficiente</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
            Indicadores Automáticos de Gestión (KPIs)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Empresa: <span className="font-semibold text-slate-900">{company.name}</span> · Cumplimiento global:{' '}
            <span className="font-mono font-bold text-[#15803D] tabular-nums">
              {overall !== null ? `${overall}%` : 'Información insuficiente'}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('metrics')}
          className="rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] whitespace-nowrap cursor-pointer"
        >
          Actualizar Datos Numéricos
        </button>
      </div>

      {/* Alert strip */}
      {alertKpis.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm text-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              <strong>{alertKpis.length} indicadores</strong> se encuentran por debajo de la meta establecida.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOnlyAlerts(!onlyAlerts)}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 cursor-pointer"
          >
            {onlyAlerts ? `Ver todos los ${kpis.length} KPIs` : 'Filtrar solo alertas'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => setSelectedArea(area)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                selectedArea === area
                  ? 'bg-[#0B1E3B] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="kpi-period-filter" className="text-xs font-medium text-slate-600">
            Periodo:
          </label>
          <select
            id="kpi-period-filter"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-[#0B1E3B] focus:outline-none"
          >
            <option value="ALL">Acumulado ({periods.length} meses)</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                {formatPeriodLabel(p)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards / Expandable technical breakdown with all 11 required items */}
      <div className="space-y-3">
        {visibleKpis.map((kpi) => {
          const isOpen = expandedId === kpi.id;
          return (
            <div
              key={kpi.id}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-colors"
            >
              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-[#0B1E3B]">{kpi.area}</span>
                    <span aria-hidden="true">·</span>
                    <span>{kpi.higherIsBetter ? 'Mayor resultado es positivo' : 'Menor resultado es positivo'}</span>
                  </div>
                  <h3 className="mt-0.5 font-display text-base font-semibold text-slate-900">
                    {kpi.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">{kpi.interpretation}</p>
                </div>

                <div className="flex flex-wrap items-center gap-5 shrink-0">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500">Resultado</p>
                    <p className="font-mono text-lg font-bold text-[#0B1E3B] tabular-nums">
                      {kpi.value !== null ? kpi.formattedValue : 'Insuficiente'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] text-slate-500">Meta ({kpi.unit})</p>
                    <input
                      type="number"
                      step="any"
                      value={kpi.target}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (Number.isFinite(val)) {
                          onUpdateTarget(company.id, kpi.id, val);
                        }
                      }}
                      aria-label={`Meta para ${kpi.name}`}
                      className="w-20 rounded border border-slate-300 px-2 py-1 text-right font-mono text-xs font-semibold text-slate-800 tabular-nums focus:border-[#0B1E3B] focus:outline-none"
                    />
                  </div>

                  <div className="min-w-[130px] text-right">{renderStatusBadge(kpi)}</div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : kpi.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <span>Ficha</span>
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                  <div>
                    <span className="font-semibold text-[#0B1E3B]">1. Nombre: </span>
                    <span className="text-slate-700">{kpi.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#0B1E3B]">2. Área: </span>
                    <span className="text-slate-700">{kpi.area}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#0B1E3B]">7. Unidad de medida: </span>
                    <span className="font-mono text-slate-700">{kpi.unit}</span>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="font-semibold text-[#0B1E3B]">3. Objetivo: </span>
                    <span className="text-slate-700">{kpi.objective}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-[#0B1E3B]">4. Fórmula matemática: </span>
                    <span className="font-mono text-slate-800">{kpi.formula}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#0B1E3B]">5. Datos utilizados: </span>
                    <span className="font-mono text-slate-700">{kpi.dataUsed}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#0B1E3B]">6. Resultado calculado: </span>
                    <span className="font-mono font-semibold text-[#0B1E3B]">{kpi.formattedValue}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#0B1E3B]">8. Meta establecida: </span>
                    <span className="font-mono font-semibold text-slate-800">{kpi.formattedTarget}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#0B1E3B]">9. Nivel de cumplimiento: </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {kpi.complianceLevel !== null ? `${kpi.complianceLevel}%` : 'No calculable'}
                    </span>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="font-semibold text-[#0B1E3B]">10. Interpretación del resultado: </span>
                    <span className="text-slate-700">{kpi.interpretation}</span>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="font-semibold text-[#15803D]">11. Recomendación de mejora: </span>
                    <span className="text-slate-800">{kpi.recommendation}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Historial de Resultados por Mes */}
      {periods.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-display text-base font-bold text-[#0B1E3B]">
              Historial Comparativo de Resultados por Periodo
            </h3>
            <p className="text-xs text-slate-500">
              Evolución histórica mes a mes de cada indicador frente a su meta actual.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Indicador</th>
                  <th className="px-3 py-2.5">Meta</th>
                  {periods.map((p) => (
                    <th key={p} className="px-3 py-2.5 text-right whitespace-nowrap">
                      {formatPeriodLabel(p)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleKpis.map((refKpi) => (
                  <tr key={refKpi.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{refKpi.name}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-500">{refKpi.formattedTarget}</td>
                    {periods.map((p) => {
                      const rec = metrics.find((m) => m.period === p);
                      const monthKpi = rec
                        ? calculateKPIs([rec], customTargets).find((x) => x.id === refKpi.id)
                        : undefined;
                      return (
                        <td
                          key={p}
                          className={`px-3 py-2.5 text-right font-mono tabular-nums ${
                            monthKpi?.status === 'cumple'
                              ? 'text-[#15803D] font-semibold'
                              : monthKpi?.status === 'alerta'
                              ? 'text-amber-700 font-semibold'
                              : monthKpi?.status === 'critico'
                              ? 'text-red-600 font-semibold'
                              : 'text-slate-400'
                          }`}
                        >
                          {monthKpi && monthKpi.value !== null ? monthKpi.formattedValue : 'Sin datos'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
