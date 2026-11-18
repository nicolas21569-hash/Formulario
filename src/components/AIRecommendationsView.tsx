import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { requestAIAnalysis } from '../services/api';
import {
  AIAnalysisReport,
  AIPrioritizedAction,
  Company,
  DiagnosticProblem,
  ImprovementAction,
  Interview,
  MonthlyMetrics,
  Worker,
  WorkerInterview,
} from '../types/domain';
import { generateDiagnosticSummary } from '../utils/diagnosticEngine';
import { formatPeriodLabel, generateId } from '../utils/formatters';
import { calculateKPIs } from '../utils/kpiEngine';
import { NavSection } from './Sidebar';

interface AIRecommendationsViewProps {
  company: Company | undefined;
  workers: Worker[];
  interviews: Interview[];
  workerInterviews: WorkerInterview[];
  metrics: MonthlyMetrics[];
  customTargets: Record<string, number>;
  customProblems: DiagnosticProblem[];
  aiReport: AIAnalysisReport | undefined;
  onSaveAIReport: (report: AIAnalysisReport) => void;
  onAddImprovementAction: (action: ImprovementAction) => void;
  onNavigate: (section: NavSection) => void;
}

export const AIRecommendationsView: React.FC<AIRecommendationsViewProps> = ({
  company,
  workers,
  interviews,
  workerInterviews,
  metrics,
  customTargets,
  customProblems,
  aiReport,
  onSaveAIReport,
  onAddImprovementAction,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedActionIndexes, setAddedActionIndexes] = useState<number[]>([]);

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

  if (!company || !diagnostic) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 font-display text-lg font-semibold text-[#0B1E3B]">
          Registre una empresa para generar recomendaciones con IA
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

  const latestInterview = [...interviews].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
  const periodLabel =
    metrics.length > 0
      ? metrics
          .map((m) => formatPeriodLabel(m.period))
          .sort()
          .join(', ')
      : 'Sin periodos numéricos registrados';

  const handleAnalyze = async () => {
    setLoading(true);
    setErrorMsg(null);
    setAddedActionIndexes([]);
    try {
      const report = await requestAIAnalysis({
        company,
        interview: latestInterview,
        workers,
        workerInterviews,
        kpis,
        diagnostic,
        periodLabel,
      });
      onSaveAIReport(report);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al ejecutar análisis con IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportAction = (act: AIPrioritizedAction, idx: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const future = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10);
    const now = new Date().toISOString();

    onAddImprovementAction({
      id: generateId('plan'),
      companyId: company.id,
      problemIdentified: act.problem,
      responsibleArea: act.area,
      improvementAction: act.action,
      objective: act.objective,
      relatedKpi: act.relatedKpi,
      target: act.suggestedTarget,
      responsiblePerson: company.representativeName || 'Por asignar',
      requiredResources: act.expectedImpact,
      startDate: today,
      endDate: future,
      status: 'Pendiente',
      createdAt: now,
      updatedAt: now,
    });
    setAddedActionIndexes((prev) => [...prev, idx]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
            Recomendaciones con Inteligencia Artificial
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Análisis contextualizado para <span className="font-semibold text-slate-900">{company.name}</span> basado exclusivamente en su entrevista e indicadores reales.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#166534] disabled:opacity-60 whitespace-nowrap cursor-pointer"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span>{loading ? 'Analizando empresa...' : aiReport ? 'Regenerar Análisis IA' : 'Generar Recomendaciones IA'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">No se pudo completar el análisis con IA</p>
            <p className="mt-1 text-xs">{errorMsg}</p>
          </div>
        </div>
      )}

      {!aiReport ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-3">
          <Sparkles className="mx-auto h-10 w-10 text-[#0B1E3B]" />
          <h3 className="font-display text-lg font-semibold text-[#0B1E3B]">
            Consultoría Logística Asistida por IA
          </h3>
          <p className="mx-auto max-w-2xl text-sm text-slate-600">
            Al ejecutar el análisis, el servidor enviará de forma segura la entrevista general ({interviews.length} registradas), las entrevistas individuales ({workerInterviews.length} de {workers.length} trabajadores), los resultados de los {kpis.length} indicadores ({kpis.filter((k) => k.value !== null).length} calculados) y el diagnóstico DOFA para generar estrategias logísticas, metas y acciones priorizadas.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive Summary & KPI Interpretation */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
              <h3 className="font-display text-base font-bold text-[#0B1E3B]">
                Resumen Ejecutivo y Conclusiones del Diagnóstico
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">{aiReport.executiveSummary}</p>
              <p className="pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                <strong className="text-[#0B1E3B]">Conclusión: </strong>
                {aiReport.conclusions}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
              <h3 className="font-display text-base font-bold text-[#0B1E3B]">
                Interpretación de Indicadores
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">{aiReport.kpiInterpretation}</p>
              <p className="text-xs text-slate-500 pt-2">
                Periodo evaluado: {aiReport.periodLabel} · Generado: {new Date(aiReport.generatedAt).toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          {/* 4 Analytical Lists */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
              <h4 className="font-display text-sm font-bold text-red-700">
                Resultados Negativos o Brechas Detectadas
              </h4>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700">
                {aiReport.negativeResults.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
              <h4 className="font-display text-sm font-bold text-amber-800">
                Procesos que Necesitan Atención Prioritaria
              </h4>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700">
                {aiReport.criticalProcesses.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
              <h4 className="font-display text-sm font-bold text-[#0B1E3B]">
                Estrategias Logísticas y Soluciones Recomendadas
              </h4>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700">
                {aiReport.logisticsStrategies.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
              <h4 className="font-display text-sm font-bold text-[#15803D]">
                Metas de Mejoramiento Sugeridas
              </h4>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700">
                {aiReport.suggestedTargets.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Prioritized Actions Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#0B1E3B]">
                  Acciones Priorizadas por Impacto
                </h3>
                <p className="text-xs text-slate-500">
                  Puede enviar cualquier acción recomendada directamente al Plan de Mejoramiento editable.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Prioridad</th>
                    <th className="px-4 py-3">Área</th>
                    <th className="px-4 py-3">Problema y Acción Recomendada</th>
                    <th className="px-4 py-3">KPI · Meta</th>
                    <th className="px-4 py-3">Impacto Esperado</th>
                    <th className="px-4 py-3 text-right">Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {aiReport.prioritizedActions.map((act, idx) => {
                    const isAdded = addedActionIndexes.includes(idx);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold">
                          <span
                            className={
                              act.priority === 'Alta'
                                ? 'text-red-600'
                                : act.priority === 'Media'
                                ? 'text-amber-700'
                                : 'text-[#15803D]'
                            }
                          >
                            {act.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{act.area}</td>
                        <td className="px-4 py-3 text-slate-700 max-w-md">
                          <div className="font-semibold text-slate-900">{act.action}</div>
                          <div className="text-slate-500 mt-0.5">Problema: {act.problem}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <div>{act.relatedKpi}</div>
                          <div className="font-mono font-semibold text-[#15803D]">{act.suggestedTarget}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs">{act.expectedImpact}</td>
                        <td className="px-4 py-3 text-right">
                          {isAdded ? (
                            <span className="inline-flex items-center gap-1 text-[#15803D] font-semibold">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Agregada</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleImportAction(act, idx)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#15803D] px-2.5 py-1 text-xs font-medium text-[#15803D] hover:bg-emerald-50 whitespace-nowrap cursor-pointer"
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              <span>Al Plan</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
