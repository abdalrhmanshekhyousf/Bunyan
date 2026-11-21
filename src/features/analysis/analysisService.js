import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase.js'
import { jsonModel, MODEL } from '@/lib/ai.js'
import { analysisJsonSchema, analysisSchema } from './schema.js'
import { designInstruction, designPrompt, systemInstruction, userPrompt } from './prompt.js'
import { designJsonSchema, parseDesign } from './designSchema.js'

export const DEFAULT_DAILY_LIMIT = 10

// أخطاء مفهومة للمستخدم (T4.9 + T4.13)
export class AnalysisError extends Error {
  constructor(kind, message) {
    super(message)
    this.kind = kind
  }
}

function toAnalysisError(e) {
  if (e instanceof AnalysisError) return e
  const msg = String(e?.message ?? '')
  if (!navigator.onLine || /network|fetch failed|Failed to fetch/i.test(msg))
    return new AnalysisError('network', 'انقطع الاتصال بالإنترنت. تحقّق من اتصالك ثم أعد المحاولة.')
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(msg))
    return new AnalysisError(
      'quota',
      'انتهت الحصة المجانية لخدمة Gemini مؤقتاً. أعد المحاولة بعد دقائق.',
    )
  if (/App Check|401|403|PERMISSION_DENIED/i.test(msg))
    return new AnalysisError('auth', 'تعذّر التحقق من التطبيق لدى خدمة الذكاء الاصطناعي.')
  if (/SAFETY|blocked/i.test(msg))
    return new AnalysisError(
      'safety',
      'رفضت خدمة الذكاء الاصطناعي هذا الوصف. عدّل صياغته ثم أعد المحاولة.',
    )
  return new AnalysisError('unknown', 'تعذّر إكمال التحليل. أعد المحاولة.')
}

// ── حدّ الاستخدام اليومي (T4.11 + T4.12) ───────────────────────────────
// اليوم عدد صحيح بتوقيت UTC (20261121)، وتتحقق قواعد الأمان منه بـ request.time
export const todayKey = (d = new Date()) =>
  d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()

export async function getDailyLimit() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'limits'))
    return snap.data()?.dailyAnalyses ?? DEFAULT_DAILY_LIMIT
  } catch {
    return DEFAULT_DAILY_LIMIT
  }
}

export function watchUsage(uid, onData) {
  return onSnapshot(
    doc(db, 'usage', uid),
    (snap) => {
      const u = snap.data()
      onData(u?.day === todayKey() ? u.count : 0)
    },
    () => onData(0),
  )
}

async function consumeQuota(uid, dailyLimit) {
  const ref = doc(db, 'usage', uid)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const day = todayKey()
    const prev = snap.data()
    const count = prev?.day === day ? prev.count : 0
    if (count >= dailyLimit)
      throw new AnalysisError(
        'limit',
        `وصلت إلى حدّك اليومي (${dailyLimit} تحليلات). يتجدد الرصيد غداً.`,
      )
    tx.set(ref, { day, count: count + 1, updatedAt: serverTimestamp() })
  })
}

// ── التحليل (T4.6) ───────────────────────────────────────────────────
export async function analyzeDescription(description, language = 'ar', onStage = () => {}) {
  const model = jsonModel({
    systemInstruction: systemInstruction(language),
    schema: analysisJsonSchema,
  })
  let lastError
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      onStage(attempt === 1 ? 'thinking' : 'retrying')
      const result = await model.generateContent(userPrompt(description))
      onStage('validating')
      const raw = JSON.parse(result.response.text())
      const analysis = analysisSchema.parse(raw)
      if (!analysis.entities.length && !analysis.functions.length)
        throw new AnalysisError(
          'empty',
          'لم يُستخرج من الوصف ما يكفي. أضف تفاصيل عن المستخدمين والبيانات.',
        )
      return analysis
    } catch (e) {
      lastError = e
      // لا نعيد المحاولة في الأخطاء التي لن تتغير بالإعادة
      const kind = toAnalysisError(e).kind
      if (e instanceof AnalysisError || ['network', 'auth', 'safety'].includes(kind)) break
    }
  }
  throw toAnalysisError(lastError)
}

