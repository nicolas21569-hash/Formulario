import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Edit3,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { INTERVIEW_SECTIONS } from '../data/interviewSchema';
import {
  AnswerValue,
  Company,
  Interview,
  InterviewQuestion,
  InterviewSection,
  QuestionType,
} from '../types/domain';
import { generateId } from '../utils/formatters';
import { NavSection } from './Sidebar';

interface InterviewViewProps {
  company: Company | undefined;
  interviews: Interview[];
  sections: InterviewSection[];
  onUpdateSections: (sections: InterviewSection[]) => void;
  onSaveInterview: (interview: Interview) => void;
  onDeleteInterview: (id: string) => void;
  onNavigate: (section: NavSection) => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  textarea: 'Párrafo abierto',
  text: 'Texto corto',
  select: 'Selección única',
  multiselect: 'Selección múltiple',
  yes_no_na: 'Sí / No / No aplica',
  number: 'Numérico',
};

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

export const InterviewView: React.FC<InterviewViewProps> = ({
  company,
  interviews,
  sections,
  onUpdateSections,
  onSaveInterview,
  onDeleteInterview,
  onNavigate,
}) => {
  const [editQuestionsMode, setEditQuestionsMode] = useState(false);
  const [activeInterviewId, setActiveInterviewId] = useState<string | null>(null);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [draft, setDraft] = useState<Interview | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const dirtyRef = useRef(false);

  // Local editable copy of sections while in question-editor mode
  const [editableSections, setEditableSections] = useState<InterviewSection[]>(sections);

  useEffect(() => {
    setEditableSections(sections);
  }, [sections]);

  useEffect(() => {
    if (sectionIdx >= sections.length && sections.length > 0) {
      setSectionIdx(sections.length - 1);
    }
  }, [sections.length, sectionIdx]);

  useEffect(() => {
    if (!company) {
      setActiveInterviewId(null);
      setDraft(null);
      return;
    }
    const existing = interviews.find((i) => i.id === activeInterviewId && i.companyId === company.id);
    if (existing) {
      setDraft(existing);
    } else if (interviews.length > 0) {
      setActiveInterviewId(interviews[0].id);
      setDraft(interviews[0]);
      setSectionIdx(0);
    } else {
      setActiveInterviewId(null);
      setDraft(null);
    }
  }, [company?.id, interviews.length]);

  const startNewInterview = () => {
    if (!company) return;
    const now = new Date().toISOString();
    const newInt: Interview = {
      id: generateId('ent'),
      companyId: company.id,
      title: `Entrevista Diagnóstico #${interviews.length + 1}`,
      interviewerName: '',
      interviewDate: now.slice(0, 10),
      hasProductionProcess: true,
      completedSections: [],
      answers: {},
      status: 'borrador',
      createdAt: now,
      updatedAt: now,
    };
    onSaveInterview(newInt);
    setActiveInterviewId(newInt.id);
    setDraft(newInt);
    setSectionIdx(0);
  };

  const selectExistingInterview = (id: string) => {
    const found = interviews.find((i) => i.id === id);
    if (found) {
      setActiveInterviewId(found.id);
      setDraft(found);
      setSectionIdx(0);
    }
  };

  const activeSectionsList = editQuestionsMode ? editableSections : sections;
  const safeSectionIdx = Math.min(sectionIdx, Math.max(0, activeSectionsList.length - 1));
  const currentSection = activeSectionsList[safeSectionIdx];

  useEffect(() => {
    if (!draft || !dirtyRef.current) return;
    setAutoSaveState('saving');
    const timer = setTimeout(() => {
      onSaveInterview({
        ...draft,
        updatedAt: new Date().toISOString(),
      });
      dirtyRef.current = false;
      setAutoSaveState('saved');
    }, 700);
    return () => clearTimeout(timer);
  }, [draft]);

  const progressStats = useMemo(() => {
    if (!draft) return { answered: 0, total: 0, pct: 0 };
    let answered = 0;
    let total = 0;
    for (const sec of sections) {
      if (sec.optional && !draft.hasProductionProcess) continue;
      for (const q of sec.questions) {
        if (!isQuestionVisible(q, draft.answers)) continue;
        total++;
        const v = draft.answers[q.id];
        if (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '') {
          answered++;
        }
      }
    }
    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { answered, total, pct };
  }, [draft, sections]);

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
    const next = current.includes(option)
      ? current.filter((x) => x !== option)
      : [...current, option];
    updateAnswer(qId, next);
  };

  const handleSaveProgress = (markCompleted = false, moveNext = false) => {
    if (!draft || !currentSection) return;
    const secCode = currentSection.code;
    const completedSections = draft.completedSections.includes(secCode)
      ? draft.completedSections
      : [...draft.completedSections, secCode];

    const updated: Interview = {
      ...draft,
      completedSections,
      status: markCompleted ? 'completada' : draft.status,
      updatedAt: new Date().toISOString(),
    };
    setDraft(updated);
    onSaveInterview(updated);
    setSavedNotice(
      markCompleted
        ? 'Entrevista marcada como completada y guardada.'
        : `Progreso de ${currentSection.title} guardado.`
    );
    setTimeout(() => setSavedNotice(null), 3500);

    if (moveNext && safeSectionIdx < sections.length - 1) {
      setSectionIdx(safeSectionIdx + 1);
    }
  };

  // --- QUESTION EDITOR HANDLERS ---
  const commitEditableSections = (next: InterviewSection[], message?: string) => {
    setEditableSections(next);
    onUpdateSections(next);
    if (message) {
      setSavedNotice(message);
      setTimeout(() => setSavedNotice(null), 3000);
    }
  };

  const updateSectionMeta = (idx: number, patch: Partial<InterviewSection>) => {
    const next = editableSections.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    setEditableSections(next);
  };

  const addNewSection = () => {
    const code = `S${editableSections.length + 1}`;
    const nextSection: InterviewSection = {
      code,
      title: `Sección ${code}. Nueva Sección Personalizada`,
      subtitle: 'Describa el enfoque de esta sección de entrevista.',
      optional: false,
      questions: [
        {
          id: generateId('q'),
          number: 1,
          label: 'Nueva pregunta abierta',
          type: 'textarea',
          placeholder: 'Escriba la respuesta...',
        },
      ],
    };
    const next = [...editableSections, nextSection];
    commitEditableSections(next, 'Nueva sección agregada al cuestionario.');
    setSectionIdx(next.length - 1);
  };

  const deleteSection = (idx: number) => {
    if (editableSections.length <= 1) return;
    const next = editableSections.filter((_, i) => i !== idx);
    commitEditableSections(next, 'Sección eliminada del cuestionario.');
    setSectionIdx(Math.max(0, idx - 1));
  };

  const updateQuestion = (sIdx: number, qIdx: number, patch: Partial<InterviewQuestion>) => {
    const next = editableSections.map((s, i) => {
      if (i !== sIdx) return s;
      const questions = s.questions.map((q, j) => {
        if (j !== qIdx) return q;
        const updatedQ = { ...q, ...patch };
        if (
          (updatedQ.type === 'select' || updatedQ.type === 'multiselect') &&
          (!updatedQ.options || updatedQ.options.length === 0)
        ) {
          updatedQ.options = ['Opción 1', 'Opción 2'];
        } else if (updatedQ.type === 'yes_no_na') {
          updatedQ.options = ['Sí', 'No', 'No aplica'];
        }
        return updatedQ;
      });
      return { ...s, questions };
    });
    setEditableSections(next);
  };

  const addQuestion = (sIdx: number) => {
    const next = editableSections.map((s, i) => {
      if (i !== sIdx) return s;
      const num = s.questions.length + 1;
      const newQ: InterviewQuestion = {
        id: `${s.code}${num}_${Date.now().toString(36).slice(-4)}`,
        number: num,
        label: 'Nueva pregunta',
        type: 'textarea',
        placeholder: 'Escriba su respuesta...',
      };
      return { ...s, questions: [...s.questions, newQ] };
    });
    commitEditableSections(next, 'Pregunta agregada.');
  };

  const deleteQuestion = (sIdx: number, qIdx: number) => {
    const next = editableSections.map((s, i) => {
      if (i !== sIdx) return s;
      const questions = s.questions
        .filter((_, j) => j !== qIdx)
        .map((q, idx) => ({ ...q, number: idx + 1 }));
      return { ...s, questions };
    });
    commitEditableSections(next, 'Pregunta eliminada.');
  };

  const moveQuestion = (sIdx: number, qIdx: number, dir: -1 | 1) => {
    const next = editableSections.map((s, i) => {
      if (i !== sIdx) return s;
      const target = qIdx + dir;
      if (target < 0 || target >= s.questions.length) return s;
      const copy = [...s.questions];
      [copy[qIdx], copy[target]] = [copy[target], copy[qIdx]];
      return {
        ...s,
        questions: copy.map((q, idx) => ({ ...q, number: idx + 1 })),
      };
    });
    commitEditableSections(next);
  };

  const resetDefaultQuestions = () => {
    commitEditableSections(INTERVIEW_SECTIONS, 'Cuestionario restablecido a las secciones originales A–J.');
    setSectionIdx(0);
  };

  if (!company && !editQuestionsMode) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-4">
        <ClipboardCheck className="mx-auto h-10 w-10 text-slate-400" />
        <div>
          <h3 className="font-display text-lg font-semibold text-[#0B1E3B]">
            Registre una empresa para iniciar entrevistas
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Seleccione o cree primero una empresa, o bien edite la plantilla de preguntas desde ahora.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('companies')}
            className="rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
          >
            Ir a Registro de Empresas
          </button>
          <button
            type="button"
            onClick={() => setEditQuestionsMode(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
            <span>Editar Preguntas del Cuestionario</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
            {editQuestionsMode ? 'Editor de Preguntas y Secciones' : 'Módulo de Entrevistas Estructuradas'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {editQuestionsMode ? (
              'Modifique, agregue, reordene o elimine secciones, preguntas y opciones de respuesta.'
            ) : (
              <>
                Empresa activa: <span className="font-semibold text-slate-900">{company?.name}</span> · {sections.length} secciones configuradas con guardado parcial.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setEditQuestionsMode(!editQuestionsMode)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              editQuestionsMode
                ? 'border-[#0B1E3B] bg-[#0B1E3B] text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Edit3 className="h-4 w-4" />
            <span>{editQuestionsMode ? 'Volver a Entrevista' : 'Editar Preguntas'}</span>
          </button>

          {!editQuestionsMode && company && (
            <>
              {interviews.length > 0 && (
                <select
                  value={draft?.id ?? ''}
                  onChange={(e) => selectExistingInterview(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-[#0B1E3B] focus:outline-none"
                >
                  {interviews.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title} ({i.status === 'completada' ? 'Completada' : 'Borrador'})
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={startNewInterview}
                className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] whitespace-nowrap cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Nueva Entrevista</span>
              </button>
            </>
          )}
        </div>
      </div>

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* QUESTIONNAIRE BUILDER MODE */}
      {editQuestionsMode ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-[#0B1E3B]">Secciones ({editableSections.length})</span>
                <button
                  type="button"
                  onClick={addNewSection}
                  className="inline-flex items-center gap-1 rounded bg-[#15803D] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#166534] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Sección</span>
                </button>
              </div>
              <div className="space-y-1 max-h-[480px] overflow-y-auto">
                {editableSections.map((sec, idx) => (
                  <button
                    key={sec.code + idx}
                    type="button"
                    onClick={() => setSectionIdx(idx)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                      idx === safeSectionIdx
                        ? 'bg-[#0B1E3B] text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate pr-2">{sec.title}</span>
                    <span className="font-mono text-[11px] shrink-0 opacity-80">
                      {sec.questions.length} preg.
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={resetDefaultQuestions}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restablecer preguntas originales</span>
              </button>
            </div>
          </div>

          {currentSection && (
            <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex-1 space-y-3 min-w-[260px]">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Código</label>
                      <input
                        type="text"
                        value={currentSection.code}
                        onChange={(e) => updateSectionMeta(safeSectionIdx, { code: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-mono focus:border-[#0B1E3B] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Título de la sección</label>
                      <input
                        type="text"
                        value={currentSection.title}
                        onChange={(e) => updateSectionMeta(safeSectionIdx, { title: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold focus:border-[#0B1E3B] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción / Subtítulo</label>
                    <input
                      type="text"
                      value={currentSection.subtitle}
                      onChange={(e) => updateSectionMeta(safeSectionIdx, { subtitle: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-[#0B1E3B] focus:outline-none"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentSection.optional)}
                      onChange={(e) => updateSectionMeta(safeSectionIdx, { optional: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-[#15803D]"
                    />
                    <span>Sección opcional (el entrevistado puede omitirla si no aplica)</span>
                  </label>
                </div>

                {editableSections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteSection(safeSectionIdx)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Eliminar sección</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {currentSection.questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#0B1E3B]">
                        Pregunta #{q.number}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveQuestion(safeSectionIdx, qIdx, -1)}
                          disabled={qIdx === 0}
                          className="rounded p-1 text-slate-500 hover:bg-white disabled:opacity-30 cursor-pointer"
                          title="Subir"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(safeSectionIdx, qIdx, 1)}
                          disabled={qIdx === currentSection.questions.length - 1}
                          className="rounded p-1 text-slate-500 hover:bg-white disabled:opacity-30 cursor-pointer"
                          title="Bajar"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteQuestion(safeSectionIdx, qIdx)}
                          className="rounded p-1 text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Eliminar pregunta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Texto de la pregunta
                        </label>
                        <input
                          type="text"
                          value={q.label}
                          onChange={(e) => updateQuestion(safeSectionIdx, qIdx, { label: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-[#0B1E3B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Tipo de respuesta
                        </label>
                        <select
                          value={q.type}
                          onChange={(e) =>
                            updateQuestion(safeSectionIdx, qIdx, { type: e.target.value as QuestionType })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-[#0B1E3B] focus:outline-none"
                        >
                          {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                            <option key={t} value={t}>
                              {QUESTION_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(q.type === 'text' || q.type === 'textarea' || q.type === 'number') && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Texto de ayuda (placeholder)
                          </label>
                          <input
                            type="text"
                            value={q.placeholder ?? ''}
                            onChange={(e) =>
                              updateQuestion(safeSectionIdx, qIdx, { placeholder: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                          />
                        </div>
                        {q.type === 'number' && (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Unidad (ej. unidades, días)
                            </label>
                            <input
                              type="text"
                              value={q.unit ?? ''}
                              onChange={(e) => updateQuestion(safeSectionIdx, qIdx, { unit: e.target.value })}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {(q.type === 'select' || q.type === 'multiselect') && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-600">
                            Opciones de respuesta
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuestion(safeSectionIdx, qIdx, {
                                options: [...(q.options ?? []), `Opción ${(q.options?.length ?? 0) + 1}`],
                              })
                            }
                            className="text-xs font-medium text-[#15803D] hover:underline cursor-pointer"
                          >
                            + Agregar opción
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {(q.options ?? []).map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const nextOpts = (q.options ?? []).map((x, k) =>
                                    k === oIdx ? e.target.value : x
                                  );
                                  updateQuestion(safeSectionIdx, qIdx, { options: nextOpts });
                                }}
                                className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const nextOpts = (q.options ?? []).filter((_, k) => k !== oIdx);
                                  updateQuestion(safeSectionIdx, qIdx, { options: nextOpts });
                                }}
                                className="rounded p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                                title="Quitar opción"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => addQuestion(safeSectionIdx)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B1E3B] bg-white px-4 py-2 text-sm font-medium text-[#0B1E3B] hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar Pregunta</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    commitEditableSections(
                      editableSections,
                      'Cambios del cuestionario guardados correctamente.'
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-5 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar Cambios de Preguntas</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : !draft ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <ClipboardCheck className="mx-auto h-10 w-10 text-[#0B1E3B]" />
          <h3 className="mt-3 font-display text-lg font-semibold text-[#0B1E3B]">
            Aún no hay entrevistas registradas para {company?.name}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Cree una entrevista para recopilar información administrativa, operativa y logística por secciones. Puede guardar avances parciales y continuar después.
          </p>
          <button
            type="button"
            onClick={startNewInterview}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Iniciar Entrevista Diagnóstica</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left rail: Interview metadata & Sections */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0B1E3B]">Datos de la entrevista</span>
                <button
                  type="button"
                  onClick={() => onDeleteInterview(draft.id)}
                  className="text-xs text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Título</label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Entrevistador</label>
                  <input
                    type="text"
                    value={draft.interviewerName}
                    onChange={(e) => setDraft({ ...draft, interviewerName: e.target.value })}
                    placeholder="Nombre"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-[#0B1E3B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={draft.interviewDate}
                    onChange={(e) => setDraft({ ...draft, interviewDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono focus:border-[#0B1E3B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Progress bar */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">Progreso de entrevista</span>
                  <span className="font-mono font-semibold text-[#15803D] tabular-nums">
                    {progressStats.pct}% ({progressStats.answered}/{progressStats.total})
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#15803D] transition-all duration-300"
                    style={{ width: `${progressStats.pct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Section stepper list */}
            <div className="rounded-xl border border-slate-200 bg-white p-2 space-y-1">
              {sections.map((sec, idx) => {
                const isActive = idx === safeSectionIdx;
                const isSkipped = sec.optional && !draft.hasProductionProcess;
                const answeredInSec = sec.questions.filter((q) => {
                  const v = draft.answers[q.id];
                  return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '';
                }).length;

                return (
                  <button
                    key={sec.code + idx}
                    type="button"
                    onClick={() => setSectionIdx(idx)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#0B1E3B] text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate pr-2">{sec.title}</span>
                    <span
                      className={`font-mono text-[11px] shrink-0 tabular-nums ${
                        isActive ? 'text-emerald-300' : 'text-slate-500'
                      }`}
                    >
                      {isSkipped ? 'Opcional' : `${answeredInSec}/${sec.questions.length}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Active Section Questions */}
          {currentSection && (
            <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#0B1E3B]">
                    {currentSection.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">{currentSection.subtitle}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap block">
                    Estado: {draft.status === 'completada' ? 'Completada' : 'Borrador en curso'}
                  </span>
                  <span className="text-[11px] text-[#15803D]">
                    {autoSaveState === 'saving'
                      ? 'Autoguardando...'
                      : autoSaveState === 'saved'
                      ? 'Guardado automático'
                      : ''}
                  </span>
                </div>
              </div>

              {currentSection.optional && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0B1E3B]">
                      Sección opcional
                    </p>
                    <p className="text-xs text-slate-600">
                      Desactive esta opción si no aplica para la operación actual de la empresa.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={draft.hasProductionProcess}
                      onChange={(e) => setDraft({ ...draft, hasProductionProcess: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-[#15803D]"
                    />
                    <span>Aplica esta sección</span>
                  </label>
                </div>
              )}

              {currentSection.optional && !draft.hasProductionProcess ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-600">
                  Esta sección está marcada como <strong>No aplica</strong> para {company?.name}. Puede continuar a la siguiente sección.
                </div>
              ) : (
                <div className="space-y-5">
                  {currentSection.questions
                    .filter((q) => isQuestionVisible(q, draft.answers))
                    .map((q) => {
                      const val = draft.answers[q.id];
                      return (
                        <div key={q.id} className="space-y-2 border-b border-slate-100 pb-5 last:border-b-0">
                          <label className="block text-sm font-semibold text-slate-900">
                            {q.number}. {q.label}
                            {q.conditionalOn && (
                              <span className="ml-2 text-[11px] font-normal text-[#15803D]">
                                (Pregunta condicional)
                              </span>
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

                          {q.type === 'number' && (
                            <div className="flex items-center gap-2 max-w-xs">
                              <input
                                type="number"
                                value={typeof val === 'number' ? val : ''}
                                onChange={(e) =>
                                  updateAnswer(q.id, e.target.value === '' ? undefined : Number(e.target.value))
                                }
                                placeholder={q.placeholder}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums focus:border-[#0B1E3B] focus:outline-none"
                              />
                              {q.unit && <span className="text-xs text-slate-500">{q.unit}</span>}
                            </div>
                          )}

                          {q.type === 'yes_no_na' && (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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

                          {q.type === 'select' && q.options && (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {q.options.map((opt) => {
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
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  disabled={safeSectionIdx === 0}
                  onClick={() => setSectionIdx(Math.max(0, safeSectionIdx - 1))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </button>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSaveProgress(false, false)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B1E3B] bg-white px-4 py-2 text-sm font-medium text-[#0B1E3B] hover:bg-slate-50 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>Guardar progreso</span>
                  </button>

                  {safeSectionIdx < sections.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => handleSaveProgress(false, true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
                    >
                      <span>Guardar y continuar</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSaveProgress(true, false)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-5 py-2 text-sm font-medium text-white hover:bg-[#166534] cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Finalizar Entrevista</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
