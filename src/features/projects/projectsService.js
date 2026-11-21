import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase.js'

// خدمة المشاريع (T3.1)
const projectsCol = collection(db, 'projects')
export const SUBCOLLECTIONS = ['analyses', 'diagrams', 'databaseDesigns', 'reports']
export const MAX_DESCRIPTION = 5000

export async function createProject(ownerId, { title, description = '', language = 'ar' }) {
  const ref = await addDoc(projectsCol, {
    ownerId,
    title: title.trim(),
    description,
    language,
    status: 'draft',
    isShared: false,
    currentVersion: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export function updateProject(id, data) {
  return updateDoc(doc(db, 'projects', id), { ...data, updatedAt: serverTimestamp() })
}

// حذف المشروع مع مجموعاته الفرعية في دفعة واحدة (T3.7)
export async function deleteProject(id) {
  const batch = writeBatch(db)
  for (const sub of SUBCOLLECTIONS) {
    const snap = await getDocs(collection(db, 'projects', id, sub))
    snap.forEach((d) => batch.delete(d.ref))
  }
  batch.delete(doc(db, 'projects', id))
  await batch.commit()
}

// استماع لحظي لمشاريع المستخدم (T3.2). الترتيب بالأحدث يتم محلياً فلا يحتاج فهرساً مركّباً
const millis = (p) => p.updatedAt?.toMillis?.() ?? Date.now()
export function watchUserProjects(uid, onData, onError) {
  const q = query(projectsCol, where('ownerId', '==', uid))
  return onSnapshot(
    q,
    (snap) =>
      onData(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => millis(b) - millis(a)),
      ),
    onError,
  )
}

export function watchProject(id, onData, onError) {
  return onSnapshot(
    doc(db, 'projects', id),
    (snap) => onData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError,
  )
}

export const setShared = (id, isShared) => updateProject(id, { isShared })
