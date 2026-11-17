import React, { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardEdit, Palette, RotateCcw, Save } from 'lucide-react';
import { DEFAULT_PAGE_CONFIG } from '../data/interviewSchema';
import { PageConfig } from '../types/domain';
import { NAV_ITEMS, NavSection } from './Sidebar';

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

export const PageEditorView: React.FC<PageEditorViewProps> = ({
  pageConfig,
  onSavePageConfig,
  onNavigate,
}) => {
  const [form, setForm] = useState<PageConfig>(pageConfig);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setForm(pageConfig);
  }, [pageConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePageConfig(form);
    setSavedNotice('Configuración de la página guardada y aplicada en toda la plataforma.');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleReset = () => {
    setForm(DEFAULT_PAGE_CONFIG);
    onSavePageConfig(DEFAULT_PAGE_CONFIG);
    setSavedNotice('Se restablecieron los textos y colores predeterminados de la página.');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const updateNavLabel = (id: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      navLabels: {
        ...prev.navLabels,
        [id]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
            Editor de la Página y Apariencia
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Personalice los títulos, textos del panel principal, etiquetas del menú, colores corporativos y textos de los informes PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('interviews')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ClipboardEdit className="h-4 w-4" />
            <span>Editar Preguntas de Entrevista</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restablecer</span>
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
        {/* Identidad y Marca */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-display text-base font-bold text-[#0B1E3B]">
              1. Identidad y Textos Principales de la Página
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
                2. Colores de la Página
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
                <span
                  className="h-3.5 w-3.5 rounded-sm"
                  style={{ backgroundColor: preset.primary }}
                />
                <span
                  className="h-3.5 w-3.5 rounded-sm"
                  style={{ backgroundColor: preset.accent }}
                />
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
                  Color principal (Menú lateral y títulos)
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
                  Color de acento (Botones activos y destacados)
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

        {/* Etiquetas del Menú */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-display text-base font-bold text-[#0B1E3B]">
              3. Nombres de las Secciones del Menú Lateral
            </h3>
            <p className="text-xs text-slate-500">
              Renombre cualquier módulo de navegación según la terminología de su empresa o consultoría.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NAV_ITEMS.filter((item) => item.id !== 'pageEditor').map((item) => (
              <div key={item.id}>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Original: {item.label}
                </label>
                <input
                  type="text"
                  value={form.navLabels[item.id] ?? item.label}
                  onChange={(e) => updateNavLabel(item.id, e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
            ))}
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
                Introducción personalizada del informe PDF (dejar vacío para usar introducción automática por empresa)
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
