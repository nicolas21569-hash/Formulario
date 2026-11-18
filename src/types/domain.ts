export type BusinessSector =
  | 'Comercial'
  | 'Industrial'
  | 'Restaurante'
  | 'Transporte'
  | 'Almacenamiento'
  | 'Servicios'
  | 'Distribución'
  | 'Alimentos y Productos para Mascotas'
  | 'Otro';

export interface OrgPosition {
  id: string;
  positionTitle: string;
  area: string;
  employeesInRole: number;
  reportsTo?: string;
}

export interface Company {
  id: string;
  name: string;
  nit: string;
  economicActivity: string;
  sector: BusinessSector;
  address: string;
  city: string;
  // Datos del representante legal o propietario
  representativeName: string;
  representativeRole?: string;
  representativeDocument?: string;
  representativePhone?: string;
  representativeEmail?: string;
  // Datos del trabajador entrevistado principal
  intervieweeName?: string;
  intervieweeRole: string;
  intervieweeArea?: string;
  intervieweeTenure?: string;
  // Estructura y antigüedad
  employeesCount: number;
  yearsOperating: string;
  hasOrgChart?: 'Sí' | 'No' | 'En construcción';
  orgChartDescription?: string;
  existingPositions?: OrgPosition[];
  phone: string;
  email: string;
  registrationDate: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Worker {
  id: string;
  companyId: string;
  fullName: string;
  role: string;
  area: string;
  tenure: string; // Antigüedad del trabajador
  reportsTo?: string;
  phone?: string;
  email?: string;
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

export interface WorkerInterview {
  id: string;
  companyId: string;
  workerId: string;
  interviewerName: string;
  interviewDate: string;
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
  unitsProduced: number | null; // Pedidos / unidades preparadas en operaciones internas
  defectiveUnits: number | null; // Pedidos / unidades con errores o dañados
  totalPreparationHours?: number | null; // Horas totales en preparación de pedidos
  expiredGoodsValue?: number | null; // Valor de productos vencidos
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
  | 'Preparación de Pedidos y Operaciones'
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
  complianceLevel: number | null;
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

export type ProblemSeverity = 'Crítico' | 'Alto' | 'Medio' | 'Bajo';
export type ProblemFrequency = 'Diaria' | 'Semanal' | 'Mensual' | 'Ocasional';

export interface DiagnosticProblem {
  id: string;
  companyId: string;
  affectedArea: string;
  affectedProcess: string;
  description: string;
  frequency: ProblemFrequency;
  severity: ProblemSeverity;
  consequences: string;
  possibleCauses: string;
  evidence: string;
  recommendations: string;
  isAutoDetected?: boolean;
  isDemo?: boolean;
  updatedAt: string;
}

export interface DiagnosticSummary {
  companyId: string;
  generatedAt: string;
  overallCompliance: number | null;
  processes: ProcessDiagnostic[];
  detailedProblems: DiagnosticProblem[];
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

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'number'
  | 'yes_no_na';

export interface QuestionCondition {
  questionId: string;
  equals?: string | string[];
  notEquals?: string;
}

export interface InterviewQuestion {
  id: string;
  number: number;
  label: string;
  type: QuestionType;
  placeholder?: string;
  options?: string[];
  unit?: string;
  conditionalOn?: QuestionCondition;
}

export interface InterviewSection {
  code: string;
  title: string;
  subtitle: string;
  optional?: boolean;
  questions: InterviewQuestion[];
}

export type SidebarIconName =
  | 'LayoutDashboard'
  | 'Building2'
  | 'ClipboardCheck'
  | 'FileSpreadsheet'
  | 'Calculator'
  | 'BarChart3'
  | 'Gauge'
  | 'Sparkles'
  | 'ListChecks'
  | 'FileText'
  | 'SlidersHorizontal'
  | 'Folder'
  | 'Briefcase'
  | 'Target'
  | 'Package'
  | 'Truck'
  | 'Users'
  | 'UserCheck'
  | 'CheckSquare';

export interface SidebarTab {
  id: string;
  label: string;
  icon: SidebarIconName;
  isCustom?: boolean;
}

export interface CustomTabItem {
  id: string;
  title: string;
  responsible: string;
  status: 'Pendiente' | 'En progreso' | 'Completado';
  notes: string;
}

export interface CustomTabContent {
  tabId: string;
  heading: string;
  description: string;
  bodyText: string;
  items: CustomTabItem[];
  updatedAt: string;
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
  sidebarTabs?: SidebarTab[];
}

export interface WorkspaceData {
  schemaVersion?: number;
  companies: Company[];
  workers: Worker[];
  interviews: Interview[];
  workerInterviews: WorkerInterview[];
  metrics: MonthlyMetrics[];
  diagnosticProblems: DiagnosticProblem[];
  improvementPlans: ImprovementAction[];
  aiReports: AIAnalysisReport[];
  customTargets: Record<string, Record<string, number>>; // companyId -> kpiId -> target
  interviewSections?: InterviewSection[];
  pageConfig?: PageConfig;
  customTabContents?: Record<string, CustomTabContent>;
}
