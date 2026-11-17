import React from 'react';
import {
  BarChart3,
  Building2,
  Calculator,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Gauge,
  LayoutDashboard,
  ListChecks,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { DEFAULT_PAGE_CONFIG } from '../data/interviewSchema';
import { PageConfig } from '../types/domain';

export type NavSection =
  | 'dashboard'
  | 'companies'
  | 'interviews'
  | 'metrics'
  | 'kpis'
  | 'charts'
  | 'diagnostic'
  | 'ai'
  | 'plan'
  | 'reports'
  | 'pageEditor';

export const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
  { id: 'companies', label: 'Registro de Empresas', icon: Building2 },
  { id: 'interviews', label: 'Módulo de Entrevistas', icon: ClipboardCheck },
  { id: 'metrics', label: 'Datos Numéricos', icon: FileSpreadsheet },
  { id: 'kpis', label: 'Indicadores KPI', icon: Calculator },
  { id: 'charts', label: 'Gráficas Automáticas', icon: BarChart3 },
  { id: 'diagnostic', label: 'Diagnóstico y DOFA', icon: Gauge },
  { id: 'ai', label: 'Recomendaciones IA', icon: Sparkles },
  { id: 'plan', label: 'Plan de Mejoramiento', icon: ListChecks },
  { id: 'reports', label: 'Informes PDF', icon: FileText },
  { id: 'pageEditor', label: 'Editar Página', icon: SlidersHorizontal },
];

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  alertCount: number;
  pageConfig?: PageConfig;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
  alertCount,
  pageConfig = DEFAULT_PAGE_CONFIG,
}) => {
  const primaryColor = pageConfig.primaryColor || '#0B1E3B';
  const accentColor = pageConfig.accentColor || '#15803D';

  const navContent = (
    <div className="flex h-full flex-col text-white" style={{ backgroundColor: primaryColor }}>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div className="min-w-0">
          <p className="font-display text-base font-bold tracking-tight text-white leading-tight">
            {pageConfig.appTitle || 'Diagnóstico Empresarial'}
          </p>
          {pageConfig.appSubtitle && (
            <p className="mt-0.5 text-xs text-slate-300">{pageConfig.appSubtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const displayLabel =
            (pageConfig.navLabels && pageConfig.navLabels[item.id]) || item.label;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                onCloseMobile();
              }}
              style={isActive ? { backgroundColor: accentColor } : undefined}
              className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive ? 'text-white' : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`}
                />
                <span className="truncate">{displayLabel}</span>
              </span>
              {item.id === 'kpis' && alertCount > 0 && (
                <span className="ml-2 font-mono text-xs tabular-nums text-amber-200">
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-300">
        <p className="font-medium text-white">{pageConfig.footerTitle}</p>
        <p className="mt-1 text-slate-300">{pageConfig.footerSubtitle}</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 border-r border-slate-200">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-68 max-w-[85vw] h-full shadow-xl">{navContent}</div>
        </div>
      )}
    </>
  );
};
