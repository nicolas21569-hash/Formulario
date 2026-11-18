import { DEFAULT_PAGE_CONFIG, DEFAULT_SIDEBAR_TABS, INTERVIEW_SECTIONS } from '../data/interviewSchema';
import {
  AIAnalysisReport,
  Company,
  DiagnosticSummary,
  Interview,
  KPIResult,
  Worker,
  WorkerInterview,
  WorkspaceData,
} from '../types/domain';
import { generateId } from '../utils/formatters';

const LOCAL_STORAGE_KEY = 'diagnostico_empresarial_workspace_v1';

export const EMPTY_WORKSPACE: WorkspaceData = {
  schemaVersion: 2,
  companies: [],
  workers: [],
  interviews: [],
  workerInterviews: [],
  metrics: [],
  diagnosticProblems: [],
  improvementPlans: [],
  aiReports: [],
  customTargets: {},
  interviewSections: INTERVIEW_SECTIONS,
  pageConfig: DEFAULT_PAGE_CONFIG,
  customTabContents: {},
};

function normalizeWorkspace(data: WorkspaceData): WorkspaceData {
  // Smooth migration to v2: add "workers" tab if missing and upgrade old default Section F title
  const rawTabs = Array.isArray(data.pageConfig?.sidebarTabs)
    ? data.pageConfig.sidebarTabs
    : DEFAULT_SIDEBAR_TABS;

  let migratedTabs = [...rawTabs];
  if ((data.schemaVersion ?? 1) < 2 && !migratedTabs.some((t) => t.id === 'workers')) {
    const idx = migratedTabs.findIndex((t) => t.id === 'interviews');
    const workersTab = DEFAULT_SIDEBAR_TABS.find((t) => t.id === 'workers')!;
    if (idx >= 0) {
      migratedTabs = [
        ...migratedTabs.slice(0, idx + 1),
        workersTab,
        ...migratedTabs.slice(idx + 1),
      ];
    } else {
      migratedTabs.push(workersTab);
    }
  }

  let sections =
    Array.isArray(data.interviewSections) && data.interviewSections.length > 0
      ? data.interviewSections
      : INTERVIEW_SECTIONS;

  if ((data.schemaVersion ?? 1) < 2) {
    const hasOldSectionF = sections.some((s) => s.code === 'F' && s.title.includes('Producción u Operación'));
    if (hasOldSectionF) {
      sections = INTERVIEW_SECTIONS;
    }
  }

  const mergedPageConfig = {
    ...DEFAULT_PAGE_CONFIG,
    ...(data.pageConfig ?? {}),
    sidebarTabs: migratedTabs,
  };

  return {
    ...EMPTY_WORKSPACE,
    ...data,
    schemaVersion: 2,
    workers: Array.isArray(data.workers) ? data.workers : [],
    workerInterviews: Array.isArray(data.workerInterviews) ? data.workerInterviews : [],
    diagnosticProblems: Array.isArray(data.diagnosticProblems) ? data.diagnosticProblems : [],
    interviewSections: sections,
    pageConfig: mergedPageConfig,
    customTabContents:
      data.customTabContents && typeof data.customTabContents === 'object'
        ? data.customTabContents
        : {},
  };
}

export async function loadWorkspace(): Promise<WorkspaceData> {
  try {
    const res = await fetch('/api/workspace');
    if (res.ok) {
      const serverData = normalizeWorkspace((await res.json()) as WorkspaceData);
      const isServerEmpty =
        serverData.companies.length === 0 &&
        serverData.interviews.length === 0 &&
        serverData.metrics.length === 0 &&
        !localStorage.getItem(LOCAL_STORAGE_KEY);

      if (!isServerEmpty && serverData.companies.length === 0) {
        const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localRaw) {
          const localData = normalizeWorkspace(JSON.parse(localRaw) as WorkspaceData);
          if (localData.companies && localData.companies.length > 0) {
            await persistWorkspace(localData);
            return localData;
          }
        }
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverData));
      return serverData;
    }
  } catch {
    // Fallback to localStorage if backend temporarily unavailable
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return normalizeWorkspace(JSON.parse(raw) as WorkspaceData);
    }
  } catch {
    // Ignore parse error
  }
  return { ...EMPTY_WORKSPACE };
}

export async function persistWorkspace(data: WorkspaceData): Promise<void> {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  const res = await fetch('/api/workspace', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || 'No se pudo guardar en el servidor.');
  }
}

export async function requestAIAnalysis(params: {
  company: Company;
  interview: Interview | null;
  workers: Worker[];
  workerInterviews: WorkerInterview[];
  kpis: KPIResult[];
  diagnostic: DiagnosticSummary;
  periodLabel: string;
}): Promise<AIAnalysisReport> {
  const res = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const body = (await res.json()) as AIAnalysisReport & { error?: string };
  if (!res.ok) {
    throw new Error(body.error || 'Error al generar recomendaciones con IA.');
  }
  return {
    ...body,
    id: generateId('ai'),
    companyId: params.company.id,
  };
}
