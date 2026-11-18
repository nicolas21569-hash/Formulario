import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ClipboardEdit,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { DEFAULT_PAGE_CONFIG, DEFAULT_SIDEBAR_TABS } from '../data/interviewSchema';
import { PageConfig, SidebarIconName, SidebarTab } from '../types/domain';
import { generateId } from '../utils/formatters';
import { CUSTOM_ICON_OPTIONS, NavSection, SIDEBAR_ICON_MAP } from './Sidebar';

interface PageEditorViewProps {
  pageConfig: PageConfig;
  onSavePageConfig: (config: PageConfig) => void;
  onNavigate: (section: NavSection) => void;
}

const COLOR_PRESETS = [
  { name: 'Azul Corporativo y Verde', primary: '#0B1E3B', accent: '#15803D' },
  { name: 'Azul Marino y Esmeralda', primary: '#0F294D', accent: '#059669' },
  { name: 'Grafito Ejecutivo y Azul', primary: '#1E293B', accent: '#1D4ED8' },
  { name: 'Petróleo Oscuro y Teal', primary: '#0F3D3E', accent: '#0D9488' },
];

const ALL_ICON_OPTIONS: Array<{ value: SidebarIconName; label: string }> = [
  ...CUSTOM_ICON_OPTIONS,
  { value: 'LayoutDashboard', label: 'Panel' },
  { value: 'Building2', label: 'Empresa' },
  { value: 'UserCheck', label: 'Trabajadores' },
  { value: 'ClipboardCheck', label: 'Entrevista' },
  { value: 'FileSpreadsheet', label: 'Hoja de datos' },
  { value: 'Calculator', label: 'Indicadores' },
  { value: 'Gauge', label: 'Diagnóstico' },
  { value: 'Sparkles', label: 'IA' },
  { value: 'ListChecks', label: 'Plan de mejora' },
  { value: 'SlidersHorizontal', label: 'Configuración' },
];

