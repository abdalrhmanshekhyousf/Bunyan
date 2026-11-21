import i18n from '@/lib/i18n.js'

// رسائل أخطاء Firebase مترجمة (T2.7). المفاتيح في locales/*/auth.json تحت errors
const keys = {
  'auth/invalid-credential': 'invalidCredential',
  'auth/wrong-password': 'invalidCredential',
  'auth/user-not-found': 'userNotFound',
  'auth/invalid-email': 'invalidEmail',
  'auth/email-already-in-use': 'emailInUse',
  'auth/weak-password': 'weakPassword',
  'auth/too-many-requests': 'tooManyRequests',
  'auth/network-request-failed': 'network',
  'auth/popup-closed-by-user': 'popupClosed',
  'auth/cancelled-popup-request': 'popupClosed',
  'auth/popup-blocked': 'popupBlocked',
  'auth/user-disabled': 'userDisabled',
  'auth/operation-not-allowed': 'operationNotAllowed',
  'auth/unauthorized-domain': 'unauthorizedDomain',
  'permission-denied': 'permissionDenied',
  unavailable: 'unavailable',
}

// تُستدعى خارج React أيضاً، لذلك نستعمل i18n.t مباشرة
export function authErrorMessage(error) {
  return i18n.t(`auth:errors.${keys[error?.code] ?? 'unknown'}`)
}

// أخطاء لا تستحق إشعاراً (أغلق المستخدم النافذة بنفسه)
export const isSilentAuthError = (error) =>
  error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request'