// الاستدعاء الثاني: بيانات المخططات الإضافية. فشله لا يُفشل التحليل
export async function generateDesign(analysis, language = 'ar') {
  const model = jsonModel({
    systemInstruction: designInstruction(language),
    schema: designJsonSchema,
  })
  const result = await model.generateContent(designPrompt(analysis))
  return parseDesign(
    JSON.parse(result.response.text()),
    analysis.entities.map((e) => e.name),
  )
}

// تحليل كامل: حجز من الحصة، ثم الاستدعاء، ثم الحفظ كإصدار جديد (T4.7)
export async function runAnalysis({ project, uid, onStage }) {
  const dailyLimit = await getDailyLimit()
  await consumeQuota(uid, dailyLimit).catch((e) => {
    throw e instanceof AnalysisError ? e : toAnalysisError(e)
  })
  const projectRef = doc(db, 'projects', project.id)
  await updateDoc(projectRef, { status: 'analyzing' })
  try {
    const data = await analyzeDescription(project.description, project.language, onStage)
    onStage?.('saving')
    const version = (project.currentVersion ?? 0) + 1
    const ref = await addDoc(collection(projectRef, 'analyses'), {
      version,
      data,
      model: MODEL,
      source: 'ai',
      descriptionSnapshot: project.description,
      designStatus: 'pending',
      createdAt: serverTimestamp(),
    })
    await updateDoc(projectRef, {
      status: 'analyzed',
      currentVersion: version,
      currentAnalysisId: ref.id,
      updatedAt: serverTimestamp(),
    })
    // المخططات الإضافية تُولَّد في الخلفية (قرابة دقيقة) فلا ينتظرها المستخدم
    fillDesign(ref, data, project.language)
    return ref.id
  } catch (e) {
    await updateDoc(projectRef, { status: project.currentAnalysisId ? 'analyzed' : 'error' }).catch(
      () => {},
    )
    throw toAnalysisError(e)
  }
}

// حفظ تعديلات المستخدم كإصدار جديد (T4.8) — فيبقى سجل الإصدارات كاملاً
export async function saveEditedAnalysis(project, data) {
  const projectRef = doc(db, 'projects', project.id)
  const clean = analysisSchema.parse(data)
  const version = (project.currentVersion ?? 0) + 1
  const ref = await addDoc(collection(projectRef, 'analyses'), {
    version,
    data: clean,
    model: null,
    source: 'user',
    createdAt: serverTimestamp(),
  })
  await updateDoc(projectRef, {
    status: 'analyzed',
    currentVersion: version,
    currentAnalysisId: ref.id,
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

function fillDesign(ref, data, language) {
  return generateDesign(data, language)
    .then((design) => updateDoc(ref, { 'data.design': design, designStatus: 'done' }))
    .catch((e) => {
      console.warn('generateDesign:', e)
      return updateDoc(ref, { designStatus: 'error' }).catch(() => {})
    })
}

// توليد المخططات الإضافية لتحليل لا يحويها (قديم أو فشل توليدها). يُحتسب من الحصة
export async function addDesignToAnalysis({ project, uid, analysis }) {
  await consumeQuota(uid, await getDailyLimit()).catch((e) => {
    throw e instanceof AnalysisError ? e : toAnalysisError(e)
  })
  const ref = doc(db, 'projects', project.id, 'analyses', analysis.id)
  await updateDoc(ref, { designStatus: 'pending' })
  await fillDesign(ref, analysis.data, project.language)
}

// الرجوع إلى إصدار سابق (T4.10)
export function restoreVersion(project, analysis) {
  return updateDoc(doc(db, 'projects', project.id), {
    currentAnalysisId: analysis.id,
    updatedAt: serverTimestamp(),
  })
}

export function watchAnalyses(projectId, onData, onError) {
  const q = query(
    collection(db, 'projects', projectId, 'analyses'),
    orderBy('version', 'desc'),
    limit(30),
  )
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError)
}
