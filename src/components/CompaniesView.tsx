import React, { useMemo, useState } from 'react';
import {
  Building2,
  Check,
  Edit3,
  GitCompare,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { BusinessSector, Company, OrgPosition, WorkspaceData } from '../types/domain';
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
  'Alimentos y Productos para Mascotas',
  'Distribución',
  'Comercial',
  'Almacenamiento',
  'Transporte',
  'Servicios',
  'Industrial',
  'Restaurante',
  'Otro',
];

const AREA_SUGGESTIONS = [
  'Dirección / Gerencia',
  'Administración y Finanzas',
  'Compras y Abastecimiento',
  'Recepción y Almacén',
  'Almacenamiento e Inventarios',
  'Preparación de Pedidos y Operaciones',
  'Transporte y Distribución',
  'Ventas y Servicio al Cliente',
];

interface CompanyFormState {
  name: string;
  nit: string;
  economicActivity: string;
  sector: BusinessSector;
  address: string;
  city: string;
  representativeName: string;
  representativeRole: string;
  representativeDocument: string;
  representativePhone: string;
  representativeEmail: string;
  intervieweeName: string;
  intervieweeRole: string;
  intervieweeArea: string;
  intervieweeTenure: string;
  employeesCount: number;
  yearsOperating: string;
  hasOrgChart: 'Sí' | 'No' | 'En construcción';
  orgChartDescription: string;
  existingPositions: OrgPosition[];
  phone: string;
  email: string;
  registrationDate: string;
}

