import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.js'

// المخططات المعدّلة يدوياً فقط تُحفظ (T5.7)؛ غير المعدّل يُولَّد من التحليل عند العرض
export function watchDiagrams(projectId, onData) {
  return onSnapshot(
    collection(db, 'projects', projectId, 'diagrams'),
    (snap) => onData(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),
    () => onData({}),
  )
}

export function saveDiagram(projectId, type, { code, analysisId }) {
  return setDoc(doc(db, 'projects', projectId, 'diagrams', type), {
    type,
    code,
    analysisId,
    editedByUser: true,
    updatedAt: serverTimestamp(),
  })
}

// «إعادة التوليد من التحليل» (T5.9) = حذف النسخة المعدّلة
export const resetDiagram = (projectId, type) =>
  deleteDoc(doc(db, 'projects', projectId, 'diagrams', type))
