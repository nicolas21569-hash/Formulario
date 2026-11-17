import React, { useMemo, useState } from 'react';
import { Check, Edit3, ListChecks, Plus, Trash2, X } from 'lucide-react';
import { ActionStatus, Company, ImprovementAction } from '../types/domain';
import { generateId } from '../utils/formatters';
import { NavSection } from './Sidebar';

interface ImprovementPlanViewProps {
  company: Company | undefined;
  plans: ImprovementAction[];
  onSavePlan: (action: ImprovementAction) => void;
  onDeletePlan: (id: string) => void;
  onNavigate: (section: NavSection) => void;
}

const STATUS_OPTIONS: ActionStatus[] = ['Pendiente', 'En progreso', 'Completado', 'Retrasado'];

const EMPTY_ACTION = {
  problemIdentified: '',
  responsibleArea: 'Almacenamiento e Inventarios',
  improvementAction: '',
  objective: '',
  relatedKpi: '',
  target: '',
  responsiblePerson: '',
  requiredResources: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  status: 'Pendiente' as ActionStatus,
};

export const ImprovementPlanView: React.FC<ImprovementPlanViewProps> = ({
  company,
  plans,
  onSavePlan,
  onDeletePlan,
  onNavigate,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_ACTION);
  const [statusFilter, setStatusFilter] = useState<'Todos' | ActionStatus>('Todos');

  const filteredPlans = useMemo(() => {
    if (statusFilter === 'Todos') return plans;
    return plans.filter((p) => p.status === statusFilter);
  }, [plans, statusFilter]);

  const progressSummary = useMemo(() => {
    if (plans.length === 0) return { completed: 0, pct: 0 };
    const completed = plans.filter((p) => p.status === 'Completado').length;
    return { completed, pct: Math.round((completed / plans.length) * 100) };
  }, [plans]);

  if (!company) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <ListChecks className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 font-display text-lg font-semibold text-[#0B1E3B]">
          Registre una empresa para gestionar su Plan de Mejoramiento
        </h3>
        <button
          type="button"
          onClick={() => onNavigate('companies')}
          className="mt-4 rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
        >
          Ir a Empresas
        </button>
      </div>
    );
  }

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_ACTION);
    setShowForm(true);
  };

  const openEdit = (p: ImprovementAction) => {
    setEditingId(p.id);
    setForm({
      problemIdentified: p.problemIdentified,
      responsibleArea: p.responsibleArea,
      improvementAction: p.improvementAction,
      objective: p.objective,
      relatedKpi: p.relatedKpi,
      target: p.target,
      responsiblePerson: p.responsiblePerson,
      requiredResources: p.requiredResources,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.problemIdentified.trim() || !form.improvementAction.trim()) return;
    const now = new Date().toISOString();
    const existing = editingId ? plans.find((p) => p.id === editingId) : undefined;
    onSavePlan({
      ...form,
      id: existing ? existing.id : generateId('plan'),
      companyId: company.id,
      isDemo: existing?.isDemo,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleQuickStatusChange = (plan: ImprovementAction, nextStatus: ActionStatus) => {
    onSavePlan({
      ...plan,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
            Plan de Mejoramiento Empresarial
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Empresa: <span className="font-semibold text-slate-900">{company.name}</span> · Cumplimiento de acciones:{' '}
            <span className="font-mono font-bold text-[#15803D] tabular-nums">
              {progressSummary.completed}/{plans.length} ({progressSummary.pct}%)
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] whitespace-nowrap cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Acción de Mejora</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display text-base font-bold text-[#0B1E3B]">
              {editingId ? 'Editar Acción de Mejoramiento' : 'Registrar Nueva Acción de Mejoramiento'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Problema identificado *
              </label>
              <input
                type="text"
                required
                value={form.problemIdentified}
                onChange={(e) => setForm({ ...form, problemIdentified: e.target.value })}
                placeholder="Ej. Entregas fuera de tiempo en zona norte"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Área responsable
              </label>
              <select
                value={form.responsibleArea}
                onChange={(e) => setForm({ ...form, responsibleArea: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              >
                <option>Compras y Abastecimiento</option>
                <option>Recepción de Mercancías</option>
                <option>Almacenamiento e Inventarios</option>
                <option>Producción u Operación</option>
                <option>Transporte y Distribución</option>
                <option>Ventas y Servicio al Cliente</option>
                <option>Administración y Finanzas</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Acción de mejora *
              </label>
              <input
                type="text"
                required
                value={form.improvementAction}
                onChange={(e) => setForm({ ...form, improvementAction: e.target.value })}
                placeholder="Ej. Implementar zonificación de rutas y pre-alistamiento nocturno"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Objetivo</label>
              <input
                type="text"
                value={form.objective}
                onChange={(e) => setForm({ ...form, objective: e.target.value })}
                placeholder="Ej. Elevar puntualidad al 95%"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Indicador relacionado
              </label>
              <input
                type="text"
                value={form.relatedKpi}
                onChange={(e) => setForm({ ...form, relatedKpi: e.target.value })}
                placeholder="Ej. Entregas a tiempo"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meta</label>
              <input
                type="text"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                placeholder="Ej. ≥ 95%"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Responsable</label>
              <input
                type="text"
                value={form.responsiblePerson}
                onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })}
                placeholder="Ej. Coordinador Logístico"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recursos necesarios
              </label>
              <input
                type="text"
                value={form.requiredResources}
                onChange={(e) => setForm({ ...form, requiredResources: e.target.value })}
                placeholder="Ej. Software de ruteo, capacitación"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de finalización
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado de cumplimiento
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ActionStatus })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-5 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Guardar Acción</span>
            </button>
          </div>
        </form>
      )}

      {/* Status Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {(['Todos', ...STATUS_OPTIONS] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === st
                ? 'bg-[#0B1E3B] text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Editable Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {filteredPlans.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No hay acciones registradas en el Plan de Mejoramiento. Cree una nueva acción o impórtela desde Recomendaciones IA.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3">Problema identificado</th>
                  <th className="px-3 py-3">Área responsable</th>
                  <th className="px-3 py-3">Acción de mejora y Objetivo</th>
                  <th className="px-3 py-3">Indicador · Meta</th>
                  <th className="px-3 py-3">Responsable · Recursos</th>
                  <th className="px-3 py-3">Inicio / Fin</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Editar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 align-top">
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-[180px]">
                      {p.problemIdentified}
                    </td>
                    <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                      {p.responsibleArea}
                    </td>
                    <td className="px-3 py-3 text-slate-700 max-w-[230px]">
                      <div className="font-semibold text-[#0B1E3B]">{p.improvementAction}</div>
                      {p.objective && <div className="mt-0.5 text-slate-500">Obj: {p.objective}</div>}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <div>{p.relatedKpi || '—'}</div>
                      <div className="font-mono font-semibold text-[#15803D]">{p.target || '—'}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-700 max-w-[180px]">
                      <div className="font-medium text-slate-900">{p.responsiblePerson || '—'}</div>
                      <div className="text-slate-500 mt-0.5">{p.requiredResources || '—'}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap tabular-nums">
                      <div>{p.startDate}</div>
                      <div>{p.endDate}</div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={p.status}
                        onChange={(e) => handleQuickStatusChange(p, e.target.value as ActionStatus)}
                        className={`rounded-md border px-2 py-1 text-xs font-semibold focus:outline-none ${
                          p.status === 'Completado'
                            ? 'border-emerald-300 bg-emerald-50 text-[#15803D]'
                            : p.status === 'En progreso'
                            ? 'border-sky-300 bg-sky-50 text-[#0B1E3B]'
                            : p.status === 'Retrasado'
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-slate-300 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        aria-label="Editar acción"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePlan(p.id)}
                        className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        aria-label="Eliminar acción"
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
