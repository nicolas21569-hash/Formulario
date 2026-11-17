import React, { useMemo, useState } from 'react';
import {
  Building2,
  Check,
  Edit3,
  GitCompare,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { BusinessSector, Company, WorkspaceData } from '../types/domain';
import { generateId } from '../utils/formatters';
import { calculateKPIs, getOverallCompliance } from '../utils/kpiEngine';
import { NavSection } from './Sidebar';

interface CompaniesViewProps {
  workspace: WorkspaceData;
  selectedCompanyId: string;
  onSelectCompany: (id: string) => void;
  onSaveCompany: (company: Company) => void;
  onDeleteCompany: (id: string) => void;
  onNavigate: (section: NavSection) => void;
}

const SECTORS: BusinessSector[] = [
  'Comercial',
  'Industrial',
  'Restaurante',
  'Transporte',
  'Almacenamiento',
  'Servicios',
  'Distribución',
  'Otro',
];

const EMPTY_FORM: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  nit: '',
  economicActivity: '',
  sector: 'Comercial',
  address: '',
  city: '',
  representativeName: '',
  intervieweeRole: '',
  employeesCount: 1,
  yearsOperating: '',
  phone: '',
  email: '',
  registrationDate: new Date().toISOString().slice(0, 10),
};

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  workspace,
  selectedCompanyId,
  onSelectCompany,
  onSaveCompany,
  onDeleteCompany,
  onNavigate,
}) => {
  const [showForm, setShowForm] = useState(workspace.companies.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('Todos');
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredCompanies = useMemo(() => {
    return workspace.companies.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.nit.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase()) ||
        c.representativeName.toLowerCase().includes(search.toLowerCase());
      const matchesSector = sectorFilter === 'Todos' || c.sector === sectorFilter;
      return matchesSearch && matchesSector;
    });
  }, [workspace.companies, search, sectorFilter]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, registrationDate: new Date().toISOString().slice(0, 10) });
    setErrorMsg(null);
    setShowForm(true);
  };

  const handleOpenEdit = (company: Company) => {
    setEditingId(company.id);
    setForm({
      name: company.name,
      nit: company.nit,
      economicActivity: company.economicActivity,
      sector: company.sector,
      address: company.address,
      city: company.city,
      representativeName: company.representativeName,
      intervieweeRole: company.intervieweeRole,
      employeesCount: company.employeesCount,
      yearsOperating: company.yearsOperating,
      phone: company.phone,
      email: company.email,
      registrationDate: company.registrationDate,
    });
    setErrorMsg(null);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.nit.trim() || !form.representativeName.trim()) {
      setErrorMsg('Por favor complete al menos el Nombre de la empresa, NIT y Nombre del representante.');
      return;
    }

    const now = new Date().toISOString();
    const existing = editingId ? workspace.companies.find((c) => c.id === editingId) : undefined;
    const saved: Company = {
      ...form,
      id: existing ? existing.id : generateId('emp'),
      name: form.name.trim(),
      nit: form.nit.trim(),
      employeesCount: Number(form.employeesCount) || 0,
      isDemo: existing?.isDemo,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    onSaveCompany(saved);
    onSelectCompany(saved.id);
    setShowForm(false);
    setEditingId(null);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const comparedData = useMemo(() => {
    const targetIds = compareIds.length > 0 ? compareIds : workspace.companies.slice(0, 3).map((c) => c.id);
    return targetIds
      .map((id) => {
        const c = workspace.companies.find((x) => x.id === id);
        if (!c) return null;
        const cMetrics = workspace.metrics.filter((m) => m.companyId === id);
        const kpis = calculateKPIs(cMetrics, workspace.customTargets[id]);
        const overall = getOverallCompliance(kpis);
        return { company: c, kpis, overall };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [compareIds, workspace]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0B1E3B]">
            Registro y Directorio de Empresas
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Administre múltiples empresas de cualquier sector, consulte sus expedientes y compare resultados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {workspace.companies.length >= 2 && (
            <button
              type="button"
              onClick={() => setCompareMode(!compareMode)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                compareMode
                  ? 'border-[#0B1E3B] bg-[#0B1E3B] text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <GitCompare className="h-4 w-4" />
              <span>{compareMode ? 'Cerrar Comparador' : 'Comparar Empresas'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-4 py-2 text-sm font-medium text-white hover:bg-[#166534] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Empresa</span>
          </button>
        </div>
      </div>

      {/* Registration / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#0B1E3B]">
                {editingId ? 'Editar Información de Empresa' : 'Formulario de Registro Empresarial'}
              </h3>
              <p className="text-xs text-slate-500">
                Complete los datos generales de identificación y contacto de la organización.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar formulario"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de la empresa *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Logística del Valle S.A.S."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NIT *</label>
              <input
                type="text"
                required
                value={form.nit}
                onChange={(e) => setForm({ ...form, nit: e.target.value })}
                placeholder="Ej. 901.234.567-8"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sector empresarial *
              </label>
              <select
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value as BusinessSector })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Actividad económica
              </label>
              <input
                type="text"
                value={form.economicActivity}
                onChange={(e) => setForm({ ...form, economicActivity: e.target.value })}
                placeholder="Ej. Fabricación y comercialización de productos alimenticios"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ej. Medellín"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Ej. Cra 45 # 12-30"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del representante *
              </label>
              <input
                type="text"
                required
                value={form.representativeName}
                onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
                placeholder="Ej. Juan Carlos Gómez"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo del entrevistado
              </label>
              <input
                type="text"
                value={form.intervieweeRole}
                onChange={(e) => setForm({ ...form, intervieweeRole: e.target.value })}
                placeholder="Ej. Director de Operaciones"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de empleados
              </label>
              <input
                type="number"
                min={1}
                value={form.employeesCount}
                onChange={(e) => setForm({ ...form, employeesCount: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tiempo de funcionamiento
              </label>
              <input
                type="text"
                value={form.yearsOperating}
                onChange={(e) => setForm({ ...form, yearsOperating: e.target.value })}
                placeholder="Ej. 8 años"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Ej. +57 300 123 4567"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contacto@empresa.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de registro
              </label>
              <input
                type="date"
                value={form.registrationDate}
                onChange={(e) => setForm({ ...form, registrationDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-[#0B1E3B] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
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
              <span>{editingId ? 'Actualizar Empresa' : 'Guardar Empresa'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Company Comparison View */}
      {compareMode && workspace.companies.length >= 2 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
                Comparación Directa entre Empresas
              </h3>
              <p className="text-xs text-slate-500">
                Marque hasta 4 empresas en la tabla inferior para contrastar sus indicadores clave.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Indicador / Métrica</th>
                  {comparedData.map(({ company }) => (
                    <th key={company.id} className="px-4 py-2.5 font-semibold text-right">
                      {company.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-2.5 font-medium text-slate-700">Sector · Empleados</td>
                  {comparedData.map(({ company }) => (
                    <td key={company.id} className="px-4 py-2.5 text-right text-slate-600 tabular-nums">
                      {company.sector} · {company.employeesCount}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-2.5 font-semibold text-[#0B1E3B]">Cumplimiento General</td>
                  {comparedData.map(({ company, overall }) => (
                    <td key={company.id} className="px-4 py-2.5 text-right font-mono font-bold text-[#15803D] tabular-nums">
                      {overall !== null ? `${overall}%` : 'Sin datos'}
                    </td>
                  ))}
                </tr>
                {(comparedData[0]?.kpis ?? []).slice(0, 10).map((refKpi, idx) => (
                  <tr key={refKpi.id}>
                    <td className="px-4 py-2 text-slate-700">{refKpi.name}</td>
                    {comparedData.map(({ company, kpis }) => {
                      const k = kpis[idx];
                      return (
                        <td
                          key={company.id}
                          className="px-4 py-2 text-right font-mono tabular-nums text-slate-800"
                        >
                          {k?.value !== null ? k.formattedValue : 'Insuficiente'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {workspace.companies.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, NIT, ciudad o representante..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#0B1E3B] focus:outline-none"
            >
              <option value="Todos">Todos los sectores</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Companies Directory Table */}
      {filteredCompanies.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <Building2 className="mx-auto h-9 w-9 text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            No se encontraron empresas registradas con ese criterio.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  {compareMode && <th className="px-4 py-3 w-10">Comp.</th>}
                  <th className="px-5 py-3">Empresa y NIT</th>
                  <th className="px-4 py-3">Sector · Ciudad</th>
                  <th className="px-4 py-3">Representante y Cargo</th>
                  <th className="px-4 py-3 text-right">Empleados</th>
                  <th className="px-4 py-3 text-right">Cumplimiento</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompanies.map((c) => {
                  const isSelected = c.id === selectedCompanyId;
                  const cKpis = calculateKPIs(
                    workspace.metrics.filter((m) => m.companyId === c.id),
                    workspace.customTargets[c.id]
                  );
                  const comp = getOverallCompliance(cKpis);

                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {compareMode && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={compareIds.includes(c.id)}
                            onChange={() => toggleCompare(c.id)}
                            aria-label={`Comparar ${c.name}`}
                            className="h-4 w-4 rounded border-slate-300 text-[#15803D]"
                          />
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectCompany(c.id)}
                            className="font-semibold text-[#0B1E3B] hover:text-[#15803D] text-left cursor-pointer"
                          >
                            {c.name}
                          </button>
                          {isSelected && (
                            <span className="text-xs font-medium text-[#15803D]">· Activa</span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          NIT: {c.nit} · Reg: {c.registrationDate}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        <div className="font-medium text-slate-800">{c.sector}</div>
                        <div>{c.city || '—'} · {c.yearsOperating || '—'}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        <div className="font-medium text-slate-800">{c.representativeName}</div>
                        <div>{c.intervieweeRole || '—'} · {c.phone || c.email || '—'}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-800">
                        {c.employeesCount}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums">
                        {comp !== null ? (
                          <span className={comp >= 85 ? 'text-[#15803D]' : 'text-amber-600'}>
                            {comp}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCompany(c.id);
                              onNavigate('interviews');
                            }}
                            className="text-xs font-medium text-[#15803D] hover:underline whitespace-nowrap cursor-pointer"
                          >
                            Entrevistas
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCompany(c.id);
                              onNavigate('diagnostic');
                            }}
                            className="text-xs font-medium text-[#0B1E3B] hover:underline whitespace-nowrap cursor-pointer"
                          >
                            Diagnóstico
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                            aria-label={`Editar ${c.name}`}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCompany(c.id)}
                            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            aria-label={`Eliminar ${c.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