export const PageEditorView: React.FC<PageEditorViewProps> = ({
  pageConfig,
  onSavePageConfig,
  onNavigate,
}) => {
  const [form, setForm] = useState<PageConfig>(pageConfig);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState('');
  const [newTabIcon, setNewTabIcon] = useState<SidebarIconName>('Folder');

  useEffect(() => {
    setForm(pageConfig);
  }, [pageConfig]);

  const currentTabs: SidebarTab[] =
    form.sidebarTabs && form.sidebarTabs.length > 0
      ? form.sidebarTabs
      : DEFAULT_SIDEBAR_TABS;

  const missingBuiltIn = DEFAULT_SIDEBAR_TABS.filter(
    (d) => !currentTabs.some((t) => t.id === d.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePageConfig(form);
    setSavedNotice('Configuración de la página y pestañas guardada correctamente.');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleReset = () => {
    setForm(DEFAULT_PAGE_CONFIG);
    onSavePageConfig(DEFAULT_PAGE_CONFIG);
    setSavedNotice('Se restablecieron los textos, colores y pestañas predeterminadas.');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const updateTab = (idx: number, patch: Partial<SidebarTab>) => {
    const nextTabs = currentTabs.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    setForm({ ...form, sidebarTabs: nextTabs });
  };

  const moveTab = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= currentTabs.length) return;
    const copy = [...currentTabs];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    setForm({ ...form, sidebarTabs: copy });
  };

  const removeTab = (idx: number) => {
    if (currentTabs.length <= 1) return;
    const nextTabs = currentTabs.filter((_, i) => i !== idx);
    setForm({ ...form, sidebarTabs: nextTabs });
  };

  const addCustomTab = () => {
    if (!newTabName.trim()) return;
    const created: SidebarTab = {
      id: generateId('tab'),
      label: newTabName.trim(),
      icon: newTabIcon,
      isCustom: true,
    };
    const nextConfig: PageConfig = {
      ...form,
      sidebarTabs: [...currentTabs, created],
    };
    setForm(nextConfig);
    onSavePageConfig(nextConfig);
    setNewTabName('');
    setSavedNotice(`Pestaña "${created.label}" implementada en el panel izquierdo.`);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const restoreBuiltInTab = (tab: SidebarTab) => {
    const nextConfig: PageConfig = {
      ...form,
      sidebarTabs: [...currentTabs, tab],
    };
    setForm(nextConfig);
    onSavePageConfig(nextConfig);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
            Editor de la Página y Pestañas
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Implemente o borre pestañas del panel izquierdo, y personalice textos, colores e informes PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('interviews')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ClipboardEdit className="h-4 w-4" />
            <span>Editar Preguntas</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restablecer todo</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Gestor de Pestañas del Panel Izquierdo */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-display text-base font-bold text-[#0B1E3B]">
              1. Pestañas del Panel Izquierdo ({currentTabs.length} activas)
            </h3>
            <p className="text-xs text-slate-500">
              Implemente nuevas pestañas personalizadas, cambie el nombre o ícono, reordénelas o elimine las que no necesite.
            </p>
          </div>

          {/* Agregar nueva pestaña */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-bold text-[#0B1E3B]">Implementar nueva pestaña personalizada</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nombre de la pestaña
                </label>
                <input
                  type="text"
                  value={newTabName}
                  onChange={(e) => setNewTabName(e.target.value)}
                  placeholder="Ej. Seguridad Industrial / Presupuesto / Proveedores"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ícono</label>
                <select
                  value={newTabIcon}
                  onChange={(e) => setNewTabIcon(e.target.value as SidebarIconName)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                >
                  {ALL_ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={addCustomTab}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Implementar pestaña</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lista de pestañas actuales */}
          <div className="space-y-2">
            {currentTabs.map((tab, idx) => {
              const Icon = SIDEBAR_ICON_MAP[tab.icon] ?? SIDEBAR_ICON_MAP.FileText;
              return (
                <div
                  key={tab.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                >
                  <Icon className="h-4 w-4 text-[#0B1E3B] shrink-0" />
                  <input
                    type="text"
                    value={tab.label}
                    onChange={(e) => updateTab(idx, { label: e.target.value })}
                    className="flex-1 min-w-[160px] rounded border border-slate-300 px-2.5 py-1 text-sm font-medium focus:border-[#0B1E3B] focus:outline-none"
                  />
                  <select
                    value={tab.icon}
                    onChange={(e) =>
                      updateTab(idx, { icon: e.target.value as SidebarIconName })
                    }
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                  >
                    {ALL_ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-500 min-w-[75px]">
                    {tab.isCustom ? 'Personalizada' : 'Sistema'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveTab(idx, -1)}
                      disabled={idx === 0}
                      className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                      title="Subir"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTab(idx, 1)}
                      disabled={idx === currentTabs.length - 1}
                      className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                      title="Bajar"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTab(idx)}
                      disabled={currentTabs.length <= 1}
                      className="rounded border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                      title="Borrar pestaña del panel izquierdo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {missingBuiltIn.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Pestañas del sistema eliminadas (clic para volver a implementar):
              </p>
              <div className="flex flex-wrap gap-2">
                {missingBuiltIn.map((mt) => (
                  <button
                    key={mt.id}
                    type="button"
                    onClick={() => restoreBuiltInTab(mt)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-[#0B1E3B] hover:bg-emerald-50 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#15803D]" />
                    <span>{mt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Identidad y Marca */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-display text-base font-bold text-[#0B1E3B]">
              2. Identidad y Textos Principales de la Página
            </h3>
            <p className="text-xs text-slate-500">
              Modifique el nombre visible en la barra lateral, pestaña del navegador y encabezados del panel principal.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título principal de la plataforma
              </label>
              <input
                type="text"
                required
                value={form.appTitle}
                onChange={(e) => setForm({ ...form, appTitle: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subtítulo de marca
              </label>
              <input
                type="text"
                value={form.appSubtitle}
                onChange={(e) => setForm({ ...form, appSubtitle: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título pie de barra lateral
              </label>
              <input
                type="text"
                value={form.footerTitle}
                onChange={(e) => setForm({ ...form, footerTitle: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subtítulo pie de barra lateral
              </label>
              <input
                type="text"
                value={form.footerSubtitle}
                onChange={(e) => setForm({ ...form, footerSubtitle: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título del Panel Principal (Dashboard)
              </label>
              <input
                type="text"
                value={form.dashboardTitle}
                onChange={(e) => setForm({ ...form, dashboardTitle: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción del Panel Principal
              </label>
              <textarea
                rows={2}
                value={form.dashboardSubtitle}
                onChange={(e) => setForm({ ...form, dashboardSubtitle: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Paleta de Colores */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Palette className="h-4 w-4 text-[#0B1E3B]" />
            <div>
              <h3 className="font-display text-base font-bold text-[#0B1E3B]">
                3. Colores de la Página
              </h3>
              <p className="text-xs text-slate-500">
                Elija una combinación predefinida o seleccione colores corporativos propios.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() =>
                  setForm({ ...form, primaryColor: preset.primary, accentColor: preset.accent })
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <span className="h-3.5 w-3.5 rounded-sm" style={{ backgroundColor: preset.primary }} />
                <span className="h-3.5 w-3.5 rounded-sm" style={{ backgroundColor: preset.accent }} />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="h-10 w-14 rounded border border-slate-300 cursor-pointer"
              />
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Color principal (Menú lateral)
                </label>
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                className="h-10 w-14 rounded border border-slate-300 cursor-pointer"
              />
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Color de acento (Botones activos)
                </label>
                <input
                  type="text"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Encabezado de Informes PDF */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-display text-base font-bold text-[#0B1E3B]">
              4. Textos Personalizados del Informe PDF
            </h3>
            <p className="text-xs text-slate-500">
              Personalice el encabezado de portada y la introducción que aparecerán en los PDF descargados.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subtítulo de portada del informe PDF
              </label>
              <input
                type="text"
                value={form.pdfHeaderTitle}
                onChange={(e) => setForm({ ...form, pdfHeaderTitle: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Introducción personalizada del informe PDF
              </label>
              <textarea
                rows={3}
                value={form.pdfIntroText}
                onChange={(e) => setForm({ ...form, pdfIntroText: e.target.value })}
                placeholder="Escriba aquí una introducción personalizada si desea reemplazar el texto automático..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
            style={{ backgroundColor: form.accentColor || '#15803D' }}
          >
            <Save className="h-4 w-4" />
            <span>Guardar Cambios de la Página</span>
          </button>
        </div>
      </form>
    </div>
  );
};
