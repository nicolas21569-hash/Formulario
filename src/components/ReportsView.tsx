import React, { useMemo } from 'react';
import { CheckCircle2, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Company, WorkspaceData } from '../types/domain';
import { exportCompanyExcel, exportConsolidatedExcel } from '../utils/excelExporter';
import { calculateKPIs, getOverallCompliance } from '../utils/kpiEngine';
import { exportCompanyReportPDF, exportConsolidatedReportPDF } from '../utils/pdfExporter';
import { NavSection } from './Sidebar';

interface ReportsViewProps {
  workspace: WorkspaceData;
  selectedCompanyId: string;
  onSelectCompany: (id: string) => void;
  onNavigate: (section: NavSection) => void;
}

const REPORT_SECTIONS = [
  '1. Portada con el nombre de la empresa',
  '2. Introducción ejecutiva',
  '3. Objetivos del diagnóstico',
  '4. Información general, rep. legal y organigrama',
  '5. Entrevistas individuales por trabajador',
  '6. Resultados de entrevista logística (Secciones A–J)',
  '7. Mapa de procesos logísticos (FEFO, lotes, pedidos)',
  '8. Diagnóstico detallado de problemas (9 campos)',
  '9. Indicadores de gestión con fórmulas y resultados',
  '10. Gráficas estadísticas de cumplimiento por área',
  '11. Análisis de resultados',
  '12. Matriz DOFA automática',
  '13. Recomendaciones estratégicas e IA',
  '14. Plan de mejoramiento',
  '15. Conclusiones finales',
];

export const ReportsView: React.FC<ReportsViewProps> = ({
  workspace,
  selectedCompanyId,
  onSelectCompany,
  onNavigate,
}) => {
  const company: Company | undefined =
    workspace.companies.find((c) => c.id === selectedCompanyId) ?? workspace.companies[0];

  const companySummary = useMemo(() => {
    if (!company) return null;
    const workers = (workspace.workers ?? []).filter((w) => w.companyId === company.id);
    const interviews = workspace.interviews.filter((i) => i.companyId === company.id);
    const workerInterviews = (workspace.workerInterviews ?? []).filter((wi) => wi.companyId === company.id);
    const metrics = workspace.metrics.filter((m) => m.companyId === company.id);
    const plans = workspace.improvementPlans.filter((p) => p.companyId === company.id);
    const customProblems = (workspace.diagnosticProblems ?? []).filter((p) => p.companyId === company.id);
    const aiReport = workspace.aiReports.find((r) => r.companyId === company.id);
    const customTargets = workspace.customTargets[company.id];
    const kpis = calculateKPIs(metrics, customTargets);
    const overall = getOverallCompliance(kpis);
    return {
      workers,
      interviews,
      workerInterviews,
      metrics,
      plans,
      customProblems,
      aiReport,
      customTargets,
      kpis,
      overall,
    };
  }, [company, workspace]);

  if (!company || !companySummary) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 font-display text-lg font-semibold text-[#0B1E3B]">
          Registre al menos una empresa para generar informes PDF y Excel
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

  const handleDownloadIndividualPDF = () => {
    exportCompanyReportPDF({
      company,
      workers: companySummary.workers,
      interviews: companySummary.interviews,
      workerInterviews: companySummary.workerInterviews,
      metrics: companySummary.metrics,
      plans: companySummary.plans,
      customProblems: companySummary.customProblems,
      aiReport: companySummary.aiReport,
      customTargets: companySummary.customTargets,
      customSections: workspace.interviewSections,
      pageConfig: workspace.pageConfig,
    });
  };

  const handleDownloadIndividualExcel = () => {
    exportCompanyExcel({
      company,
      workers: companySummary.workers,
      interviews: companySummary.interviews,
      workerInterviews: companySummary.workerInterviews,
      metrics: companySummary.metrics,
      plans: companySummary.plans,
      customProblems: companySummary.customProblems,
      customTargets: companySummary.customTargets,
      customSections: workspace.interviewSections,
    });
  };

  const handleDownloadConsolidatedPDF = () => {
    exportConsolidatedReportPDF({
      companies: workspace.companies,
      workers: workspace.workers ?? [],
      interviews: workspace.interviews,
      workerInterviews: workspace.workerInterviews ?? [],
      metrics: workspace.metrics,
      plans: workspace.improvementPlans,
      customTargets: workspace.customTargets,
    });
  };

  const handleDownloadConsolidatedExcel = () => {
    exportConsolidatedExcel({
      companies: workspace.companies,
      workers: workspace.workers ?? [],
      interviews: workspace.interviews,
      workerInterviews: workspace.workerInterviews ?? [],
      metrics: workspace.metrics,
      plans: workspace.improvementPlans,
      customTargets: workspace.customTargets,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
            Informes Profesionales (PDF y Excel)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Exporte informes individuales de 15 capítulos por empresa o consolidados multi-empresa en formato PDF y hoja de cálculo Excel (.xlsx).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadConsolidatedExcel}
            className="inline-flex items-center gap-2 rounded-lg border border-[#15803D] bg-white px-3.5 py-2 text-sm font-medium text-[#15803D] hover:bg-emerald-50 whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Consolidado Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadConsolidatedPDF}
            className="inline-flex items-center gap-2 rounded-lg border border-[#0B1E3B] bg-white px-3.5 py-2 text-sm font-medium text-[#0B1E3B] hover:bg-slate-50 whitespace-nowrap cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Consolidado PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Company selector and export card */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Seleccionar empresa para informe individual
            </label>
            <select
              value={company.id}
              onChange={(e) => onSelectCompany(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-[#0B1E3B] focus:outline-none"
            >
              {workspace.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Sector:</span>
              <span className="font-semibold text-slate-900">{company.sector}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Trabajadores / Entrevistas ind.:</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {companySummary.workers.length} / {companySummary.workerInterviews.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Entrevistas generales:</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {companySummary.interviews.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Meses cuantitativos:</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {companySummary.metrics.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Indicadores calculados:</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {companySummary.kpis.filter((k) => k.value !== null).length} / {companySummary.kpis.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Análisis IA incluido:</span>
              <span className="font-semibold text-slate-900">
                {companySummary.aiReport ? 'Sí' : 'Pendiente (usará diagnóstico base)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Acciones en Plan de Mejora:</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {companySummary.plans.length}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleDownloadIndividualPDF}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#15803D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#166534] transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Descargar Informe Completo PDF ({company.name})</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadIndividualExcel}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B1E3B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#132d56] transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Exportar Libro Completo Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Right: 15-section structure preview */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-display text-base font-bold text-[#0B1E3B]">
              Estructura del Informe Corporativo PDF (15 Capítulos) y Hojas Excel
            </h3>
            <p className="text-xs text-slate-500">
              El archivo PDF incluye gráfica vectorial y tablas; el archivo Excel exporta 7 hojas independientes listas para análisis.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {REPORT_SECTIONS.map((sec) => (
              <div
                key={sec}
                className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs text-slate-800"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D] shrink-0 mt-0.5" />
                <span>{sec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
