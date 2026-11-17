import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'workspace.json');

interface WorkspaceStore {
  companies: unknown[];
  interviews: unknown[];
  metrics: unknown[];
  improvementPlans: unknown[];
  aiReports: unknown[];
  customTargets: Record<string, Record<string, number>>;
  interviewSections?: unknown[];
  pageConfig?: Record<string, unknown>;
  customTabContents?: Record<string, unknown>;
}

const DEFAULT_STORE: WorkspaceStore = {
  companies: [],
  interviews: [],
  metrics: [],
  improvementPlans: [],
  aiReports: [],
  customTargets: {},
};

function ensureDb(): WorkspaceStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
    return { ...DEFAULT_STORE };
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<WorkspaceStore>;
    return {
      companies: Array.isArray(parsed.companies) ? parsed.companies : [],
      interviews: Array.isArray(parsed.interviews) ? parsed.interviews : [],
      metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
      improvementPlans: Array.isArray(parsed.improvementPlans) ? parsed.improvementPlans : [],
      aiReports: Array.isArray(parsed.aiReports) ? parsed.aiReports : [],
      customTargets: parsed.customTargets && typeof parsed.customTargets === 'object' ? parsed.customTargets : {},
      ...(Array.isArray(parsed.interviewSections) ? { interviewSections: parsed.interviewSections } : {}),
      ...(parsed.pageConfig && typeof parsed.pageConfig === 'object' ? { pageConfig: parsed.pageConfig } : {}),
      ...(parsed.customTabContents && typeof parsed.customTabContents === 'object'
        ? { customTabContents: parsed.customTabContents }
        : {}),
    };
  } catch {
    return { ...DEFAULT_STORE };
  }
}

function saveDb(store: WorkspaceStore): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

const app = express();
app.use(express.json({ limit: '10mb' }));

// Workspace state endpoints
app.get('/api/workspace', (_req, res) => {
  const data = ensureDb();
  res.json(data);
});

app.put('/api/workspace', (req, res) => {
  try {
    const body = req.body as Partial<WorkspaceStore>;
    const nextStore: WorkspaceStore = {
      companies: Array.isArray(body.companies) ? body.companies : [],
      interviews: Array.isArray(body.interviews) ? body.interviews : [],
      metrics: Array.isArray(body.metrics) ? body.metrics : [],
      improvementPlans: Array.isArray(body.improvementPlans) ? body.improvementPlans : [],
      aiReports: Array.isArray(body.aiReports) ? body.aiReports : [],
      customTargets: body.customTargets && typeof body.customTargets === 'object' ? body.customTargets : {},
      ...(Array.isArray(body.interviewSections) ? { interviewSections: body.interviewSections } : {}),
      ...(body.pageConfig && typeof body.pageConfig === 'object' ? { pageConfig: body.pageConfig } : {}),
      ...(body.customTabContents && typeof body.customTabContents === 'object'
        ? { customTabContents: body.customTabContents }
        : {}),
    };
    saveDb(nextStore);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Error al guardar la base de datos local.',
    });
  }
});

// Server-side Gemini AI Analysis endpoint
app.post('/api/ai/analyze', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(400).json({
      error:
        'La clave GEMINI_API_KEY no está configurada en el entorno del servidor. Configúrela en el panel Settings > Secrets para habilitar el análisis con IA.',
    });
    return;
  }

  try {
    const { company, interview, kpis, diagnostic, periodLabel } = req.body as {
      company: Record<string, unknown>;
      interview: Record<string, unknown> | null;
      kpis: Array<Record<string, unknown>>;
      diagnostic: Record<string, unknown>;
      periodLabel: string;
    };

    if (!company || !company.name) {
      res.status(400).json({ error: 'Debe proporcionar la información de la empresa para analizar.' });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptContext = JSON.stringify(
      {
        empresa: company,
        periodoAnalizado: periodLabel,
        entrevista: interview
          ? {
              titulo: interview.title,
              fecha: interview.interviewDate,
              estado: interview.status,
              tieneProduccion: interview.hasProductionProcess,
              respuestas: interview.answers,
            }
          : 'Sin entrevista registrada aún.',
        indicadoresCalculados: kpis.map((k) => ({
          nombre: k.name,
          area: k.area,
          resultado: k.formattedValue,
          meta: k.formattedTarget,
          cumplimientoPct: k.complianceLevel,
          estado: k.status,
          datosUsados: k.dataUsed,
        })),
        diagnosticoPreliminar: diagnostic,
      },
      null,
      2
    );

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Analiza únicamente los datos reales proporcionados de la empresa y genera un informe estructurado de recomendaciones logísticas y empresariales en español.\n\nDATOS DE LA EMPRESA:\n${promptContext}`,
      config: {
        systemInstruction:
          'Eres un consultor senior en administración de empresas, logística, cadena de suministro e indicadores de gestión (KPI). REGLA ESTRICTA: Basa todas tus interpretaciones, problemas, metas y recomendaciones exclusivamente en los datos, respuestas de entrevista e indicadores proporcionados. No inventes cifras ni asumas hechos que no estén en el contexto. Si un indicador dice "Información insuficiente para calcular", indícalo como una brecha de medición de datos.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: 'Resumen ejecutivo claro y concreto basado en la situación real de la empresa.',
            },
            kpiInterpretation: {
              type: Type.STRING,
              description: 'Interpretación conjunta de los indicadores calculados y brechas de datos.',
            },
            negativeResults: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de resultados negativos o indicadores por debajo de la meta detectados.',
            },
            criticalProcesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Procesos logísticos o administrativos que requieren atención prioritaria.',
            },
            logisticsStrategies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Estrategias logísticas y soluciones prácticas recomendadas para este caso.',
            },
            suggestedTargets: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Metas cuantitativas o de gestión sugeridas para el corto y mediano plazo.',
            },
            prioritizedActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  priority: { type: Type.STRING, description: 'Alta, Media o Baja' },
                  area: { type: Type.STRING, description: 'Área responsable' },
                  problem: { type: Type.STRING, description: 'Problema identificado' },
                  action: { type: Type.STRING, description: 'Acción de mejora concreta' },
                  objective: { type: Type.STRING, description: 'Objetivo medible de la acción' },
                  relatedKpi: { type: Type.STRING, description: 'Indicador KPI relacionado' },
                  suggestedTarget: { type: Type.STRING, description: 'Meta esperada' },
                  expectedImpact: { type: Type.STRING, description: 'Impacto operativo o financiero esperado' },
                },
                required: [
                  'priority',
                  'area',
                  'problem',
                  'action',
                  'objective',
                  'relatedKpi',
                  'suggestedTarget',
                  'expectedImpact',
                ],
              },
            },
            conclusions: {
              type: Type.STRING,
              description: 'Conclusiones finales del diagnóstico empresarial.',
            },
          },
          required: [
            'executiveSummary',
            'kpiInterpretation',
            'negativeResults',
            'criticalProcesses',
            'logisticsStrategies',
            'suggestedTargets',
            'prioritizedActions',
            'conclusions',
          ],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      res.status(502).json({ error: 'El modelo de IA devolvió una respuesta vacía.' });
      return;
    }

    const parsed = JSON.parse(rawText);
    res.json({
      ...parsed,
      periodLabel,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error en /api/ai/analyze:', error);
    const msg = error instanceof Error ? error.message : 'Error inesperado al consultar la IA.';
    res.status(500).json({ error: msg });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
