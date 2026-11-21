// رسائل أخطاء Firebase بالعربية (T2.7)
const messages = {
  'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'auth/wrong-password': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'auth/user-not-found': 'لا يوجد حساب بهذا البريد الإلكتروني.',
  'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة.',
  'auth/email-already-in-use': 'هذا البريد مسجّل مسبقاً. جرّب تسجيل الدخول.',
  'auth/weak-password': 'كلمة المرور ضعيفة؛ يجب ألا تقل عن 6 أحرف.',
  'auth/too-many-requests': 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.',
  'auth/network-request-failed': 'تعذّر الاتصال بالشبكة. تحقّق من اتصالك بالإنترنت.',
  'auth/popup-closed-by-user': 'أُغلقت نافذة Google قبل إكمال الدخول.',
  'auth/cancelled-popup-request': 'أُغلقت نافذة Google قبل إكمال الدخول.',
  'auth/popup-blocked': 'منع المتصفح نافذة Google. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.',
  'auth/user-disabled': 'هذا الحساب موقوف. تواصل مع الإدارة.',
  'auth/operation-not-allowed': 'طريقة الدخول هذه غير مفعّلة في المشروع.',
  'auth/unauthorized-domain': 'هذا النطاق غير مصرّح له بالدخول عبر Google.',
  'permission-denied': 'لا تملك صلاحية تنفيذ هذه العملية.',
  unavailable: 'الخدمة غير متاحة الآن. أعد المحاولة بعد قليل.',
}

export function authErrorMessage(error) {
  return messages[error?.code] ?? 'حدث خطأ غير متوقع. أعد المحاولة.'
}

// أخطاء لا تستحق إشعاراً (أغلق المستخدم النافذة بنفسه)
export const isSilentAuthError = (error) =>
  error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request'
