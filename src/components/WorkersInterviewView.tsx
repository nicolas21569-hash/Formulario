import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { WORKER_INTERVIEW_QUESTIONS } from '../data/interviewSchema';
import {
  AnswerValue,
  Company,
  InterviewQuestion,
  Worker,
  WorkerInterview,
} from '../types/domain';
import { generateId } from '../utils/formatters';
import { NavSection } from './Sidebar';

interface WorkersInterviewViewProps {
  company: Company | undefined;
  workers: Worker[];
  workerInterviews: WorkerInterview[];
  onSaveWorker: (worker: Worker) => void;
  onDeleteWorker: (id: string) => void;
  onSaveWorkerInterview: (interview: WorkerInterview) => void;
  onDeleteWorkerInterview: (id: string) => void;
  onNavigate: (section: NavSection) => void;
}

const WORKER_AREAS = [
  'Dirección / Administración',
  'Compras y Abastecimiento',
  'Recepción y Almacenamiento',
  'Preparación de Pedidos y Operaciones',
  'Transporte y Distribución',
  'Ventas y Servicio al Cliente',
  'Control de Calidad / Inventarios',
];

function isQuestionVisible(q: InterviewQuestion, answers: Record<string, AnswerValue>): boolean {
  if (!q.conditionalOn) return true;
  const dep = answers[q.conditionalOn.questionId];
  const depStr = Array.isArray(dep) ? dep.join(',') : String(dep ?? '');
  if (q.conditionalOn.equals !== undefined) {
    const targets = Array.isArray(q.conditionalOn.equals)
      ? q.conditionalOn.equals
      : [q.conditionalOn.equals];
    return targets.includes(depStr);
  }
  if (q.conditionalOn.notEquals !== undefined) {
    return depStr !== q.conditionalOn.notEquals;
  }
  return true;
}

