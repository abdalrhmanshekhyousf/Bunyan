import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase.js'

// تصميم قاعدة البيانات المعدّل يدوياً (T6.7)؛ غير المعدّل يُولَّد من التحليل عند العرض
const ref = (projectId) => doc(db, 'projects', projectId, 'databaseDesigns', 'current')

export function watchDatabaseDesign(projectId, onData) {
  return onSnapshot(
    ref(projectId),
    (snap) => onData(snap.exists() ? snap.data() : null),
    () => onData(null),
  )
}

export function saveDatabaseDesign(projectId, { tables, analysisId, dialect }) {
  return setDoc(ref(projectId), {
    tables,
    analysisId,
    dialect,
    editedByUser: true,
    updatedAt: serverTimestamp(),
  })
}

export const resetDatabaseDesign = (projectId) => deleteDoc(ref(projectId))
