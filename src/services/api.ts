import { DEFAULT_PAGE_CONFIG, INTERVIEW_SECTIONS } from '../data/interviewSchema';
import {
  AIAnalysisReport,
  Company,
  DiagnosticSummary,
  Interview,
  KPIResult,
  WorkspaceData,
} from '../types/domain';
import { generateId } from '../utils/formatters';

const LOCAL_STORAGE_KEY = 'diagnostico_empresarial_workspace_v1';

export const EMPTY_WORKSPACE: WorkspaceData = {
  companies: [],
  interviews: [],
  metrics: [],
  improvementPlans: [],
  aiReports: [],
  customTargets: {},
  interviewSections: INTERVIEW_SECTIONS,
  pageConfig: DEFAULT_PAGE_CONFIG,
};

function normalizeWorkspace(data: WorkspaceData): WorkspaceData {
  return {
    ...EMPTY_WORKSPACE,
    ...data,
    interviewSections:
      Array.isArray(data.interviewSections) && data.interviewSections.length > 0
        ? data.interviewSections
        : INTERVIEW_SECTIONS,
    pageConfig: {
      ...DEFAULT_PAGE_CONFIG,
      ...(data.pageConfig ?? {}),
    },
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
