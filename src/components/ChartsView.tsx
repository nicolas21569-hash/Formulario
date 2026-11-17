import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Company, KPIArea, MonthlyMetrics } from '../types/domain';
import { formatPeriodLabel } from '../utils/formatters';
import { calculateKPIs } from '../utils/kpiEngine';
import { NavSection } from './Sidebar';

interface ChartsViewProps {
  companies: Company[];
  selectedCompanyId: string;
  onSelectCompany: (id: string) => void;
  allMetrics: MonthlyMetrics[];
  customTargets: Record<string, Record<string, number>>;
  onNavigate: (section: NavSection) => void;
}

const AREAS: Array<'Todas' | KPIArea> = [
  'Todas',
  'Compras y Abastecimiento',
  'Almacenamiento e Inventarios',
  'Producción',
  'Transporte y Distribución',
  'Servicio al Cliente',
  'Financieros',
];

export const ChartsView: React.FC<ChartsViewProps> = ({
  companies,
  selectedCompanyId,
  onSelectCompany,
  allMetrics,
  customTargets,
  onNavigate,
}) => {
  const [areaFilter, setAreaFilter] = useState<'Todas' | KPIArea>('Todas');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');

  const company = companies.find((c) => c.id === selectedCompanyId) ?? companies[0];
  const companyMetrics = useMemo(
    () => (company ? allMetrics.filter((m) => m.companyId === company.id).sort((a, b) => a.period.localeCompare(b.period)) : []),
    [company, allMetrics]
  );

  const activeMetrics = useMemo(
    () => (periodFilter === 'ALL' ? companyMetrics : companyMetrics.filter((m) => m.period === periodFilter)),
    [companyMetrics, periodFilter]
  );

  const kpis = useMemo(
    () => (company ? calculateKPIs(activeMetrics, customTargets[company.id]) : []),
    [company, activeMetrics, customTargets]
  );

  const filteredKpis = useMemo(
    () => kpis.filter((k) => (areaFilter === 'Todas' ? true : k.area === areaFilter)),
    [kpis, areaFilter]
  );

  const resultsVsTargetsData = useMemo(() => {
    return filteredKpis
      .filter((k) => k.value !== null && k.unit === '%')
      .map((k) => ({
        name: k.name.length > 22 ? `${k.name.slice(0, 20)}…` : k.name,
        fullName: k.name,
        Resultado: Number((k.value ?? 0).toFixed(1)),
        Meta: k.target,
      }));
  }, [filteredKpis]);

  const complianceBarData = useMemo(() => {
    return filteredKpis
      .filter((k) => k.complianceLevel !== null)
      .map((k) => ({
        name: k.name.length > 22 ? `${k.name.slice(0, 20)}…` : k.name,
        fullName: k.name,
        Cumplimiento: Math.min(100, k.complianceLevel ?? 0),
        status: k.status,
      }));
  }, [filteredKpis]);

  const monthlyTrendData = useMemo(() => {
    return companyMetrics.map((m) => {
      const mKpis = calculateKPIs([m], company ? customTargets[company.id] : {});
      const getVal = (id: string) => {
        const val = mKpis.find((k) => k.id === id)?.value;
        return val !== null && val !== undefined ? Number(val.toFixed(1)) : null;
      };
      return {
        mes: formatPeriodLabel(m.period),
        'Entregas a tiempo (%)': getVal('entregas_a_tiempo'),
        'Satisfacción (%)': getVal('nivel_satisfaccion'),
        'Exactitud inv. (%)': getVal('exactitud_inventario'),
        'Margen utilidad (%)': getVal('margen_utilidad'),
      };
    });
  }, [companyMetrics, company, customTargets]);

  const costPieData = useMemo(() => {
    const sum = (fn: (m: MonthlyMetrics) => number | null) =>
      activeMetrics.reduce((acc, m) => acc + (fn(m) ?? 0), 0);
    return [
      { name: 'Compras', value: sum((m) => m.totalPurchaseValue), color: '#0B1E3B' },
      { name: 'Almacenamiento', value: sum((m) => m.storageCosts), color: '#15803D' },
      { name: 'Transporte', value: sum((m) => m.transportCosts), color: '#0284C7' },
      { name: 'Desperdicios', value: sum((m) => m.wasteAndLossValue), color: '#D97706' },
    ].filter((x) => x.value > 0);
  }, [activeMetrics]);

  if (!company) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 font-display text-lg font-semibold text-[#0B1E3B]">
          Registre una empresa para visualizar gráficas
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

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
          Sistema Automático de Gráficas Estadísticas
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Visualización interactiva de resultados frente a metas, comparaciones mensuales, rendimiento por área y distribución de costos.
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa</label>
          <select
            value={company.id}
            onChange={(e) => onSelectCompany(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Área Logística</label>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value as 'Todas' | KPIArea)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
          >
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Periodo</label>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
          >
            <option value="ALL">Consolidado ({companyMetrics.length} meses)</option>
            {companyMetrics.map((m) => (
              <option key={m.period} value={m.period}>
                {formatPeriodLabel(m.period)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {companyMetrics.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">
            No hay datos numéricos registrados para <strong>{company.name}</strong>. Ingrese al menos un mes para generar las gráficas automáticamente.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('metrics')}
            className="mt-4 rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
          >
            Ingresar Datos Numéricos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 1. Comparación Resultados vs Metas */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
              Comparación: Resultado vs Meta (%)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Indicadores porcentuales del filtro seleccionado</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resultsVsTargetsData} margin={{ top: 8, right: 12, left: -12, bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} angle={-18} textAnchor="end" interval={0} height={55} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip labelFormatter={(_l, p) => p?.[0]?.payload?.fullName ?? ''} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Resultado" fill="#0B1E3B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Meta" fill="#16A34A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Evolución Mensual (Gráfica de líneas) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
              Evolución Mensual de Indicadores Clave
            </h3>
            <p className="text-xs text-slate-500 mb-4">Tendencia histórica de desempeño (%) mes a mes</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData} margin={{ top: 8, right: 16, left: -12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="Entregas a tiempo (%)" stroke="#0B1E3B" strokeWidth={2.5} connectNulls />
                  <Line type="monotone" dataKey="Satisfacción (%)" stroke="#16A34A" strokeWidth={2.5} connectNulls />
                  <Line type="monotone" dataKey="Exactitud inv. (%)" stroke="#0284C7" strokeWidth={2} connectNulls />
                  <Line type="monotone" dataKey="Margen utilidad (%)" stroke="#D97706" strokeWidth={2} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Cumplimiento de Indicadores */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
              Nivel de Cumplimiento por Indicador (%)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Verde ≥ meta · Ámbar alerta · Rojo crítico</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceBarData} margin={{ top: 8, right: 12, left: -12, bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} angle={-18} textAnchor="end" interval={0} height={55} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    formatter={(v) => [`${v ?? 0}%`, 'Cumplimiento']}
                    labelFormatter={(_l, p) => p?.[0]?.payload?.fullName ?? ''}
                  />
                  <Bar dataKey="Cumplimiento" radius={[4, 4, 0, 0]}>
                    {complianceBarData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={
                          entry.status === 'cumple'
                            ? '#16A34A'
                            : entry.status === 'alerta'
                            ? '#D97706'
                            : '#DC2626'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Gráfica circular de estructura de costos */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
              Distribución de Costos Operativos y Logísticos
            </h3>
            <p className="text-xs text-slate-500 mb-4">Proporción entre compras, bodega, transporte y desperdicios</p>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={86} paddingAngle={3}>
                    {costPieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        maximumFractionDigits: 0,
                      }).format(Number(value ?? 0))
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
