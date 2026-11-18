import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Edit3,
  Gauge,
  Info,
  Plus,
  ShieldAlert,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import {
  Company,
  DiagnosticProblem,
  Interview,
  MonthlyMetrics,
  ProblemFrequency,
  ProblemSeverity,
  Worker,
  WorkerInterview,
} from '../types/domain';
import { generateDiagnosticSummary } from '../utils/diagnosticEngine';
import { generateId } from '../utils/formatters';
import { calculateKPIs } from '../utils/kpiEngine';
import { NavSection } from './Sidebar';

interface DiagnosticViewProps {
  company: Company | undefined;
  workers: Worker[];
  interviews: Interview[];
  workerInterviews: WorkerInterview[];
  metrics: MonthlyMetrics[];
  customTargets: Record<string, number>;
  customProblems: DiagnosticProblem[];
  onSaveProblem: (problem: DiagnosticProblem) => void;
  onDeleteProblem: (id: string) => void;
  onNavigate: (section: NavSection) => void;
}

const SEVERITIES: ProblemSeverity[] = ['Crítico', 'Alto', 'Medio', 'Bajo'];
const FREQUENCIES: ProblemFrequency[] = ['Diaria', 'Semanal', 'Mensual', 'Ocasional'];
const AREA_OPTIONS = [
  'Compras y Abastecimiento',
  'Recepción y Bodega',
  'Almacenamiento e Inventarios',
  'Preparación de Pedidos y Operaciones',
  'Transporte y Distribución',
  'Ventas y Servicio al Cliente',
  'Administración y Personal',
];

const EMPTY_PROBLEM = {
  affectedArea: 'Almacenamiento e Inventarios',
  affectedProcess: '',
  description: '',
  frequency: 'Semanal' as ProblemFrequency,
  severity: 'Alto' as ProblemSeverity,
  consequences: '',
  possibleCauses: '',
  evidence: '',
  recommendations: '',
};

