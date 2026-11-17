export type BusinessSector =
  | 'Comercial'
  | 'Industrial'
  | 'Restaurante'
  | 'Transporte'
  | 'Almacenamiento'
  | 'Servicios'
  | 'Distribución'
  | 'Otro';

export interface Company {
  id: string;
  name: string;
  nit: string;
  economicActivity: string;
  sector: BusinessSector;
  address: string;
  city: string;
  representativeName: string;
  intervieweeRole: string;
  employeesCount: number;
  yearsOperating: string;
  phone: string;
  email: string;
  registrationDate: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AnswerValue = string | string[] | number | boolean | undefined;

export interface InterviewAnswers {
  [questionId: string]: AnswerValue;
}

export interface Interview {
  id: string;
  companyId: string;
  title: string;
  interviewerName: string;
  interviewDate: string;
  hasProductionProcess: boolean;
  completedSections: string[];
  answers: InterviewAnswers;
  status: 'borrador' | 'completada';
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyMetrics {
  id: string;
  companyId: string;
  period: string; // YYYY-MM
  totalOrdersReceived: number | null;
  totalOrdersDelivered: number | null;
  ordersDeliveredOnTime: number | null;
  ordersWithErrors: number | null;
  purchasesMade: number | null;
  supplierOrdersOnTime: number | null;
  totalSupplyDays: number | null;
  totalPurchaseValue: number | null;
  totalSalesValue: number | null;
  storageCosts: number | null;
  transportCosts: number | null;
  totalDeliveryHours: number | null;
  unitsProduced: number | null;
  defectiveUnits: number | null;
  returnsCount: number | null;
  claimsCount: number | null;
  customersServed: number | null;
  satisfiedCustomers: number | null;
  wasteAndLossValue: number | null;
  initialInventory: number | null;
  finalInventory: number | null;
  inventoryReferencesChecked: number | null;
  inventoryReferencesAccurate: number | null;
  costOfSales: number | null;
  hoursWorked: number | null;
  workersCount: number | null;
  isDemo?: boolean;
  updatedAt: string;
}

export type KPIArea =
  | 'Compras y Abastecimiento'
  | 'Almacenamiento e Inventarios'
  | 'Producción'
  | 'Transporte y Distribución'
  | 'Servicio al Cliente'
  | 'Financieros';

export type KPIStatus = 'cumple' | 'alerta' | 'critico' | 'insuficiente';

export interface KPIResult {
  id: string;
  name: string;
  area: KPIArea;
  objective: string;
  formula: string;
  dataUsed: string;
  value: number | null;
  formattedValue: string;
  unit: string;
  target: number;
  formattedTarget: string;
  higherIsBetter: boolean;
  complianceLevel: number | null; // percentage 0..100+
  status: KPIStatus;
  interpretation: string;
  recommendation: string;
}

export interface ProcessDiagnostic {
  processName: string;
  sectionCode: string;
  status: 'Óptimo' | 'En atención' | 'Crítico' | 'No aplica' | 'Sin evaluar';
  findings: string[];
  evidence: string[];
}

export interface DiagnosticSummary {
  companyId: string;
  generatedAt: string;
  overallCompliance: number | null;
  processes: ProcessDiagnostic[];
  strengths: string[];
  weaknesses: string[];
  criticalProcesses: string[];
  logisticsProblems: string[];
  operationalRisks: string[];
  improvementOpportunities: string[];
  swot: {
    fortalezas: string[];
    debilidades: string[];
    oportunidades: string[];
    amenazas: string[];
  };
}

export interface AIPrioritizedAction {
  priority: 'Alta' | 'Media' | 'Baja';
  area: KPIArea | 'Administración' | 'General';
  problem: string;
  action: string;
  objective: string;
  relatedKpi: string;
  suggestedTarget: string;
  expectedImpact: string;
}

export interface AIAnalysisReport {
  id: string;
  companyId: string;
  periodLabel: string;
  generatedAt: string;
  executiveSummary: string;
  kpiInterpretation: string;
  negativeResults: string[];
  criticalProcesses: string[];
  logisticsStrategies: string[];
  suggestedTargets: string[];
  prioritizedActions: AIPrioritizedAction[];
  conclusions: string;
}

export type ActionStatus = 'Pendiente' | 'En progreso' | 'Completado' | 'Retrasado';

export interface ImprovementAction {
  id: string;
  companyId: string;
  problemIdentified: string;
  responsibleArea: string;
  improvementAction: string;
  objective: string;
  relatedKpi: string;
  target: string;
  responsiblePerson: string;
  requiredResources: string;
  startDate: string;
  endDate: string;
  status: ActionStatus;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = 'text' | 'textarea' | 'select' | 'multiselect' | 'number';

export interface InterviewQuestion {
  id: string;
  number: number;
  label: string;
  type: QuestionType;
  placeholder?: string;
  options?: string[];
  unit?: string;
}

export interface InterviewSection {
  code: string;
  title: string;
  subtitle: string;
  optional?: boolean;
  questions: InterviewQuestion[];
}

export interface PageConfig {
  appTitle: string;
  appSubtitle: string;
  footerTitle: string;
  footerSubtitle: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  primaryColor: string;
  accentColor: string;
  pdfHeaderTitle: string;
  pdfIntroText: string;
  navLabels: Record<string, string>;
}

export interface WorkspaceData {
  companies: Company[];
  interviews: Interview[];
  metrics: MonthlyMetrics[];
  improvementPlans: ImprovementAction[];
  aiReports: AIAnalysisReport[];
  customTargets: Record<string, Record<string, number>>; // companyId -> kpiId -> target
  interviewSections?: InterviewSection[];
  pageConfig?: PageConfig;
}
