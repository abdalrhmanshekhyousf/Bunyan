import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase.js'
import { SUBCOLLECTIONS } from '@/features/projects/projectsService.js'

// خدمات لوحة المدير (المرحلة 8)

const millis = (ts) => ts?.toMillis?.() ?? Date.now()

// الإحصاءات (T8.3): العدّ على الخادم فلا تُنزَّل المستندات نفسها.
// كل عدّ مستقل، فإن فشل أحدها يبقى الباقي
export async function getStats() {
  const sources = {
    users: collection(db, 'users'),
    projects: collection(db, 'projects'),
    analyses: collectionGroup(db, 'analyses'),
    templates: collection(db, 'templates'),
  }
  const entries = await Promise.all(
    Object.entries(sources).map(async ([key, q]) => {
      try {
        const snap = await getCountFromServer(q)
        return [key, snap.data().count]
      } catch (e) {
        console.error(`getStats(${key}):`, e.code, e.message)
        return [key, null]
      }
    }),
  )
  return Object.fromEntries(entries)
}

// المستخدمون (T8.2): الأحدث أولاً
export function watchUsers(onData, onError) {
  return onSnapshot(
    collection(db, 'users'),
    (snap) =>
      onData(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          // مستند بلا تاريخ إنشاء (قديم أو ناقص) يأتي في الآخر
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)),
      ),
    onError,
  )
}

// القواعد تمنع المدير من تغيير دوره هو
export const setUserRole = (uid, role) => updateDoc(doc(db, 'users', uid), { role })

// الحظر: تمنع القواعد المحظور من كل كتابة ومن قراءة المشاريع، ويُسجَّل خروجه من التطبيق
export const setUserBanned = (uid, banned) =>
  updateDoc(doc(db, 'users', uid), { banned, bannedAt: banned ? serverTimestamp() : null })

// الحذف: يُحظر المستخدم أولاً (فالقواعد لا تسمح للمدير بحذف بيانات مستخدم نشط)،
// ثم تُحذف مشاريعه بمجموعاتها الفرعية وعدّاد استخدامه، ويبقى مستنده موسوماً «محذوف» بلا اسم
// كي لا يعود بالحساب نفسه. حساب الدخول في Firebase Authentication يحتاج خادماً لحذفه
export async function deleteUserData(uid, { banned }) {
  if (!banned) await setUserBanned(uid, true)
  const projects = await getDocs(query(collection(db, 'projects'), where('ownerId', '==', uid)))
  // دفعة لكل مشروع، كي لا تتجاوز حدّ عمليات الدفعة الواحدة
  for (const p of projects.docs) {
    const batch = writeBatch(db)
    for (const sub of SUBCOLLECTIONS) {
      const snap = await getDocs(collection(db, 'projects', p.id, sub))
      snap.forEach((d) => batch.delete(d.ref))
    }
    batch.delete(p.ref)
    await batch.commit()
  }
  await deleteDoc(doc(db, 'usage', uid))
  await updateDoc(doc(db, 'users', uid), {
    deleted: true,
    deletedAt: serverTimestamp(),
    displayName: '',
    photoURL: null,
  })
  return projects.size
}

// القوالب (T8.4)
const templatesCol = collection(db, 'templates')

const sortTemplates = (snap) =>
  snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => millis(b.updatedAt) - millis(a.updatedAt))

export function watchTemplates(onData, onError) {
  return onSnapshot(templatesCol, (snap) => onData(sortTemplates(snap)), onError)
}

// للمستخدم العادي: المنشور فقط (القواعد ترفض غيره)
export function watchPublishedTemplates(onData, onError) {
  return onSnapshot(
    query(templatesCol, where('published', '==', true)),
    (snap) => onData(sortTemplates(snap)),
    onError,
  )
}

const clean = ({ title, description, language, published }) => ({
  title: title.trim(),
  description,
  language,
  published: !!published,
})

export async function createTemplate(data) {
  const ref = await addDoc(templatesCol, {
    ...clean(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export const updateTemplate = (id, data) =>
  updateDoc(doc(db, 'templates', id), { ...data, updatedAt: serverTimestamp() })

export const saveTemplate = (id, data) => updateTemplate(id, clean(data))

export const setTemplatePublished = (id, published) => updateTemplate(id, { published })

export const deleteTemplate = (id) => deleteDoc(doc(db, 'templates', id))