const EMPTY_FORM: CompanyFormState = {
  name: '',
  nit: '',
  economicActivity: 'Comercialización de alimentos y productos para mascotas',
  sector: 'Alimentos y Productos para Mascotas',
  address: '',
  city: '',
  representativeName: '',
  representativeRole: 'Representante Legal / Propietario',
  representativeDocument: '',
  representativePhone: '',
  representativeEmail: '',
  intervieweeName: '',
  intervieweeRole: '',
  intervieweeArea: '',
  intervieweeTenure: '',
  employeesCount: 1,
  yearsOperating: '',
  hasOrgChart: 'No',
  orgChartDescription: '',
  existingPositions: [],
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
  const [form, setForm] = useState<CompanyFormState>(EMPTY_FORM);
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
      representativeRole: company.representativeRole ?? 'Representante Legal / Propietario',
      representativeDocument: company.representativeDocument ?? '',
      representativePhone: company.representativePhone ?? '',
      representativeEmail: company.representativeEmail ?? '',
      intervieweeName: company.intervieweeName ?? '',
      intervieweeRole: company.intervieweeRole ?? '',
      intervieweeArea: company.intervieweeArea ?? '',
      intervieweeTenure: company.intervieweeTenure ?? '',
      employeesCount: company.employeesCount,
      yearsOperating: company.yearsOperating,
      hasOrgChart: company.hasOrgChart ?? 'No',
      orgChartDescription: company.orgChartDescription ?? '',
      existingPositions: company.existingPositions ?? [],
      phone: company.phone,
      email: company.email,
      registrationDate: company.registrationDate,
    });
    setErrorMsg(null);
    setShowForm(true);
  };

  const handleAddPosition = () => {
    setForm((prev) => ({
      ...prev,
      existingPositions: [
        ...prev.existingPositions,
        {
          id: generateId('pos'),
          positionTitle: '',
          area: 'Almacenamiento e Inventarios',
          employeesInRole: 1,
          reportsTo: '',
        },
      ],
    }));
  };

  const handleUpdatePosition = (id: string, patch: Partial<OrgPosition>) => {
    setForm((prev) => ({
      ...prev,
      existingPositions: prev.existingPositions.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };

  const handleRemovePosition = (id: string) => {
    setForm((prev) => ({
      ...prev,
      existingPositions: prev.existingPositions.filter((p) => p.id !== id),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.nit.trim() || !form.representativeName.trim()) {
      setErrorMsg('Por favor complete al menos el Nombre de la empresa, NIT y Nombre del representante legal.');
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
      existingPositions: form.existingPositions.filter((p) => p.positionTitle.trim() !== ''),
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
            Registro Empresarial y Estructura Organizacional
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Separe claramente representante legal, trabajador entrevistado, antigüedad, organigrama y cargos existentes.
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
          className="rounded-xl border border-slate-200 bg-white p-6 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#0B1E3B]">
                {editingId ? 'Editar Expediente Empresarial' : 'Formulario de Registro Empresarial'}
              </h3>
              <p className="text-xs text-slate-500">
                Complete los datos generales, del representante legal, del entrevistado principal y la estructura de cargos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
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

          {/* Bloque 1: Empresa */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold text-[#0B1E3B] border-b border-slate-100 pb-2">
              1. Identificación y Datos Generales de la Empresa
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre / Razón social *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Distribuidora PetSalud S.A.S."
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
                  placeholder="Ej. Comercialización de alimentos, snacks, medicamentos y accesorios para mascotas"
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
                  Antigüedad de la empresa
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número total de empleados
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono empresa</label>
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
                  Correo electrónico empresa
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
          </div>

          {/* Bloque 2: Representante Legal o Propietario */}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <h4 className="font-display text-sm font-bold text-[#0B1E3B]">
              2. Datos del Representante Legal o Propietario
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre completo del representante / propietario *
                </label>
                <input
                  type="text"
                  required
                  value={form.representativeName}
                  onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
                  placeholder="Ej. Ricardo Gómez Villalobos"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cargo / Calidad jurídica
                </label>
                <input
                  type="text"
                  value={form.representativeRole}
                  onChange={(e) => setForm({ ...form, representativeRole: e.target.value })}
                  placeholder="Ej. Representante Legal / Propietario"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Documento de identidad
                </label>
                <input
                  type="text"
                  value={form.representativeDocument}
                  onChange={(e) => setForm({ ...form, representativeDocument: e.target.value })}
                  placeholder="Ej. C.C. 79.642.118"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono del representante
                </label>
                <input
                  type="tel"
                  value={form.representativePhone}
                  onChange={(e) => setForm({ ...form, representativePhone: e.target.value })}
                  placeholder="Ej. +57 310 555 0100"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo electrónico del representante
                </label>
                <input
                  type="email"
                  value={form.representativeEmail}
                  onChange={(e) => setForm({ ...form, representativeEmail: e.target.value })}
                  placeholder="gerencia@empresa.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bloque 3: Trabajador Entrevistado Principal */}
          <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
            <h4 className="font-display text-sm font-bold text-[#15803D]">
              3. Datos del Trabajador Entrevistado Principal
            </h4>
            <p className="text-xs text-slate-600">
              Para entrevistar múltiples trabajadores por cargo, utilice además el módulo independiente{' '}
              <strong>Entrevista Individual</strong>.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del entrevistado
                </label>
                <input
                  type="text"
                  value={form.intervieweeName}
                  onChange={(e) => setForm({ ...form, intervieweeName: e.target.value })}
                  placeholder="Ej. Carolina Méndez"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cargo del trabajador
                </label>
                <input
                  type="text"
                  value={form.intervieweeRole}
                  onChange={(e) => setForm({ ...form, intervieweeRole: e.target.value })}
                  placeholder="Ej. Coordinadora Logística"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Área de trabajo
                </label>
                <input
                  type="text"
                  list="company-areas-list"
                  value={form.intervieweeArea}
                  onChange={(e) => setForm({ ...form, intervieweeArea: e.target.value })}
                  placeholder="Ej. Operaciones y Bodega"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Antigüedad del trabajador
                </label>
                <input
                  type="text"
                  value={form.intervieweeTenure}
                  onChange={(e) => setForm({ ...form, intervieweeTenure: e.target.value })}
                  placeholder="Ej. 4 años y 6 meses"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bloque 4: Organigrama y Cargos Existentes */}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-display text-sm font-bold text-[#0B1E3B]">
                  4. Organigrama y Cargos Existentes
                </h4>
                <p className="text-xs text-slate-500">
                  Indique la estructura jerárquica y los cargos reales registrados en la empresa.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPosition}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B1E3B] bg-white px-3 py-1.5 text-xs font-medium text-[#0B1E3B] hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Agregar Cargo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Tiene organigrama formal?
                </label>
                <select
                  value={form.hasOrgChart}
                  onChange={(e) =>
                    setForm({ ...form, hasOrgChart: e.target.value as 'Sí' | 'No' | 'En construcción' })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                >
                  <option value="Sí">Sí</option>
                  <option value="En construcción">En construcción</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción del organigrama / líneas de mando
                </label>
                <input
                  type="text"
                  value={form.orgChartDescription}
                  onChange={(e) => setForm({ ...form, orgChartDescription: e.target.value })}
                  placeholder="Ej. Gerencia General coordina Compras, Bodega/Despachos y Punto de Venta..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0B1E3B] focus:outline-none"
                />
              </div>
            </div>

            {form.existingPositions.length > 0 && (
              <div className="space-y-2 pt-2">
                {form.existingPositions.map((pos) => (
                  <div
                    key={pos.id}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-12 items-center rounded-lg border border-slate-200 bg-slate-50/70 p-2.5"
                  >
                    <input
                      type="text"
                      value={pos.positionTitle}
                      onChange={(e) => handleUpdatePosition(pos.id, { positionTitle: e.target.value })}
                      placeholder="Nombre del cargo"
                      className="sm:col-span-4 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      list="company-areas-list"
                      value={pos.area}
                      onChange={(e) => handleUpdatePosition(pos.id, { area: e.target.value })}
                      placeholder="Área"
                      className="sm:col-span-3 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="number"
                      min={1}
                      value={pos.employeesInRole}
                      onChange={(e) =>
                        handleUpdatePosition(pos.id, { employeesInRole: Number(e.target.value) || 1 })
                      }
                      title="Personas en este cargo"
                      className="sm:col-span-2 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono tabular-nums"
                    />
                    <input
                      type="text"
                      value={pos.reportsTo ?? ''}
                      onChange={(e) => handleUpdatePosition(pos.id, { reportsTo: e.target.value })}
                      placeholder="Reporta a"
                      className="sm:col-span-2 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePosition(pos.id)}
                      className="sm:col-span-1 justify-self-end rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      aria-label="Quitar cargo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <datalist id="company-areas-list">
              {AREA_SUGGESTIONS.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
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
          <div>
            <h3 className="font-display text-base font-semibold text-[#0B1E3B]">
              Comparación Directa entre Empresas
            </h3>
            <p className="text-xs text-slate-500">
              Marque hasta 4 empresas en la tabla inferior para contrastar sus indicadores clave.
            </p>
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
                {(comparedData[0]?.kpis ?? []).slice(0, 12).map((refKpi, idx) => (
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
                  <th className="px-4 py-3">Sector · Antigüedad</th>
                  <th className="px-4 py-3">Rep. Legal / Entrevistado</th>
                  <th className="px-4 py-3 text-right">Personal / Cargos</th>
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
                  const cWorkersCount = (workspace.workers ?? []).filter((w) => w.companyId === c.id).length;

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
                          NIT: {c.nit} · {c.city || '—'} · Org: {c.hasOrgChart || 'No'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        <div className="font-medium text-slate-800">{c.sector}</div>
                        <div>{c.yearsOperating || '—'}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        <div className="font-medium text-slate-800">Rep: {c.representativeName}</div>
                        <div>
                          Ent: {c.intervieweeName || '—'} ({c.intervieweeRole || '—'})
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs font-mono tabular-nums text-slate-800">
                        <div>{c.employeesCount} emp.</div>
                        <div className="text-slate-500">
                          {c.existingPositions?.length ?? 0} cargos · {cWorkersCount} trab.
                        </div>
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
                              onNavigate('workers');
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#0B1E3B] hover:text-[#15803D] hover:underline whitespace-nowrap cursor-pointer"
                          >
                            <Users className="h-3.5 w-3.5" />
                            <span>Trabajadores</span>
                          </button>
                          <span className="text-slate-300">|</span>
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
