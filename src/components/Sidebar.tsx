import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  Check,
  CheckSquare,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Folder,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Package,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  Truck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { DEFAULT_PAGE_CONFIG, DEFAULT_SIDEBAR_TABS } from '../data/interviewSchema';
import { PageConfig, SidebarIconName, SidebarTab } from '../types/domain';
import { generateId } from '../utils/formatters';

export type NavSection = string;

export const SIDEBAR_ICON_MAP: Record<SidebarIconName, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  Calculator,
  BarChart3,
  Gauge,
  Sparkles,
  ListChecks,
  FileText,
  SlidersHorizontal,
  Folder,
  Briefcase,
  Target,
  Package,
  Truck,
  UserCheck,
  Users,
  CheckSquare,
};

export const CUSTOM_ICON_OPTIONS: Array<{ value: SidebarIconName; label: string }> = [
  { value: 'Folder', label: 'Carpeta' },
  { value: 'FileText', label: 'Documento' },
  { value: 'Briefcase', label: 'Portafolio' },
  { value: 'Target', label: 'Objetivo' },
  { value: 'CheckSquare', label: 'Lista' },
  { value: 'Package', label: 'Inventario / Paquete' },
  { value: 'Truck', label: 'Logística / Transporte' },
  { value: 'Users', label: 'Equipo / Clientes' },
  { value: 'BarChart3', label: 'Análisis' },
];

export const NAV_ITEMS = DEFAULT_SIDEBAR_TABS.map((t) => ({
  id: t.id,
  label: t.label,
  icon: SIDEBAR_ICON_MAP[t.icon],
}));

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  alertCount: number;
  pageConfig?: PageConfig;
  onUpdateTabs?: (tabs: SidebarTab[]) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
  alertCount,
  pageConfig = DEFAULT_PAGE_CONFIG,
  onUpdateTabs,
}) => {
  const [manageMode, setManageMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState('');
  const [newTabIcon, setNewTabIcon] = useState<SidebarIconName>('Folder');

  const primaryColor = pageConfig.primaryColor || '#0B1E3B';
  const accentColor = pageConfig.accentColor || '#15803D';
  const tabs: SidebarTab[] =
    pageConfig.sidebarTabs && pageConfig.sidebarTabs.length > 0
      ? pageConfig.sidebarTabs
      : DEFAULT_SIDEBAR_TABS;

  const missingBuiltInTabs = DEFAULT_SIDEBAR_TABS.filter(
    (def) => !tabs.some((t) => t.id === def.id)
  );

  const handleAddCustomTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabLabel.trim() || !onUpdateTabs) return;
    const created: SidebarTab = {
      id: generateId('tab'),
      label: newTabLabel.trim(),
      icon: newTabIcon,
      isCustom: true,
    };
    const nextTabs = [...tabs, created];
    onUpdateTabs(nextTabs);
    onSelectSection(created.id);
    setNewTabLabel('');
    setShowAddForm(false);
  };

  const handleRestoreBuiltIn = (tab: SidebarTab) => {
    if (!onUpdateTabs) return;
    onUpdateTabs([...tabs, tab]);
  };

  const handleDeleteTab = (id: string) => {
    if (!onUpdateTabs || tabs.length <= 1) return;
    const nextTabs = tabs.filter((t) => t.id !== id);
    onUpdateTabs(nextTabs);
    if (activeSection === id && nextTabs.length > 0) {
      onSelectSection(nextTabs[0].id);
    }
  };

  const handleMoveTab = (idx: number, dir: -1 | 1) => {
    if (!onUpdateTabs) return;
    const target = idx + dir;
    if (target < 0 || target >= tabs.length) return;
    const copy = [...tabs];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    onUpdateTabs(copy);
  };

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

      {/* Quick sidebar tab management bar */}
      {onUpdateTabs && (
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setShowAddForm(!showAddForm);
            }}
            className="inline-flex items-center gap-1 rounded px-2 py-1 font-medium text-emerald-200 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Implementar pestaña</span>
          </button>
          <button
            type="button"
            onClick={() => setManageMode(!manageMode)}
            className={`rounded px-2 py-1 font-medium transition-colors cursor-pointer ${
              manageMode
                ? 'bg-white/20 text-white'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {manageMode ? 'Listo' : 'Editar'}
          </button>
        </div>
      )}

      {/* Inline Add Tab Form */}
      {showAddForm && onUpdateTabs && (
        <form
          onSubmit={handleAddCustomTab}
          className="border-b border-white/10 bg-black/20 px-4 py-3 space-y-2.5 text-xs"
        >
          <div>
            <label className="block text-[11px] text-slate-300 mb-1">Nombre nueva pestaña</label>
            <input
              type="text"
              required
              value={newTabLabel}
              onChange={(e) => setNewTabLabel(e.target.value)}
              placeholder="Ej. Auditoría Calidad"
              className="w-full rounded border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-300 mb-1">Ícono</label>
            <select
              value={newTabIcon}
              onChange={(e) => setNewTabIcon(e.target.value as SidebarIconName)}
              className="w-full rounded border border-white/20 bg-[#0B1E3B] px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              {CUSTOM_ICON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              style={{ backgroundColor: accentColor }}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded py-1.5 font-semibold text-white hover:opacity-90 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Crear pestaña</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded border border-white/20 px-2.5 py-1.5 text-slate-200 hover:bg-white/10 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {missingBuiltInTabs.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-1">
              <p className="text-[11px] text-slate-300">Restaurar módulo borrado:</p>
              <div className="flex flex-wrap gap-1">
                {missingBuiltInTabs.map((mt) => (
                  <button
                    key={mt.id}
                    type="button"
                    onClick={() => handleRestoreBuiltIn(mt)}
                    className="rounded bg-white/10 px-2 py-0.5 text-[11px] text-emerald-200 hover:bg-white/20 cursor-pointer"
                  >
                    + {mt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-label="Navegación principal">
        {tabs.map((item, idx) => {
          const Icon = SIDEBAR_ICON_MAP[item.icon] ?? FileText;
          const isActive = activeSection === item.id;
          const displayLabel =
            (pageConfig.navLabels && pageConfig.navLabels[item.id]) || item.label;

          return (
            <div key={item.id} className="group flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                style={isActive ? { backgroundColor: accentColor } : undefined}
                className={`flex flex-1 min-w-0 items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
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
                {item.id === 'kpis' && alertCount > 0 && !manageMode && (
                  <span className="ml-2 font-mono text-xs tabular-nums text-amber-200">
                    {alertCount}
                  </span>
                )}
              </button>

              {manageMode && onUpdateTabs && (
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveTab(idx, -1)}
                    disabled={idx === 0}
                    className="rounded p-1 text-slate-300 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                    title="Subir pestaña"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveTab(idx, 1)}
                    disabled={idx === tabs.length - 1}
                    className="rounded p-1 text-slate-300 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                    title="Bajar pestaña"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTab(item.id)}
                    disabled={tabs.length <= 1}
                    className="rounded p-1 text-red-300 hover:bg-red-500/20 hover:text-red-200 disabled:opacity-30 cursor-pointer"
                    title={`Borrar pestaña ${displayLabel}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
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
      <aside className="hidden lg:block lg:w-68 lg:shrink-0 border-r border-slate-200">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-xl">{navContent}</div>
        </div>
      )}
    </>
  );
};
