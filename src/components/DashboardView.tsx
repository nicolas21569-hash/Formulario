import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ClipboardCheck,
  Database,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Company, KPIArea, PageConfig, WorkspaceData } from '../types/domain';
import { DEFAULT_PAGE_CONFIG } from '../data/interviewSchema';
import { generateDiagnosticSummary } from '../utils/diagnosticEngine';
import { calculateKPIs, getOverallCompliance } from '../utils/kpiEngine';
import { NavSection } from './Sidebar';

interface DashboardViewProps {
  workspace: WorkspaceData;
  selectedCompanyId: string;
  onSelectCompany: (id: string) => void;
  onNavigate: (section: NavSection) => void;
  onLoadDemo: () => void;
  onClearDemo: () => void;
  pageConfig?: PageConfig;
}

const AREAS: KPIArea[] = [
  'Compras y Abastecimiento',
  'Almacenamiento e Inventarios',
  'Preparación de Pedidos y Operaciones',
  'Transporte y Distribución',
  'Servicio al Cliente',
  'Financieros',
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  workspace,
  selectedCompanyId,
  onSelectCompany,
  onNavigate,
  onLoadDemo,
  onClearDemo,
  pageConfig = DEFAULT_PAGE_CONFIG,
}) => {
  const hasDemo = workspace.companies.some((c) => c.isDemo);

  const stats = useMemo(() => {
    const companiesCount = workspace.companies.length;
    const interviewsCount = workspace.interviews.length + (workspace.workerInterviews?.length ?? 0);
    const workersCount = workspace.workers?.length ?? 0;
    const completedDiagnostics = workspace.companies.filter((c) => {
      const hasCompletedInterview = workspace.interviews.some(
        (i) => i.companyId === c.id && i.status === 'completada'
      );
      const hasMetrics = workspace.metrics.some((m) => m.companyId === c.id);
      return hasCompletedInterview || hasMetrics;
    }).length;

    let totalProcessesIdentified = 0;
    let totalCalculatedKpis = 0;
    const complianceValues: number[] = [];

    for (const c of workspace.companies) {
      const cMetrics = workspace.metrics.filter((m) => m.companyId === c.id);
      const cInterviews = workspace.interviews.filter((i) => i.companyId === c.id);
      const cWorkers = (workspace.workers ?? []).filter((w) => w.companyId === c.id);
      const cWI = (workspace.workerInterviews ?? []).filter((wi) => wi.companyId === c.id);
      const kpis = calculateKPIs(cMetrics, workspace.customTargets[c.id]);
      const diag = generateDiagnosticSummary(c.id, cInterviews, kpis, cWI, cWorkers);

      totalProcessesIdentified += diag.processes.filter(
        (p) => p.status !== 'Sin evaluar' && p.status !== 'No aplica'
      ).length;
      totalCalculatedKpis += kpis.filter((k) => k.value !== null).length;

      const comp = getOverallCompliance(kpis);
      if (comp !== null) complianceValues.push(comp);
    }

    const globalCompliance =
      complianceValues.length > 0
        ? Number((complianceValues.reduce((a, b) => a + b, 0) / complianceValues.length).toFixed(1))
        : null;

    return {
      companiesCount,
      interviewsCount,
      workersCount,
      completedDiagnostics,
      totalProcessesIdentified,
      totalCalculatedKpis,
      globalCompliance,
    };
  }, [workspace]);

  const activeCompany: Company | undefined =
    workspace.companies.find((c) => c.id === selectedCompanyId) ?? workspace.companies[0];

  const activeCompanyAnalysis = useMemo(() => {
    if (!activeCompany) return null;
    const cMetrics = workspace.metrics.filter((m) => m.companyId === activeCompany.id);
    const kpis = calculateKPIs(cMetrics, workspace.customTargets[activeCompany.id]);
    const belowTarget = kpis.filter((k) => k.status === 'critico' || k.status === 'alerta');

    const areaChartData = AREAS.map((area) => {
      const areaKpis = kpis.filter((k) => k.area === area && k.complianceLevel !== null);
      const avg =
        areaKpis.length > 0
          ? Number(
              (
                areaKpis.reduce((a, b) => a + Math.min(100, b.complianceLevel ?? 0), 0) /
                areaKpis.length
              ).toFixed(1)
            )
          : 0;
      return {
        area: area
          .replace(' y Abastecimiento', '')
          .replace(' e Inventarios', '')
          .replace(' y Operaciones', '')
          .replace(' y Distribución', ''),
        fullArea: area,
        cumplimiento: avg,
      };
    });

    const statusDistribution = [
      {
        name: 'Cumple meta',
        value: kpis.filter((k) => k.status === 'cumple').length,
        color: '#16A34A',
      },
      {
        name: 'En alerta',
        value: kpis.filter((k) => k.status === 'alerta').length,
        color: '#D97706',
      },
      {
        name: 'Crítico',
        value: kpis.filter((k) => k.status === 'critico').length,
        color: '#DC2626',
      },
      {
        name: 'Sin datos',
        value: kpis.filter((k) => k.status === 'insuficiente').length,
        color: '#94A3B8',
      },
    ].filter((s) => s.value > 0);

    return { kpis, belowTarget, areaChartData, statusDistribution };
  }, [activeCompany, workspace]);

  const recentCompanies = useMemo(() => {
    return [...workspace.companies]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 6);
  }, [workspace.companies]);

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
            {pageConfig.dashboardTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {pageConfig.dashboardSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!hasDemo ? (
            <button
              type="button"
              onClick={onLoadDemo}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Database className="h-4 w-4 text-[#0B1E3B]" />
              <span>Cargar empresa de demostración</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClearDemo}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Quitar datos demo</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('companies')}
            className="inline-flex items-center gap-2 rounded-lg border border-[#0B1E3B] bg-[#0B1E3B] px-4 py-2 text-sm font-medium text-white hover:bg-[#132d56] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Empresa</span>
          </button>
        </div>
      </div>

      {/* 6 Mandatory Dashboard KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Empresas registradas</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#0B1E3B] tabular-nums">
            {stats.companiesCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Entrevistas · Trabajadores</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#0B1E3B] tabular-nums">
            {stats.interviewsCount} <span className="text-sm font-normal text-slate-500">/ {stats.workersCount} trab.</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Diagnósticos completados</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#0B1E3B] tabular-nums">
            {stats.completedDiagnostics}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Procesos identificados</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#0B1E3B] tabular-nums">
            {stats.totalProcessesIdentified}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Indicadores calculados</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#0B1E3B] tabular-nums">
            {stats.totalCalculatedKpis}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Cumplimiento general</p>
          <p
            className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
              stats.globalCompliance === null
                ? 'text-slate-400'
                : stats.globalCompliance >= 85
                ? 'text-[#15803D]'
                : stats.globalCompliance >= 70
                ? 'text-amber-600'
                : 'text-red-600'
            }`}
          >
            {stats.globalCompliance !== null ? `${stats.globalCompliance}%` : '—'}
          </p>
        </div>
      </div>

      {/* Empty state when zero companies */}
      {workspace.companies.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-[#0B1E3B]" />
          <h3 className="mt-4 font-display text-lg font-semibold text-[#0B1E3B]">
            Comience su primer diagnóstico empresarial
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            No hay empresas registradas todavía. Registre una empresa real para iniciar entrevistas por área y por trabajador, capturar datos de los últimos tres meses, calcular automáticamente sus indicadores KPI y generar informes PDF y Excel. Si prefiere explorar primero, puede cargar el ejemplo demostrativo claramente etiquetado.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('companies')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Registrar primera empresa</span>
            </button>
            <button
              type="button"
              onClick={onLoadDemo}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Database className="h-4 w-4" />
              <span>Cargar ejemplo de demostración</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Alerts for indicators below target */}
          {activeCompany && activeCompanyAnalysis && activeCompanyAnalysis.belowTarget.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-950">
                      Alertas de indicadores por debajo de la meta en {activeCompany.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-amber-900">
                      {activeCompanyAnalysis.belowTarget.length} indicadores requieren seguimiento (
                      {activeCompanyAnalysis.belowTarget
                        .slice(0, 3)
                        .map((k) => `${k.name}: ${k.formattedValue}`)
                        .join(' · ')}
                      {activeCompanyAnalysis.belowTarget.length > 3 ? '...' : ''})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('kpis')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Ver detalle KPI</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Charts Row */}
          {activeCompany && activeCompanyAnalysis && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
                      Rendimiento por Área Logística (%)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Empresa seleccionada: {activeCompany.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('charts')}
                    className="text-xs font-medium text-[#15803D] hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Abrir análisis gráfico
                  </button>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeCompanyAnalysis.areaChartData} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="area" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} />
                      <Tooltip
                        formatter={(value) => [`${value ?? 0}%`, 'Cumplimiento']}
                        labelFormatter={(_l, payload) => payload?.[0]?.payload?.fullArea ?? ''}
                      />
                      <Bar dataKey="cumplimiento" radius={[6, 6, 0, 0]}>
                        {activeCompanyAnalysis.areaChartData.map((entry, idx) => (
                          <Cell
                            key={idx}
                            fill={
                              entry.cumplimiento >= 90
                                ? '#16A34A'
                                : entry.cumplimiento >= 70
                                ? '#0B1E3B'
                                : '#D97706'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
                  Estado de los {activeCompanyAnalysis.kpis.length} Indicadores
                </h3>
                <p className="text-xs text-slate-500 mb-3">Distribución según meta establecida</p>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activeCompanyAnalysis.statusDistribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={76}
                        paddingAngle={3}
                      >
                        {activeCompanyAnalysis.statusDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {activeCompanyAnalysis.statusDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Companies Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
                  Últimas Empresas Evaluadas
                </h3>
                <p className="text-xs text-slate-500">
                  Seleccione una empresa para consultar su diagnóstico, entrevistas o generar informe.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('interviews')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#166534] whitespace-nowrap cursor-pointer"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                <span>Nueva Entrevista</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Empresa</th>
                    <th className="px-4 py-3">Sector · Ciudad</th>
                    <th className="px-4 py-3 text-right">Entrevistas</th>
                    <th className="px-4 py-3 text-right">KPIs Calc.</th>
                    <th className="px-4 py-3 text-right">Cumplimiento</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentCompanies.map((c) => {
                    const cInt = workspace.interviews.filter((i) => i.companyId === c.id);
                    const cMet = workspace.metrics.filter((m) => m.companyId === c.id);
                    const cKpis = calculateKPIs(cMet, workspace.customTargets[c.id]);
                    const comp = getOverallCompliance(cKpis);
                    const calcCount = cKpis.filter((k) => k.value !== null).length;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-900">{c.name}</div>
                          <div className="text-xs text-slate-500">
                            NIT {c.nit || '—'} · {c.representativeName}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {c.sector} · {c.city || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-800">
                          {cInt.length}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-800">
                          {calcCount}/{cKpis.length}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                          {comp !== null ? (
                            <span
                              className={
                                comp >= 85
                                  ? 'text-[#15803D]'
                                  : comp >= 70
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                              }
                            >
                              {comp}%
                            </span>
                          ) : (
                            <span className="text-slate-400">Sin datos</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCompany(c.id);
                              onNavigate('diagnostic');
                            }}
                            className="text-xs font-medium text-[#0B1E3B] hover:text-[#15803D] hover:underline whitespace-nowrap cursor-pointer"
                          >
                            Ver diagnóstico
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
