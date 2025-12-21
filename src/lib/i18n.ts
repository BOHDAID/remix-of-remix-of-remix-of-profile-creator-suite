export type Language = 'ar' | 'en';

export const translations = {
  ar: {
    // Common
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    create: 'إنشاء',
    search: 'بحث...',
    loading: 'جاري التحميل...',
    success: 'تم بنجاح',
    error: 'حدث خطأ',
    confirm: 'تأكيد',
    close: 'إغلاق',
    yes: 'نعم',
    no: 'لا',
    
    // Navigation
    profiles: 'البروفايلات',
    extensions: 'الإضافات',
    settings: 'الإعدادات',
    license: 'الترخيص',
    updates: 'التحديثات',
    proxyManager: 'مدير البروكسي',
    security: 'الأمان',
    backup: 'النسخ الاحتياطي',
    
    // Profiles
    profilesTitle: 'إدارة البروفايلات',
    profilesDesc: 'أنشئ وأدر بروفايلات متصفح منفصلة',
    createProfile: 'إنشاء بروفايل',
    noProfiles: 'لا توجد بروفايلات',
    noProfilesDesc: 'أنشئ أول بروفايل للبدء',
    profileName: 'اسم البروفايل',
    profileNotes: 'ملاحظات',
    profileRunning: 'يعمل',
    profileStopped: 'متوقف',
    launchProfile: 'تشغيل',
    stopProfile: 'إيقاف',
    deleteProfile: 'حذف البروفايل',
    deleteProfileConfirm: 'هل أنت متأكد من حذف هذا البروفايل؟',
    
    // Extensions
    extensionsTitle: 'مدير الإضافات',
    extensionsDesc: 'أضف وأدر إضافات المتصفح',
    addExtension: 'إضافة إضافة',
    noExtensions: 'لا توجد إضافات',
    noExtensionsDesc: 'أضف إضافات لتحسين تجربة التصفح',
    extensionEnabled: 'مفعلة',
    extensionDisabled: 'معطلة',
    
    // Settings
    settingsTitle: 'الإعدادات',
    settingsDesc: 'إعدادات التطبيق العامة',
    browserPath: 'مسار المتصفح',
    chromiumPath: 'مسار Chromium',
    selectPath: 'اختيار المسار',
    defaultUserAgent: 'User Agent الافتراضي',
    commonPaths: 'مسارات شائعة:',
    appBehavior: 'سلوك التطبيق',
    autoUpdate: 'التحديث التلقائي',
    autoUpdateDesc: 'تحديث التطبيق تلقائياً عند توفر إصدار جديد',
    startMinimized: 'البدء مصغراً',
    startMinimizedDesc: 'تشغيل التطبيق مصغراً في شريط المهام',
    closeToTray: 'الإغلاق إلى شريط النظام',
    closeToTrayDesc: 'تصغير التطبيق إلى شريط النظام عند الإغلاق',
    saveSettings: 'حفظ الإعدادات',
    settingsSaved: 'تم حفظ الإعدادات بنجاح',
    previewMode: 'وضع المعاينة',
    previewModeDesc: 'أنت تستخدم التطبيق في المتصفح. للوصول لجميع الميزات، قم بتشغيل التطبيق كبرنامج سطح مكتب.',
    
    // Language & Theme
    language: 'اللغة',
    languageDesc: 'اختر لغة واجهة التطبيق',
    arabic: 'العربية',
    english: 'English',
    theme: 'المظهر',
    themeDesc: 'اختر مظهر التطبيق',
    darkTheme: 'داكن',
    lightTheme: 'فاتح',
    systemTheme: 'تلقائي',
    
    // Font Size
    fontSize: 'حجم الخط',
    fontSizeDesc: 'تخصيص حجم الخط في التطبيق',
    fontSmall: 'صغير',
    fontMedium: 'متوسط',
    fontLarge: 'كبير',
    fontExtraLarge: 'كبير جداً',
    
    // Customization
    customization: 'التخصيص',
    customThemes: 'ثيمات مخصصة',
    customThemesDesc: 'إنشاء وإدارة ثيمات مخصصة',
    createTheme: 'إنشاء ثيم',
    profileIcons: 'أيقونات البروفايلات',
    profileIconsDesc: 'تخصيص أيقونات البروفايلات',
    sidebarCustomization: 'تخصيص القائمة الجانبية',
    sidebarCustomizationDesc: 'تغيير ترتيب وعرض العناصر',
    
    // License
    licenseTitle: 'الترخيص',
    licenseDesc: 'إدارة ترخيص التطبيق',
    licenseKey: 'كود الترخيص',
    activateLicense: 'تفعيل الترخيص',
    licenseActive: 'الترخيص مفعل',
    licenseExpired: 'الترخيص منتهي',
    licenseInvalid: 'كود الترخيص غير صحيح',
    licenseExpiry: 'صالح حتى',
    maxProfiles: 'الحد الأقصى للبروفايلات',
    licenseType: 'نوع الترخيص',
    
    // Proxy
    proxy: 'البروكسي',
    proxySettings: 'إعدادات البروكسي',
    useProxy: 'استخدام بروكسي',
    proxyType: 'نوع البروكسي',
    proxyHost: 'العنوان',
    proxyPort: 'المنفذ',
    proxyUsername: 'اسم المستخدم',
    proxyPassword: 'كلمة المرور',
    proxyOptional: 'اختياري',
    testProxy: 'اختبار البروكسي',
    proxySpeed: 'سرعة البروكسي',
    proxyStatus: 'حالة البروكسي',
    proxyActive: 'نشط',
    proxyFailed: 'فاشل',
    autoSwitchProxy: 'تبديل تلقائي عند الفشل',
    proxyChain: 'تسلسل البروكسي',
    dataUsage: 'استهلاك البيانات',
    proxyExpiry: 'تاريخ انتهاء البروكسي',
    
    // Backup & Sync
    backupTitle: 'النسخ الاحتياطي',
    backupDesc: 'نسخ احتياطي واستعادة البيانات',
    createBackup: 'إنشاء نسخة احتياطية',
    restoreBackup: 'استعادة نسخة احتياطية',
    encryptedBackup: 'نسخ احتياطي مشفر',
    exportData: 'تصدير البيانات',
    importData: 'استيراد البيانات',
    exportFormat: 'صيغة التصدير',
    lastBackup: 'آخر نسخة احتياطية',
    
    // Security
    securityTitle: 'الأمان',
    securityDesc: 'إعدادات الأمان والخصوصية',
    appLock: 'قفل التطبيق',
    appLockDesc: 'قفل التطبيق بكلمة مرور',
    setPassword: 'تعيين كلمة مرور',
    changePassword: 'تغيير كلمة المرور',
    autoLock: 'قفل تلقائي',
    autoLockDesc: 'قفل التطبيق بعد فترة من عدم النشاط',
    lockTimeout: 'مهلة القفل',
    minutes: 'دقائق',
    fingerprintLogin: 'الدخول ببصمة الإصبع',
    fingerprintLoginDesc: 'فتح التطبيق ببصمة الإصبع',
    dataEncryption: 'تشفير البيانات',
    dataEncryptionDesc: 'تشفير البيانات المحلية',
    intrusionDetection: 'مراقبة محاولات الاختراق',
    intrusionDetectionDesc: 'تنبيهات عند محاولات الوصول المشبوهة',
    
    // Identity Generator
    identityGenerator: 'مولد الهوية',
    identityGeneratorDesc: 'إنشاء هويات عشوائية للبروفايلات',
    generateIdentity: 'توليد هوية',
    randomName: 'اسم عشوائي',
    randomEmail: 'بريد عشوائي',
    randomPhone: 'هاتف عشوائي',
    randomAddress: 'عنوان عشوائي',
    randomUserAgent: 'User Agent عشوائي',
    
    // Anti-Tracking
    antiTracking: 'مقاومة التتبع',
    antiTrackingDesc: 'حماية من التتبع وبصمة المتصفح',
    canvasFingerprint: 'بصمة Canvas',
    webglFingerprint: 'بصمة WebGL',
    audioFingerprint: 'بصمة الصوت',
    fontFingerprint: 'بصمة الخطوط',
    mouseMovement: 'محاكاة حركة الماوس',
    mouseMovementDesc: 'محاكاة حركة ماوس طبيعية',
    
    // Activity Log
    activityLog: 'سجل النشاط',
    activityLogDesc: 'عرض سجل النشاط المفصل',
    viewLog: 'عرض السجل',
    clearLog: 'مسح السجل',
    exportLog: 'تصدير السجل',
    
    // Updates
    updatesTitle: 'التحديثات',
    updatesDesc: 'التحقق من التحديثات الجديدة',
    checkUpdates: 'التحقق من التحديثات',
    currentVersion: 'الإصدار الحالي',
    latestVersion: 'أحدث إصدار',
    downloadUpdate: 'تحميل التحديث',
    installUpdate: 'تثبيت التحديث',
    upToDate: 'التطبيق محدث',
    
    // Tabs in Profile Modal
    general: 'عام',
    advanced: 'متقدم',
    
    // Validation
    required: 'هذا الحقل مطلوب',
    invalidFormat: 'صيغة غير صحيحة',
    
    // Time
    seconds: 'ثواني',
    hours: 'ساعات',
    days: 'أيام',
    
    // Data
    profiles_count: 'بروفايل',
    extensions_count: 'إضافة',
    mb: 'م.ب',
    gb: 'ج.ب',
  },
  
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search...',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    confirm: 'Confirm',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    
    // Navigation
    profiles: 'Profiles',
    extensions: 'Extensions',
    settings: 'Settings',
    license: 'License',
    updates: 'Updates',
    proxyManager: 'Proxy Manager',
    security: 'Security',
    backup: 'Backup',
    
    // Profiles
    profilesTitle: 'Profile Management',
    profilesDesc: 'Create and manage separate browser profiles',
    createProfile: 'Create Profile',
    noProfiles: 'No Profiles',
    noProfilesDesc: 'Create your first profile to get started',
    profileName: 'Profile Name',
    profileNotes: 'Notes',
    profileRunning: 'Running',
    profileStopped: 'Stopped',
    launchProfile: 'Launch',
    stopProfile: 'Stop',
    deleteProfile: 'Delete Profile',
    deleteProfileConfirm: 'Are you sure you want to delete this profile?',
    
    // Extensions
    extensionsTitle: 'Extensions Manager',
    extensionsDesc: 'Add and manage browser extensions',
    addExtension: 'Add Extension',
    noExtensions: 'No Extensions',
    noExtensionsDesc: 'Add extensions to enhance your browsing experience',
    extensionEnabled: 'Enabled',
    extensionDisabled: 'Disabled',
    
    // Settings
    settingsTitle: 'Settings',
    settingsDesc: 'General application settings',
    browserPath: 'Browser Path',
    chromiumPath: 'Chromium Path',
    selectPath: 'Select Path',
    defaultUserAgent: 'Default User Agent',
    commonPaths: 'Common paths:',
    appBehavior: 'App Behavior',
    autoUpdate: 'Auto Update',
    autoUpdateDesc: 'Automatically update when new version is available',
    startMinimized: 'Start Minimized',
    startMinimizedDesc: 'Start the app minimized in taskbar',
    closeToTray: 'Close to Tray',
    closeToTrayDesc: 'Minimize to system tray when closing',
    saveSettings: 'Save Settings',
    settingsSaved: 'Settings saved successfully',
    previewMode: 'Preview Mode',
    previewModeDesc: 'You are using the app in browser. Run as desktop app for all features.',
    
    // Language & Theme
    language: 'Language',
    languageDesc: 'Choose app interface language',
    arabic: 'العربية',
    english: 'English',
    theme: 'Theme',
    themeDesc: 'Choose app appearance',
    darkTheme: 'Dark',
    lightTheme: 'Light',
    systemTheme: 'System',
    
    // Font Size
    fontSize: 'Font Size',
    fontSizeDesc: 'Customize app font size',
    fontSmall: 'Small',
    fontMedium: 'Medium',
    fontLarge: 'Large',
    fontExtraLarge: 'Extra Large',
    
    // Customization
    customization: 'Customization',
    customThemes: 'Custom Themes',
    customThemesDesc: 'Create and manage custom themes',
    createTheme: 'Create Theme',
    profileIcons: 'Profile Icons',
    profileIconsDesc: 'Customize profile icons',
    sidebarCustomization: 'Sidebar Customization',
    sidebarCustomizationDesc: 'Change order and display of items',
    
    // License
    licenseTitle: 'License',
    licenseDesc: 'Manage app license',
    licenseKey: 'License Key',
    activateLicense: 'Activate License',
    licenseActive: 'License Active',
    licenseExpired: 'License Expired',
    licenseInvalid: 'Invalid License Key',
    licenseExpiry: 'Valid Until',
    maxProfiles: 'Max Profiles',
    licenseType: 'License Type',
    
    // Proxy
    proxy: 'Proxy',
    proxySettings: 'Proxy Settings',
    useProxy: 'Use Proxy',
    proxyType: 'Proxy Type',
    proxyHost: 'Host',
    proxyPort: 'Port',
    proxyUsername: 'Username',
    proxyPassword: 'Password',
    proxyOptional: 'Optional',
    testProxy: 'Test Proxy',
    proxySpeed: 'Proxy Speed',
    proxyStatus: 'Proxy Status',
    proxyActive: 'Active',
    proxyFailed: 'Failed',
    autoSwitchProxy: 'Auto-switch on failure',
    proxyChain: 'Proxy Chain',
    dataUsage: 'Data Usage',
    proxyExpiry: 'Proxy Expiry',
    
    // Backup & Sync
    backupTitle: 'Backup',
    backupDesc: 'Backup and restore data',
    createBackup: 'Create Backup',
    restoreBackup: 'Restore Backup',
    encryptedBackup: 'Encrypted Backup',
    exportData: 'Export Data',
    importData: 'Import Data',
    exportFormat: 'Export Format',
    lastBackup: 'Last Backup',
    
    // Security
    securityTitle: 'Security',
    securityDesc: 'Security and privacy settings',
    appLock: 'App Lock',
    appLockDesc: 'Lock app with password',
    setPassword: 'Set Password',
    changePassword: 'Change Password',
    autoLock: 'Auto Lock',
    autoLockDesc: 'Lock app after period of inactivity',
    lockTimeout: 'Lock Timeout',
    minutes: 'minutes',
    fingerprintLogin: 'Fingerprint Login',
    fingerprintLoginDesc: 'Unlock app with fingerprint',
    dataEncryption: 'Data Encryption',
    dataEncryptionDesc: 'Encrypt local data',
    intrusionDetection: 'Intrusion Detection',
    intrusionDetectionDesc: 'Alerts on suspicious access attempts',
    
    // Identity Generator
    identityGenerator: 'Identity Generator',
    identityGeneratorDesc: 'Generate random identities for profiles',
    generateIdentity: 'Generate Identity',
    randomName: 'Random Name',
    randomEmail: 'Random Email',
    randomPhone: 'Random Phone',
    randomAddress: 'Random Address',
    randomUserAgent: 'Random User Agent',
    
    // Anti-Tracking
    antiTracking: 'Anti-Tracking',
    antiTrackingDesc: 'Protection from tracking and browser fingerprinting',
    canvasFingerprint: 'Canvas Fingerprint',
    webglFingerprint: 'WebGL Fingerprint',
    audioFingerprint: 'Audio Fingerprint',
    fontFingerprint: 'Font Fingerprint',
    mouseMovement: 'Mouse Movement Simulation',
    mouseMovementDesc: 'Simulate natural mouse movement',
    
    // Activity Log
    activityLog: 'Activity Log',
    activityLogDesc: 'View detailed activity log',
    viewLog: 'View Log',
    clearLog: 'Clear Log',
    exportLog: 'Export Log',
    
    // Updates
    updatesTitle: 'Updates',
    updatesDesc: 'Check for new updates',
    checkUpdates: 'Check Updates',
    currentVersion: 'Current Version',
    latestVersion: 'Latest Version',
    downloadUpdate: 'Download Update',
    installUpdate: 'Install Update',
    upToDate: 'App is up to date',
    
    // Tabs in Profile Modal
    general: 'General',
    advanced: 'Advanced',
    
    // Validation
    required: 'This field is required',
    invalidFormat: 'Invalid format',
    
    // Time
    seconds: 'seconds',
    hours: 'hours',
    days: 'days',
    
    // Data
    profiles_count: 'profile',
    extensions_count: 'extension',
    mb: 'MB',
    gb: 'GB',
  },
} as const;

export type TranslationKey = keyof typeof translations.ar;

export function getTranslation(lang: Language, key: TranslationKey): string {
  return translations[lang][key] || key;
}

export function getDirection(lang: Language): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

export function getFontFamily(lang: Language): string {
  return lang === 'ar' ? 'Cairo, sans-serif' : 'Inter, sans-serif';
}
