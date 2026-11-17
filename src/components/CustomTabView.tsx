import React, { useEffect, useState } from 'react';
import { Check, CheckCircle2, Edit3, Plus, Save, Trash2 } from 'lucide-react';
import { CustomTabContent, CustomTabItem, SidebarTab } from '../types/domain';
import { generateId } from '../utils/formatters';

interface CustomTabViewProps {
  tab: SidebarTab;
  content: CustomTabContent | undefined;
  onSaveContent: (content: CustomTabContent) => void;
  onRenameTab: (tabId: string, newLabel: string) => void;
  onDeleteTab: (tabId: string) => void;
}

export const CustomTabView: React.FC<CustomTabViewProps> = ({
  tab,
  content,
  onSaveContent,
  onRenameTab,
  onDeleteTab,
}) => {
  const [editingHeader, setEditingHeader] = useState(false);
  const [tabLabelInput, setTabLabelInput] = useState(tab.label);
  const [heading, setHeading] = useState(content?.heading ?? tab.label);
  const [description, setDescription] = useState(
    content?.description ?? 'Sección personalizada del panel de gestión y diagnóstico.'
  );
  const [bodyText, setBodyText] = useState(content?.bodyText ?? '');
  const [items, setItems] = useState<CustomTabItem[]>(content?.items ?? []);
  const [savedNotice, setSavedNotice] = useState(false);

  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemResp, setNewItemResp] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');

  useEffect(() => {
    setTabLabelInput(tab.label);
    setHeading(content?.heading ?? tab.label);
    setDescription(
      content?.description ?? 'Sección personalizada del panel de gestión y diagnóstico.'
    );
    setBodyText(content?.bodyText ?? '');
    setItems(content?.items ?? []);
  }, [tab.id, tab.label, content]);

  const persistAll = (
    nextItems: CustomTabItem[] = items,
    nextHeading = heading,
    nextDesc = description,
    nextBody = bodyText
  ) => {
    onSaveContent({
      tabId: tab.id,
      heading: nextHeading,
      description: nextDesc,
      bodyText: nextBody,
      items: nextItems,
      updatedAt: new Date().toISOString(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    const nextItem: CustomTabItem = {
      id: generateId('item'),
      title: newItemTitle.trim(),
      responsible: newItemResp.trim(),
      status: 'Pendiente',
      notes: newItemNotes.trim(),
    };
    const nextItems = [...items, nextItem];
    setItems(nextItems);
    setNewItemTitle('');
    setNewItemResp('');
    setNewItemNotes('');
    persistAll(nextItems);
  };

  const handleUpdateItemStatus = (id: string, status: CustomTabItem['status']) => {
    const nextItems = items.map((it) => (it.id === id ? { ...it, status } : it));
    setItems(nextItems);
    persistAll(nextItems);
  };

  const handleDeleteItem = (id: string) => {
    const nextItems = items.filter((it) => it.id !== id);
    setItems(nextItems);
    persistAll(nextItems);
  };

  const handleSaveHeader = () => {
    if (tabLabelInput.trim() && tabLabelInput.trim() !== tab.label) {
      onRenameTab(tab.id, tabLabelInput.trim());
    }
    persistAll(items, heading, description, bodyText);
    setEditingHeader(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 pb-5">
        <div className="flex-1 min-w-0">
          {editingHeader ? (
            <div className="space-y-3 max-w-2xl rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre de la pestaña en el menú izquierdo
                </label>
                <input
                  type="text"
                  value={tabLabelInput}
                  onChange={(e) => setTabLabelInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Título principal de la vista
                </label>
                <input
                  type="text"
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveHeader}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#166534] cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Aplicar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingHeader(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">{heading}</h2>
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEditingHeader(!editingHeader)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Editar encabezado</span>
          </button>
          <button
            type="button"
            onClick={() => onDeleteTab(tab.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Borrar pestaña</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
          <span>Contenido guardado correctamente.</span>
        </div>
      )}

      {/* Documentación / Notas */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
              Documentación y Notas de la Sección
            </h3>
            <p className="text-xs text-slate-500">
              Registre información libre, políticas, hallazgos o procedimientos específicos para esta pestaña.
            </p>
          </div>
          <button
            type="button"
            onClick={() => persistAll()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-4 py-2 text-xs font-medium text-white hover:bg-[#166534] cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Guardar texto</span>
          </button>
        </div>

        <textarea
          rows={5}
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="Escriba aquí la información, instrucciones o notas de esta pestaña..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
        />
      </div>

      {/* Tabla / Lista de seguimiento */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
            Registros y Seguimiento ({items.length})
          </h3>
          <p className="text-xs text-slate-500">
            Agregue elementos, tareas, requisitos o controles específicos para esta pestaña.
          </p>
        </div>

        <form onSubmit={handleAddItem} className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Elemento / Actividad *</label>
            <input
              type="text"
              required
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Ej. Verificar calibración de básculas"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Responsable</label>
            <input
              type="text"
              value={newItemResp}
              onChange={(e) => setNewItemResp(e.target.value)}
              placeholder="Ej. Jefe de Bodega"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
            <input
              type="text"
              value={newItemNotes}
              onChange={(e) => setNewItemNotes(e.target.value)}
              placeholder="Detalle adicional..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0B1E3B] px-3 py-2 text-sm font-medium text-white hover:bg-[#132d56] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar</span>
            </button>
          </div>
        </form>

        {items.length > 0 && (
          <div className="overflow-x-auto border-t border-slate-100 pt-3">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Elemento / Actividad</th>
                  <th className="px-3 py-2.5">Responsable</th>
                  <th className="px-3 py-2.5">Observaciones</th>
                  <th className="px-3 py-2.5">Estado</th>
                  <th className="px-3 py-2.5 text-right">Quitar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 font-medium text-slate-900">{it.title}</td>
                    <td className="px-3 py-2.5 text-slate-600">{it.responsible || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600">{it.notes || '—'}</td>
                    <td className="px-3 py-2.5">
                      <select
                        value={it.status}
                        onChange={(e) =>
                          handleUpdateItemStatus(it.id, e.target.value as CustomTabItem['status'])
                        }
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En progreso">En progreso</option>
                        <option value="Completado">Completado</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(it.id)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