export const WorkersInterviewView: React.FC<WorkersInterviewViewProps> = ({
  company,
  workers,
  workerInterviews,
  onSaveWorker,
  onDeleteWorker,
  onSaveWorkerInterview,
  onNavigate,
}) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('Todas');

  const [workerForm, setWorkerForm] = useState({
    fullName: '',
    role: '',
    area: WORKER_AREAS[3],
    tenure: '',
    reportsTo: '',
    phone: '',
    email: '',
  });

  const [draft, setDraft] = useState<WorkerInterview | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [notice, setNotice] = useState<string | null>(null);
  const dirtyRef = useRef(false);

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchesArea = areaFilter === 'Todas' || w.area === areaFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        w.fullName.toLowerCase().includes(q) ||
        w.role.toLowerCase().includes(q) ||
        w.area.toLowerCase().includes(q);
      return matchesArea && matchesSearch;
    });
  }, [workers, areaFilter, search]);

  useEffect(() => {
    if (!company) {
      setSelectedWorkerId('');
      setDraft(null);
      return;
    }
    if (workers.length > 0 && !workers.some((w) => w.id === selectedWorkerId)) {
      setSelectedWorkerId(workers[0].id);
    } else if (workers.length === 0) {
      setSelectedWorkerId('');
      setDraft(null);
    }
  }, [company?.id, workers, selectedWorkerId]);

  const activeWorker = workers.find((w) => w.id === selectedWorkerId);

  useEffect(() => {
    dirtyRef.current = false;
    setAutoSaveState('idle');
    if (!company || !activeWorker) {
      setDraft(null);
      return;
    }
    const existing = workerInterviews.find((wi) => wi.workerId === activeWorker.id);
    if (existing) {
      setDraft(existing);
    } else {
      const now = new Date().toISOString();
      setDraft({
        id: generateId('wi'),
        companyId: company.id,
        workerId: activeWorker.id,
        interviewerName: '',
        interviewDate: now.slice(0, 10),
        answers: {
          W1: `${activeWorker.fullName} - ${activeWorker.role}`,
          W2: activeWorker.area,
          W3: activeWorker.tenure,
        },
        status: 'borrador',
        createdAt: now,
        updatedAt: now,
      });
    }
  }, [activeWorker?.id, company?.id]);

  // Debounced auto-save for individual interview answers
  useEffect(() => {
    if (!draft || !dirtyRef.current) return;
    setAutoSaveState('saving');
    const timer = setTimeout(() => {
      onSaveWorkerInterview({
        ...draft,
        updatedAt: new Date().toISOString(),
      });
      dirtyRef.current = false;
      setAutoSaveState('saved');
    }, 650);
    return () => clearTimeout(timer);
  }, [draft]);

  const openCreateWorker = () => {
    setEditingWorkerId(null);
    setWorkerForm({
      fullName: '',
      role: '',
      area: WORKER_AREAS[3],
      tenure: '',
      reportsTo: '',
      phone: '',
      email: '',
    });
    setShowWorkerForm(true);
  };

  const openEditWorker = (w: Worker) => {
    setEditingWorkerId(w.id);
    setWorkerForm({
      fullName: w.fullName,
      role: w.role,
      area: w.area,
      tenure: w.tenure,
      reportsTo: w.reportsTo ?? '',
      phone: w.phone ?? '',
      email: w.email ?? '',
    });
    setShowWorkerForm(true);
  };

  const handleSubmitWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !workerForm.fullName.trim() || !workerForm.role.trim()) return;
    const now = new Date().toISOString();
    const existing = editingWorkerId ? workers.find((w) => w.id === editingWorkerId) : undefined;
    const saved: Worker = {
      id: existing ? existing.id : generateId('trab'),
      companyId: company.id,
      fullName: workerForm.fullName.trim(),
      role: workerForm.role.trim(),
      area: workerForm.area,
      tenure: workerForm.tenure.trim(),
      reportsTo: workerForm.reportsTo.trim(),
      phone: workerForm.phone.trim(),
      email: workerForm.email.trim(),
      isDemo: existing?.isDemo,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    onSaveWorker(saved);
    setSelectedWorkerId(saved.id);
    setShowWorkerForm(false);
    setEditingWorkerId(null);
  };

  const updateAnswer = (qId: string, val: AnswerValue) => {
    if (!draft) return;
    dirtyRef.current = true;
    setDraft({
      ...draft,
      answers: {
        ...draft.answers,
        [qId]: val,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const toggleMultiOption = (qId: string, option: string) => {
    if (!draft) return;
    const current = Array.isArray(draft.answers[qId]) ? (draft.answers[qId] as string[]) : [];
    const next = current.includes(option) ? current.filter((x) => x !== option) : [...current, option];
    updateAnswer(qId, next);
  };

  const handleSaveManual = (markCompleted = false) => {
    if (!draft) return;
    dirtyRef.current = false;
    const updated: WorkerInterview = {
      ...draft,
      status: markCompleted ? 'completada' : draft.status,
      updatedAt: new Date().toISOString(),
    };
    setDraft(updated);
    onSaveWorkerInterview(updated);
    setAutoSaveState('saved');
    setNotice(
      markCompleted
        ? `Entrevista individual de ${activeWorker?.fullName} marcada como completada.`
        : `Entrevista individual guardada.`
    );
    setTimeout(() => setNotice(null), 3500);
  };

  const visibleQuestions = useMemo(() => {
    if (!draft) return WORKER_INTERVIEW_QUESTIONS;
    return WORKER_INTERVIEW_QUESTIONS.filter((q) => isQuestionVisible(q, draft.answers));
  }, [draft]);

  const progress = useMemo(() => {
    if (!draft) return { answered: 0, total: visibleQuestions.length, pct: 0 };
    let answered = 0;
    for (const q of visibleQuestions) {
      const v = draft.answers[q.id];
      if (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '') {
        answered++;
      }
    }
    const total = visibleQuestions.length;
    return { answered, total, pct: total > 0 ? Math.round((answered / total) * 100) : 0 };
  }, [draft, visibleQuestions]);

  if (!company) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-4">
        <Users className="mx-auto h-10 w-10 text-slate-400" />
        <div>
          <h3 className="font-display text-lg font-semibold text-[#0B1E3B]">
            Registre una empresa para entrevistar trabajadores
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Cada trabajador registrado queda asociado a la empresa seleccionada.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('companies')}
          className="rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
        >
          Ir a Registro Empresarial
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
            Entrevista Individual por Trabajador
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Empresa: <span className="font-semibold text-slate-900">{company.name}</span> · Registre múltiples trabajadores y documente funciones, herramientas, tiempos y dificultades.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateWorker}
          className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] whitespace-nowrap cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Trabajador</span>
        </button>
      </div>

      {/* Create / Edit Worker Form */}
      {showWorkerForm && (
        <form onSubmit={handleSubmitWorker} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display text-base font-bold text-[#0B1E3B]">
              {editingWorkerId ? 'Editar Datos del Trabajador' : 'Nuevo Trabajador de la Empresa'}
            </h3>
            <button
              type="button"
              onClick={() => setShowWorkerForm(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre completo *</label>
              <input
                type="text"
                required
                value={workerForm.fullName}
                onChange={(e) => setWorkerForm({ ...workerForm, fullName: e.target.value })}
                placeholder="Ej. Andrés Felipe Torres"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo *</label>
              <input
                type="text"
                required
                value={workerForm.role}
                onChange={(e) => setWorkerForm({ ...workerForm, role: e.target.value })}
                placeholder="Ej. Auxiliar de Bodega"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Área de trabajo *</label>
              <select
                value={workerForm.area}
                onChange={(e) => setWorkerForm({ ...workerForm, area: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              >
                {WORKER_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Antigüedad</label>
              <input
                type="text"
                value={workerForm.tenure}
                onChange={(e) => setWorkerForm({ ...workerForm, tenure: e.target.value })}
                placeholder="Ej. 2 años y 4 meses"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jefe / Supervisa</label>
              <input
                type="text"
                value={workerForm.reportsTo}
                onChange={(e) => setWorkerForm({ ...workerForm, reportsTo: e.target.value })}
                placeholder="Ej. Coordinador Logístico"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={workerForm.phone}
                onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                placeholder="Opcional"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={workerForm.email}
                onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })}
                placeholder="Opcional"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowWorkerForm(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
            >
              {editingWorkerId ? 'Actualizar Trabajador' : 'Guardar Trabajador'}
            </button>
          </div>
        </form>
      )}

      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {workers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-[#0B1E3B]" />
          <h3 className="mt-3 font-display text-lg font-semibold text-[#0B1E3B]">
            No hay trabajadores registrados para {company.name}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Registre los trabajadores por cargo y área para realizar sus entrevistas individuales con autoguardado.
          </p>
          <button
            type="button"
            onClick={openCreateWorker}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar primer trabajador</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left column: Worker list & filters */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar trabajador o cargo..."
                  className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#0B1E3B] focus:outline-none"
              >
                <option value="Todas">Todas las áreas ({workers.length})</option>
                {WORKER_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pt-1">
                {filteredWorkers.map((w) => {
                  const wi = workerInterviews.find((item) => item.workerId === w.id);
                  const isActive = w.id === activeWorker?.id;
                  return (
                    <div
                      key={w.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        isActive
                          ? 'border-[#0B1E3B] bg-[#0B1E3B] text-white'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedWorkerId(w.id)}
                          className="flex-1 text-left cursor-pointer"
                        >
                          <div className="text-sm font-semibold">{w.fullName}</div>
                          <div className={`text-xs ${isActive ? 'text-slate-200' : 'text-slate-600'}`}>
                            {w.role}
                          </div>
                          <div className={`text-[11px] mt-0.5 ${isActive ? 'text-emerald-200' : 'text-slate-500'}`}>
                            {w.area} · {w.tenure || 'Antigüedad N/D'}
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditWorker(w)}
                            className={`rounded p-1 cursor-pointer ${
                              isActive ? 'text-slate-200 hover:bg-white/10' : 'text-slate-400 hover:text-slate-700'
                            }`}
                            title="Editar trabajador"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteWorker(w.id)}
                            className={`rounded p-1 cursor-pointer ${
                              isActive ? 'text-red-200 hover:bg-white/10' : 'text-slate-400 hover:text-red-600'
                            }`}
                            title="Eliminar trabajador"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className={`mt-2 text-[11px] font-medium ${isActive ? 'text-emerald-300' : 'text-[#15803D]'}`}>
                        {wi
                          ? wi.status === 'completada'
                            ? 'Entrevista completada'
                            : 'Borrador en curso'
                          : 'Sin entrevista iniciada'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column: Individual Interview Form */}
          {activeWorker && draft && (
            <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 space-y-5">
              <div className="border-b border-slate-100 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#0B1E3B]">
                    {activeWorker.fullName} — {activeWorker.role}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Área: <strong>{activeWorker.area}</strong> · Antigüedad: <strong>{activeWorker.tenure || '—'}</strong> · Supervisa: {activeWorker.reportsTo || '—'}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-semibold text-[#15803D] tabular-nums">
                    Avance: {progress.pct}% ({progress.answered}/{progress.total})
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {autoSaveState === 'saving'
                      ? 'Autoguardando...'
                      : autoSaveState === 'saved'
                      ? 'Guardado automático activo'
                      : `Estado: ${draft.status === 'completada' ? 'Completada' : 'Borrador'}`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Entrevistador</label>
                  <input
                    type="text"
                    value={draft.interviewerName}
                    onChange={(e) => {
                      dirtyRef.current = true;
                      setDraft({ ...draft, interviewerName: e.target.value });
                    }}
                    placeholder="Nombre del consultor / investigador"
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-[#0B1E3B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fecha de entrevista</label>
                  <input
                    type="date"
                    value={draft.interviewDate}
                    onChange={(e) => {
                      dirtyRef.current = true;
                      setDraft({ ...draft, interviewDate: e.target.value });
                    }}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono focus:border-[#0B1E3B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-5">
                {visibleQuestions.map((q) => {
                  const val = draft.answers[q.id];
                  return (
                    <div key={q.id} className="space-y-2 border-b border-slate-100 pb-5 last:border-b-0">
                      <label className="block text-sm font-semibold text-slate-900">
                        {q.number}. {q.label}
                        {q.conditionalOn && (
                          <span className="ml-2 text-[11px] font-normal text-[#15803D]">(Condicional)</span>
                        )}
                      </label>

                      {q.type === 'textarea' && (
                        <textarea
                          rows={3}
                          value={typeof val === 'string' ? val : ''}
                          onChange={(e) => updateAnswer(q.id, e.target.value)}
                          placeholder={q.placeholder}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                        />
                      )}

                      {q.type === 'text' && (
                        <input
                          type="text"
                          value={typeof val === 'string' ? val : ''}
                          onChange={(e) => updateAnswer(q.id, e.target.value)}
                          placeholder={q.placeholder}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                        />
                      )}

                      {(q.type === 'select' || q.type === 'yes_no_na') && (
                        <div className={`grid grid-cols-1 gap-2 ${q.type === 'yes_no_na' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                          {(q.options ?? ['Sí', 'No', 'No aplica']).map((opt) => {
                            const selected = val === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => updateAnswer(q.id, opt)}
                                className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                                  selected
                                    ? 'border-[#15803D] bg-emerald-50 text-[#0B1E3B]'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'multiselect' && q.options && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {q.options.map((opt) => {
                            const list = Array.isArray(val) ? (val as string[]) : [];
                            const checked = list.includes(opt);
                            return (
                              <label
                                key={opt}
                                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                                  checked
                                    ? 'border-[#15803D] bg-emerald-50 text-[#0B1E3B]'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleMultiOption(q.id, opt)}
                                  className="h-4 w-4 rounded border-slate-300 text-[#15803D]"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => handleSaveManual(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B1E3B] bg-white px-4 py-2 text-sm font-medium text-[#0B1E3B] hover:bg-slate-50 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar borrador</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveManual(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-5 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Finalizar Entrevista Individual</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
