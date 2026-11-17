import { useEffect, useMemo, useState } from 'react';
import { AIRecommendationsView } from './components/AIRecommendationsView';
import { ChartsView } from './components/ChartsView';
import { CompaniesView } from './components/CompaniesView';
import { CustomTabView } from './components/CustomTabView';
import { DashboardView } from './components/DashboardView';
import { DiagnosticView } from './components/DiagnosticView';
import { ImprovementPlanView } from './components/ImprovementPlanView';
import { InterviewView } from './components/InterviewView';
import { KPIsView } from './components/KPIsView';
import { MetricsView } from './components/MetricsView';
import { PageEditorView } from './components/PageEditorView';
import { ReportsView } from './components/ReportsView';
import { NavSection, Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import {
  DEFAULT_PAGE_CONFIG,
  DEFAULT_SIDEBAR_TABS,
  INTERVIEW_SECTIONS,
} from './data/interviewSchema';
import { EMPTY_WORKSPACE, loadWorkspace, persistWorkspace } from './services/api';
import {
  AIAnalysisReport,
  Company,
  CustomTabContent,
  ImprovementAction,
  Interview,
  InterviewSection,
  MonthlyMetrics,
  PageConfig,
  SidebarTab,
  WorkspaceData,
} from './types/domain';
import { buildDemoDataset, DEMO_COMPANY_ID } from './utils/demoData';
import { calculateKPIs } from './utils/kpiEngine';

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(EMPTY_WORKSPACE);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    let active = true;
    loadWorkspace().then((data) => {
      if (!active) return;
      setWorkspace(data);
      if (data.companies.length > 0) {
        setSelectedCompanyId(data.companies[0].id);
      }
      const tabs = data.pageConfig?.sidebarTabs ?? DEFAULT_SIDEBAR_TABS;
      if (tabs.length > 0 && !tabs.some((t) => t.id === 'dashboard')) {
        setActiveSection(tabs[0].id);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const pageConfig = workspace.pageConfig ?? DEFAULT_PAGE_CONFIG;
  const interviewSections = workspace.interviewSections ?? INTERVIEW_SECTIONS;
  const sidebarTabs =
    pageConfig.sidebarTabs && pageConfig.sidebarTabs.length > 0
      ? pageConfig.sidebarTabs
      : DEFAULT_SIDEBAR_TABS;

  useEffect(() => {
    if (pageConfig.appTitle) {
      document.title = pageConfig.appTitle;
    }
  }, [pageConfig.appTitle]);

  const updateWorkspace = (updater: (prev: WorkspaceData) => WorkspaceData) => {
    setWorkspace((prev) => {
      const next = updater(prev);
      setSaveStatus('saving');
      persistWorkspace(next)
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('error'));
      return next;
    });
  };

  const activeCompany = useMemo(
    () => workspace.companies.find((c) => c.id === selectedCompanyId) ?? workspace.companies[0],
    [workspace.companies, selectedCompanyId]
  );

  const companyInterviews = useMemo(
    () => (activeCompany ? workspace.interviews.filter((i) => i.companyId === activeCompany.id) : []),
    [workspace.interviews, activeCompany]
  );

  const companyMetrics = useMemo(
    () => (activeCompany ? workspace.metrics.filter((m) => m.companyId === activeCompany.id) : []),
    [workspace.metrics, activeCompany]
  );

  const companyPlans = useMemo(
    () => (activeCompany ? workspace.improvementPlans.filter((p) => p.companyId === activeCompany.id) : []),
    [workspace.improvementPlans, activeCompany]
  );

  const companyAIReport = useMemo(
    () => (activeCompany ? workspace.aiReports.find((r) => r.companyId === activeCompany.id) : undefined),
    [workspace.aiReports, activeCompany]
  );

  const activeAlertCount = useMemo(() => {
    if (!activeCompany) return 0;
    const kpis = calculateKPIs(companyMetrics, workspace.customTargets[activeCompany.id]);
    return kpis.filter((k) => k.status === 'critico' || k.status === 'alerta').length;
  }, [activeCompany, companyMetrics, workspace.customTargets]);

  const handleSaveCompany = (company: Company) => {
    updateWorkspace((prev) => {
      const exists = prev.companies.some((c) => c.id === company.id);
      return {
        ...prev,
        companies: exists
          ? prev.companies.map((c) => (c.id === company.id ? company : c))
          : [company, ...prev.companies],
      };
    });
    setSelectedCompanyId(company.id);
  };

  const handleDeleteCompany = (id: string) => {
    updateWorkspace((prev) => {
      const remaining = prev.companies.filter((c) => c.id !== id);
      if (selectedCompanyId === id) {
        setSelectedCompanyId(remaining[0]?.id ?? '');
      }
      return {
        ...prev,
        companies: remaining,
        interviews: prev.interviews.filter((i) => i.companyId !== id),
        metrics: prev.metrics.filter((m) => m.companyId !== id),
        improvementPlans: prev.improvementPlans.filter((p) => p.companyId !== id),
        aiReports: prev.aiReports.filter((r) => r.companyId !== id),
      };
    });
  };

  const handleSaveInterview = (interview: Interview) => {
    updateWorkspace((prev) => {
      const exists = prev.interviews.some((i) => i.id === interview.id);
      return {
        ...prev,
        interviews: exists
          ? prev.interviews.map((i) => (i.id === interview.id ? interview : i))
          : [interview, ...prev.interviews],
      };
    });
  };

  const handleDeleteInterview = (id: string) => {
    updateWorkspace((prev) => ({
      ...prev,
      interviews: prev.interviews.filter((i) => i.id !== id),
    }));
  };

  const handleUpdateSections = (sections: InterviewSection[]) => {
    updateWorkspace((prev) => ({
      ...prev,
      interviewSections: sections,
    }));
  };

  const handleSavePageConfig = (config: PageConfig) => {
    updateWorkspace((prev) => ({
      ...prev,
      pageConfig: config,
    }));
  };

  const handleUpdateSidebarTabs = (tabs: SidebarTab[]) => {
    updateWorkspace((prev) => ({
      ...prev,
      pageConfig: {
        ...(prev.pageConfig ?? DEFAULT_PAGE_CONFIG),
        sidebarTabs: tabs,
      },
    }));
  };

  const handleRenameCustomTab = (tabId: string, newLabel: string) => {
    const nextTabs = sidebarTabs.map((t) => (t.id === tabId ? { ...t, label: newLabel } : t));
    handleUpdateSidebarTabs(nextTabs);
  };

  const handleDeleteCustomTab = (tabId: string) => {
    if (sidebarTabs.length <= 1) return;
    const nextTabs = sidebarTabs.filter((t) => t.id !== tabId);
    updateWorkspace((prev) => {
      const nextContents = { ...(prev.customTabContents ?? {}) };
      delete nextContents[tabId];
      return {
        ...prev,
        pageConfig: {
          ...(prev.pageConfig ?? DEFAULT_PAGE_CONFIG),
          sidebarTabs: nextTabs,
        },
        customTabContents: nextContents,
      };
    });
    if (activeSection === tabId && nextTabs.length > 0) {
      setActiveSection(nextTabs[0].id);
    }
  };

  const handleSaveCustomTabContent = (content: CustomTabContent) => {
    updateWorkspace((prev) => ({
      ...prev,
      customTabContents: {
        ...(prev.customTabContents ?? {}),
        [content.tabId]: content,
      },
    }));
  };

  const handleSaveMetrics = (record: MonthlyMetrics) => {
    updateWorkspace((prev) => {
      const exists = prev.metrics.some(
        (m) => m.id === record.id || (m.companyId === record.companyId && m.period === record.period)
      );
      return {
        ...prev,
        metrics: exists
          ? prev.metrics.map((m) =>
              m.id === record.id || (m.companyId === record.companyId && m.period === record.period)
                ? record
                : m
            )
          : [...prev.metrics, record],
      };
    });
  };

  const handleDeleteMetrics = (id: string) => {
    updateWorkspace((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((m) => m.id !== id),
    }));
  };

  const handleUpdateTarget = (companyId: string, kpiId: string, target: number) => {
    updateWorkspace((prev) => ({
      ...prev,
      customTargets: {
        ...prev.customTargets,
        [companyId]: {
          ...(prev.customTargets[companyId] ?? {}),
          [kpiId]: target,
        },
      },
    }));
  };

  const handleSaveAIReport = (report: AIAnalysisReport) => {
    updateWorkspace((prev) => ({
      ...prev,
      aiReports: [report, ...prev.aiReports.filter((r) => r.companyId !== report.companyId)],
    }));
  };

  const handleSavePlan = (action: ImprovementAction) => {
    updateWorkspace((prev) => {
      const exists = prev.improvementPlans.some((p) => p.id === action.id);
      return {
        ...prev,
        improvementPlans: exists
          ? prev.improvementPlans.map((p) => (p.id === action.id ? action : p))
          : [action, ...prev.improvementPlans],
      };
    });
  };

  const handleDeletePlan = (id: string) => {
    updateWorkspace((prev) => ({
      ...prev,
      improvementPlans: prev.improvementPlans.filter((p) => p.id !== id),
    }));
  };

  const handleLoadDemo = () => {
    const demo = buildDemoDataset();
    updateWorkspace((prev) => {
      const cleanCompanies = prev.companies.filter((c) => c.id !== DEMO_COMPANY_ID);
      const cleanInterviews = prev.interviews.filter((i) => i.companyId !== DEMO_COMPANY_ID);
      const cleanMetrics = prev.metrics.filter((m) => m.companyId !== DEMO_COMPANY_ID);
      const cleanPlans = prev.improvementPlans.filter((p) => p.companyId !== DEMO_COMPANY_ID);
      return {
        ...prev,
        companies: [demo.company, ...cleanCompanies],
        interviews: [demo.interview, ...cleanInterviews],
        metrics: [...demo.metrics, ...cleanMetrics],
        improvementPlans: [...demo.plans, ...cleanPlans],
      };
    });
    setSelectedCompanyId(DEMO_COMPANY_ID);
  };

  const handleClearDemo = () => {
    handleDeleteCompany(DEMO_COMPANY_ID);
  };

  const handleQuickNewInterview = () => {
    if (workspace.companies.length === 0) {
      setActiveSection('companies');
    } else {
      setActiveSection('interviews');
    }
  };

  const activeCustomTab = sidebarTabs.find((t) => t.id === activeSection && t.isCustom);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        alertCount={activeAlertCount}
        pageConfig={pageConfig}
        onUpdateTabs={handleUpdateSidebarTabs}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeSection={activeSection}
          companies={workspace.companies}
          selectedCompanyId={activeCompany?.id ?? ''}
          onSelectCompany={setSelectedCompanyId}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onQuickNewInterview={handleQuickNewInterview}
          onOpenPageEditor={() => setActiveSection('pageEditor')}
          saveStatus={saveStatus}
          pageConfig={pageConfig}
        />

        {activeCompany?.isDemo && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Modo Demostración:</strong> Está visualizando la empresa de ejemplo{' '}
              <em>{activeCompany.name}</em>. Sus datos reales de otras empresas se guardan de forma independiente.
            </span>
            <button
              type="button"
              onClick={handleClearDemo}
              className="font-semibold text-amber-900 underline hover:text-amber-700 cursor-pointer"
            >
              Quitar empresa demo
            </button>
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-[1440px] w-full mx-auto">
          {loading ? (
            <div className="space-y-4">
              <div className="h-8 w-72 rounded bg-slate-200 animate-pulse" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white animate-pulse" />
                ))}
              </div>
              <div className="h-64 rounded-xl border border-slate-200 bg-white animate-pulse" />
            </div>
          ) : (
            <>
              {activeSection === 'dashboard' && (
                <DashboardView
                  workspace={workspace}
                  selectedCompanyId={activeCompany?.id ?? ''}
                  onSelectCompany={setSelectedCompanyId}
                  onNavigate={setActiveSection}
                  onLoadDemo={handleLoadDemo}
                  onClearDemo={handleClearDemo}
                  pageConfig={pageConfig}
                />
              )}

              {activeSection === 'companies' && (
                <CompaniesView
                  workspace={workspace}
                  selectedCompanyId={activeCompany?.id ?? ''}
                  onSelectCompany={setSelectedCompanyId}
                  onSaveCompany={handleSaveCompany}
                  onDeleteCompany={handleDeleteCompany}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'interviews' && (
                <InterviewView
                  company={activeCompany}
                  interviews={companyInterviews}
                  sections={interviewSections}
                  onUpdateSections={handleUpdateSections}
                  onSaveInterview={handleSaveInterview}
                  onDeleteInterview={handleDeleteInterview}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'metrics' && (
                <MetricsView
                  company={activeCompany}
                  metrics={companyMetrics}
                  onSaveMetrics={handleSaveMetrics}
                  onDeleteMetrics={handleDeleteMetrics}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'kpis' && (
                <KPIsView
                  company={activeCompany}
                  metrics={companyMetrics}
                  customTargets={activeCompany ? workspace.customTargets[activeCompany.id] ?? {} : {}}
                  onUpdateTarget={handleUpdateTarget}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'charts' && (
                <ChartsView
                  companies={workspace.companies}
                  selectedCompanyId={activeCompany?.id ?? ''}
                  onSelectCompany={setSelectedCompanyId}
                  allMetrics={workspace.metrics}
                  customTargets={workspace.customTargets}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'diagnostic' && (
                <DiagnosticView
                  company={activeCompany}
                  interviews={companyInterviews}
                  metrics={companyMetrics}
                  customTargets={activeCompany ? workspace.customTargets[activeCompany.id] ?? {} : {}}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'ai' && (
                <AIRecommendationsView
                  company={activeCompany}
                  interviews={companyInterviews}
                  metrics={companyMetrics}
                  customTargets={activeCompany ? workspace.customTargets[activeCompany.id] ?? {} : {}}
                  aiReport={companyAIReport}
                  onSaveAIReport={handleSaveAIReport}
                  onAddImprovementAction={handleSavePlan}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'plan' && (
                <ImprovementPlanView
                  company={activeCompany}
                  plans={companyPlans}
                  onSavePlan={handleSavePlan}
                  onDeletePlan={handleDeletePlan}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'reports' && (
                <ReportsView
                  workspace={workspace}
                  selectedCompanyId={activeCompany?.id ?? ''}
                  onSelectCompany={setSelectedCompanyId}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'pageEditor' && (
                <PageEditorView
                  pageConfig={pageConfig}
                  onSavePageConfig={handleSavePageConfig}
                  onNavigate={setActiveSection}
                />
              )}

              {activeCustomTab && (
                <CustomTabView
                  tab={activeCustomTab}
                  content={(workspace.customTabContents ?? {})[activeCustomTab.id]}
                  onSaveContent={handleSaveCustomTabContent}
                  onRenameTab={handleRenameCustomTab}
                  onDeleteTab={handleDeleteCustomTab}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
