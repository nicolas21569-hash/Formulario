import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Info,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { Company, Interview, MonthlyMetrics } from '../types/domain';
import { generateDiagnosticSummary } from '../utils/diagnosticEngine';
import { calculateKPIs } from '../utils/kpiEngine';
import { NavSection } from './Sidebar';

interface DiagnosticViewProps {
  company: Company | undefined;
  interviews: Interview[];
  metrics: MonthlyMetrics[];
  customTargets: Record<string, number>;
  onNavigate: (section: NavSection) => void;
}

export const DiagnosticView: React.FC<DiagnosticViewProps> = ({
  company,
  interviews,
  metrics,
  customTargets,
  onNavigate,
}) => {
  const kpis = useMemo(
    () => calculateKPIs(metrics, customTargets),
    [metrics, customTargets]
  );

  const diagnostic = useMemo(
    () => (company ? generateDiagnosticSummary(company.id, interviews, kpis) : null),
    [company, interviews, kpis]
  );

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

  const getProcessStatusMeta = (status: string) => {
    if (status === 'Óptimo') {
      return { color: 'text-[#15803D]', Icon: CheckCircle2 };
    }
    if (status === 'En atención') {
      return { color: 'text-amber-700', Icon: AlertTriangle };
    }
    if (status === 'Crítico') {
      return { color: 'text-red-600', Icon: XCircle };
    }
    return { color: 'text-slate-500', Icon: Info };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
            Diagnóstico Empresarial y Matriz DOFA
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Empresa: <span className="font-semibold text-slate-900">{company.name}</span> · Análisis fundamentado estrictamente en respuestas de entrevista y KPIs calculados.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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
            Exportar Informe PDF
          </button>
        </div>
      </div>

      {/* Mapa de Procesos Logísticos */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
              Mapa de Procesos Logísticos Identificados
            </h3>
            <p className="text-xs text-slate-500">
              Evaluación por eslabón de la cadena de valor según evidencia registrada
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

      {/* 4 Diagnostic Categories */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h3 className="font-display text-base font-semibold text-red-700 flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>Procesos Críticos y Problemas Logísticos</span>
          </h3>
          {diagnostic.criticalProcesses.length === 0 && diagnostic.logisticsProblems.length === 0 ? (
            <p className="text-xs text-slate-500">
              No se han identificado procesos críticos con los datos actuales. Complete las entrevistas y métricas para ampliar el análisis.
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
            Cada punto cita su fuente directa (sección de entrevista o indicador KPI calculado).
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
