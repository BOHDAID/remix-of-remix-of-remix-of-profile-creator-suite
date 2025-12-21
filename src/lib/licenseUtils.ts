import { LicenseInfo } from '@/types';

export interface LicenseCheckResult {
  canRun: boolean;
  canCreate: boolean;
  message: string;
  maxProfiles: number;
  currentProfiles: number;
}

// عدد البروفايلات المسموح بإنشائها بدون ترخيص
const FREE_PROFILE_LIMIT = 2;

export function checkLicenseStatus(
  license: LicenseInfo | null,
  currentProfileCount: number
): LicenseCheckResult {
  // بدون ترخيص
  if (!license) {
    return {
      canRun: false,
      canCreate: currentProfileCount < FREE_PROFILE_LIMIT,
      message: 'يرجى تفعيل الترخيص لتشغيل البروفايلات',
      maxProfiles: FREE_PROFILE_LIMIT,
      currentProfiles: currentProfileCount,
    };
  }

  // التحقق من انتهاء الصلاحية
  if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
    return {
      canRun: false,
      canCreate: false,
      message: 'انتهت صلاحية الترخيص. يرجى تجديد اشتراكك',
      maxProfiles: license.maxProfiles,
      currentProfiles: currentProfileCount,
    };
  }

  // التحقق من حالة الترخيص
  if (license.status !== 'active') {
    return {
      canRun: false,
      canCreate: false,
      message: 'الترخيص غير فعال. يرجى التواصل مع الدعم',
      maxProfiles: license.maxProfiles,
      currentProfiles: currentProfileCount,
    };
  }

  // ترخيص فعال - التحقق من عدد البروفايلات
  const maxAllowed = license.maxProfiles === -1 ? Infinity : license.maxProfiles;
  
  return {
    canRun: true,
    canCreate: currentProfileCount < maxAllowed,
    message: '',
    maxProfiles: license.maxProfiles,
    currentProfiles: currentProfileCount,
  };
}

export function formatExpirationDate(date: Date | null): string {
  if (!date) return 'غير محدد';
  
  const expDate = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'منتهي الصلاحية';
  } else if (diffDays === 0) {
    return 'ينتهي اليوم';
  } else if (diffDays === 1) {
    return 'ينتهي غداً';
  } else if (diffDays <= 7) {
    return `ينتهي خلال ${diffDays} أيام`;
  } else {
    return expDate.toLocaleDateString('ar-SA');
  }
}
