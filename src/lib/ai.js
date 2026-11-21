import { getAI, getGenerativeModel, GoogleAIBackend, ThinkingLevel } from 'firebase/ai'
import { app } from './firebase.js'

// Firebase AI Logic مع Gemini Developer API (T4.3). لا مفتاح Gemini في الكود
export const ai = getAI(app, { backend: new GoogleAIBackend() })
export const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash'

// thinking منخفض: التفكير الافتراضي كان يستغرق أكثر من دقيقتين للتحليل الواحد
export function jsonModel({
  systemInstruction,
  schema,
  temperature = 0.3,
  thinking = ThinkingLevel.LOW,
}) {
  return getGenerativeModel(ai, {
    model: MODEL,
    systemInstruction,
    generationConfig: {
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
      temperature,
      thinkingConfig: { thinkingLevel: thinking },
    },
  })
}
