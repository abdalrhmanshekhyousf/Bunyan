import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase.js'

// إنشاء users/{uid} عند أول دخول بدور "user" (T2.8)؛ الدور لا يغيّره إلا المدير
export async function ensureUserDoc(user) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return
  await setDoc(ref, {
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    photoURL: user.photoURL ?? null,
    role: 'user',
    createdAt: serverTimestamp(),
  })
}

export async function register({ name, email, password }) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName: name })
  // لا نُفشل التسجيل إن تعذّر إنشاء المستند؛ يعيد AuthProvider المحاولة
  await ensureUserDoc({ ...user, displayName: name }).catch(() => {})
  return user
}

export async function login({ email, password }) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const { user } = await signInWithPopup(auth, provider)
  await ensureUserDoc(user)
  return user
}

export const resetPassword = (email) => sendPasswordResetEmail(auth, email)

export const logout = () => signOut(auth)