export const DiagnosticView: React.FC<DiagnosticViewProps> = ({
  company,
  workers,
  interviews,
  workerInterviews,
  metrics,
  customTargets,
  customProblems,
  onSaveProblem,
  onDeleteProblem,
  onNavigate,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PROBLEM);
  const [severityFilter, setSeverityFilter] = useState<'Todas' | ProblemSeverity>('Todas');
  const [areaFilter, setAreaFilter] = useState<string>('Todas');

  const kpis = useMemo(
    () => calculateKPIs(metrics, customTargets),
    [metrics, customTargets]
  );

  const diagnostic = useMemo(
    () =>
      company
        ? generateDiagnosticSummary(
            company.id,
            interviews,
            kpis,
            workerInterviews,
            workers,
            customProblems
          )
        : null,
    [company, interviews, kpis, workerInterviews, workers, customProblems]
  );

  const filteredProblems = useMemo(() => {
    if (!diagnostic) return [];
    return diagnostic.detailedProblems.filter((p) => {
      if (severityFilter !== 'Todas' && p.severity !== severityFilter) return false;
      if (areaFilter !== 'Todas' && p.affectedArea !== areaFilter) return false;
      return true;
    });
  }, [diagnostic, severityFilter, areaFilter]);

  if (!company || !diagnostic) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <Gauge className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 font-display text-lg font-semibold text-[#0B1E3B]">
          Seleccione o registre una empresa para ver su diagnóstico
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

  const openCreateProblem = () => {
    setEditingId(null);
    setForm(EMPTY_PROBLEM);
    setShowForm(true);
  };

  const openEditProblem = (p: DiagnosticProblem) => {
    setEditingId(p.id);
    setForm({
      affectedArea: p.affectedArea,
      affectedProcess: p.affectedProcess,
      description: p.description,
      frequency: p.frequency,
      severity: p.severity,
      consequences: p.consequences,
      possibleCauses: p.possibleCauses,
      evidence: p.evidence,
      recommendations: p.recommendations,
    });
    setShowForm(true);
  };

  const handleSubmitProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.affectedProcess.trim()) return;
    const existing = editingId ? customProblems.find((x) => x.id === editingId) : undefined;
    onSaveProblem({
      id: existing ? existing.id : generateId('prob'),
      companyId: company.id,
      affectedArea: form.affectedArea,
      affectedProcess: form.affectedProcess.trim(),
      description: form.description.trim(),
      frequency: form.frequency,
      severity: form.severity,
      consequences: form.consequences.trim(),
      possibleCauses: form.possibleCauses.trim(),
      evidence: form.evidence.trim(),
      recommendations: form.recommendations.trim(),
      isAutoDetected: false,
      isDemo: existing?.isDemo,
      updatedAt: new Date().toISOString(),
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getProcessStatusMeta = (status: string) => {
    if (status === 'Óptimo') return { color: 'text-[#15803D]', Icon: CheckCircle2 };
    if (status === 'En atención') return { color: 'text-amber-700', Icon: AlertTriangle };
    if (status === 'Crítico') return { color: 'text-red-600', Icon: XCircle };
    return { color: 'text-slate-500', Icon: Info };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
            Diagnóstico Empresarial, Problemas y Matriz DOFA
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Empresa: <span className="font-semibold text-slate-900">{company.name}</span> · Análisis integrado de entrevistas generales, trabajadores, trazabilidad FEFO y KPIs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openCreateProblem}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B1E3B] bg-white px-3.5 py-2 text-sm font-medium text-[#0B1E3B] hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Problema</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ai')}
            className="rounded-lg bg-[#0B1E3B] px-4 py-2 text-sm font-medium text-white hover:bg-[#132d56] cursor-pointer"
          >
            Analizar con IA
          </button>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
          >
            Exportar Informe
          </button>
        </div>
      </div>

      {/* Add / Edit Manual Problem Form */}
      {showForm && (
        <form onSubmit={handleSubmitProblem} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display text-base font-bold text-[#0B1E3B]">
              {editingId ? 'Editar Problema Identificado' : 'Registrar Hallazgo / Problema Detallado'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Área afectada *</label>
              <select
                value={form.affectedArea}
                onChange={(e) => setForm({ ...form, affectedArea: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              >
                {AREA_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Proceso afectado *</label>
              <input
                type="text"
                required
                value={form.affectedProcess}
                onChange={(e) => setForm({ ...form, affectedProcess: e.target.value })}
                placeholder="Ej. Control FEFO y Lotes"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Frecuencia</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value as ProblemFrequency })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nivel de gravedad</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as ProblemSeverity })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción del problema *
              </label>
              <textarea
                rows={2}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describa con precisión el problema observado..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Consecuencias</label>
              <textarea
                rows={2}
                value={form.consequences}
                onChange={(e) => setForm({ ...form, consequences: e.target.value })}
                placeholder="Impacto en costos, vencimientos, devoluciones o tiempos..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Causas posibles</label>
              <textarea
                rows={2}
                value={form.possibleCauses}
                onChange={(e) => setForm({ ...form, possibleCauses: e.target.value })}
                placeholder="Origen administrativo, operativo o tecnológico..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Evidencias</label>
              <input
                type="text"
                value={form.evidence}
                onChange={(e) => setForm({ ...form, evidence: e.target.value })}
                placeholder="Ej. Entrevista bodega, conteo físico oct., fotos..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recomendaciones</label>
              <input
                type="text"
                value={form.recommendations}
                onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
                placeholder="Acción técnica sugerida..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Guardar Problema</span>
            </button>
          </div>
        </form>
      )}

      {/* Mapa de Procesos Logísticos */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
              Mapa de Procesos Logísticos Identificados
            </h3>
            <p className="text-xs text-slate-500">
              Evaluación por eslabón de la cadena de suministro según evidencia registrada
            </p>
          </div>
          <span className="font-mono text-sm font-bold text-[#15803D] tabular-nums">
            Cumplimiento global: {diagnostic.overallCompliance !== null ? `${diagnostic.overallCompliance}%` : 'Sin datos'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {diagnostic.processes.map((proc) => {
            const { color, Icon } = getProcessStatusMeta(proc.status);
            return (
              <div
                key={proc.processName}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-slate-500">Sección {proc.sectionCode}</span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span>{proc.status}</span>
                    </span>
                  </div>
                  <h4 className="mt-1 font-display text-sm font-bold text-[#0B1E3B]">
                    {proc.processName}
                  </h4>
                  <ul className="mt-2 space-y-1 text-xs text-slate-700 list-disc pl-4">
                    {proc.findings.map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>

                {proc.evidence.length > 0 && (
                  <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500 space-y-0.5">
                    {proc.evidence.slice(0, 3).map((ev, idx) => (
                      <p key={idx} className="truncate" title={ev}>
                        {ev}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Matriz Detallada de Problemas (9 campos obligatorios) */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-[#0B1E3B]">
              Matriz Detallada de Problemas Identificados ({filteredProblems.length})
            </h3>
            <p className="text-xs text-slate-500">
              Combina hallazgos detectados automáticamente en entrevistas/KPIs con problemas registrados manualmente.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
            >
              <option value="Todas">Todas las áreas</option>
              {Array.from(new Set(diagnostic.detailedProblems.map((p) => p.affectedArea))).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as 'Todas' | ProblemSeverity)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
            >
              <option value="Todas">Todas las gravedades</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredProblems.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No se encontraron problemas bajo los filtros seleccionados.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredProblems.map((prob) => (
              <div key={prob.id} className="p-5 space-y-3 hover:bg-slate-50/50">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-[#0B1E3B]">{prob.affectedArea}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-medium text-slate-700">{prob.affectedProcess}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">Frecuencia: {prob.frequency}</span>
                      <span className="text-slate-400">·</span>
                      <span
                        className={`font-bold ${
                          prob.severity === 'Crítico'
                            ? 'text-red-600'
                            : prob.severity === 'Alto'
                            ? 'text-amber-700'
                            : 'text-slate-700'
                        }`}
                      >
                        Gravedad {prob.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{prob.description}</p>
                  </div>

                  {!prob.isAutoDetected && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditProblem(prob)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        title="Editar problema"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProblem(prob.id)}
                        className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        title="Eliminar problema"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block">Consecuencias</span>
                    <span className="text-slate-600">{prob.consequences || '—'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Causas posibles</span>
                    <span className="text-slate-600">{prob.possibleCauses || '—'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Evidencias</span>
                    <span className="text-slate-600">{prob.evidence || '—'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#15803D] block">Recomendaciones</span>
                    <span className="text-slate-700">{prob.recommendations || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diagnostic Categories */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h3 className="font-display text-base font-semibold text-red-700 flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>Resumen de Procesos Críticos y Hallazgos</span>
          </h3>
          {diagnostic.criticalProcesses.length === 0 && diagnostic.logisticsProblems.length === 0 ? (
            <p className="text-xs text-slate-500">
              No se han identificado procesos críticos con los datos actuales.
            </p>
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
              {[...diagnostic.criticalProcesses, ...diagnostic.logisticsProblems].map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h3 className="font-display text-base font-semibold text-amber-700 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>Riesgos Operativos Detectados</span>
          </h3>
          {diagnostic.operationalRisks.length === 0 ? (
            <p className="text-xs text-slate-500">
              Sin riesgos operativos críticos registrados en la evidencia disponible.
            </p>
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
              {diagnostic.operationalRisks.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Matriz DOFA Automática */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-display text-lg font-bold text-[#0B1E3B]">
            Matriz DOFA Automática
          </h3>
          <p className="text-xs text-slate-500">
            Cada punto cita su fuente directa (entrevista general, entrevistas individuales o KPIs).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
            <h4 className="font-display text-sm font-bold text-[#15803D]">
              Fortalezas (Factores Internos Positivos)
            </h4>
            {diagnostic.swot.fortalezas.length === 0 ? (
              <p className="text-xs text-slate-500">Sin fortalezas registradas aún.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-slate-800 list-disc pl-4">
                {diagnostic.swot.fortalezas.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50/40 p-4 space-y-2">
            <h4 className="font-display text-sm font-bold text-red-700">
              Debilidades (Factores Internos a Corregir)
            </h4>
            {diagnostic.swot.debilidades.length === 0 ? (
              <p className="text-xs text-slate-500">Sin debilidades registradas aún.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-slate-800 list-disc pl-4">
                {diagnostic.swot.debilidades.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-4 space-y-2">
            <h4 className="font-display text-sm font-bold text-[#0B1E3B]">
              Oportunidades de Mejora
            </h4>
            {diagnostic.swot.oportunidades.length === 0 ? (
              <p className="text-xs text-slate-500">Sin oportunidades registradas aún.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-slate-800 list-disc pl-4">
                {diagnostic.swot.oportunidades.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4 space-y-2">
            <h4 className="font-display text-sm font-bold text-amber-800">
              Amenazas y Vulnerabilidades
            </h4>
            {diagnostic.swot.amenazas.length === 0 ? (
              <p className="text-xs text-slate-500">Sin amenazas detectadas aún.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-slate-800 list-disc pl-4">
                {diagnostic.swot.amenazas.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
