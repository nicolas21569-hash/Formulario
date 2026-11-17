import React from 'react';
import { Menu, Plus, SlidersHorizontal } from 'lucide-react';
import { DEFAULT_PAGE_CONFIG } from '../data/interviewSchema';
import { Company, PageConfig } from '../types/domain';
import { NAV_ITEMS, NavSection } from './Sidebar';

interface TopBarProps {
  activeSection: NavSection;
  companies: Company[];
  selectedCompanyId: string;
  onSelectCompany: (id: string) => void;
  onOpenMobileMenu: () => void;
  onQuickNewInterview: () => void;
  onOpenPageEditor: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  pageConfig?: PageConfig;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  companies,
  selectedCompanyId,
  onSelectCompany,
  onOpenMobileMenu,
  onQuickNewInterview,
  onOpenPageEditor,
  saveStatus,
  pageConfig = DEFAULT_PAGE_CONFIG,
}) => {
  const defaultLabel = NAV_ITEMS.find((i) => i.id === activeSection)?.label ?? 'Panel Principal';
  const sectionLabel =
    (pageConfig.navLabels && pageConfig.navLabels[activeSection]) || defaultLabel;
  const accentColor = pageConfig.accentColor || '#15803D';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="hidden sm:inline text-slate-500 whitespace-nowrap">
            {pageConfig.appTitle || 'Plataforma'}
          </span>
          <span className="hidden sm:inline text-slate-300" aria-hidden="true">/</span>
          <h1 className="font-display text-base sm:text-lg font-semibold text-[#0B1E3B] truncate">
            {sectionLabel}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {saveStatus === 'saving' && (
          <span className="hidden md:inline text-xs text-slate-500 whitespace-nowrap">Guardando...</span>
        )}
        {saveStatus === 'saved' && (
          <span className="hidden md:inline text-xs text-[#15803D] whitespace-nowrap">Cambios guardados</span>
        )}
        {saveStatus === 'error' && (
          <span className="hidden md:inline text-xs text-red-600 whitespace-nowrap">Guardado local (sin conexión)</span>
        )}

        {companies.length > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <label htmlFor="topbar-company-select" className="sr-only">
              Empresa activa
            </label>
            <select
              id="topbar-company-select"
              value={selectedCompanyId}
              onChange={(e) => onSelectCompany(e.target.value)}
              className="max-w-[220px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 focus:border-[#0B1E3B] focus:outline-none"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenPageEditor}
          title="Editar página y textos"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Editar Página</span>
        </button>

        <button
          type="button"
          onClick={onQuickNewInterview}
          style={{ backgroundColor: accentColor }}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Nueva Entrevista</span>
        </button>
      </div>
    </header>
  );
};
