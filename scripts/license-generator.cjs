#!/usr/bin/env node

/**
 * مولد التراخيص - للتشغيل في Cursor Terminal
 * الاستخدام: node scripts/license-generator.cjs
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ملف حفظ التراخيص
const LICENSES_FILE = path.join(__dirname, 'licenses.json');

// إعدادات أنواع التراخيص
const LICENSE_TYPES = {
  trial: { name: 'تجريبي', maxProfiles: 3, defaultDays: 7 },
  basic: { name: 'أساسي', maxProfiles: 10, defaultDays: 365 },
  pro: { name: 'احترافي', maxProfiles: 50, defaultDays: 365 },
  enterprise: { name: 'مؤسسات', maxProfiles: -1, defaultDays: 365 }
};

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// تحميل التراخيص المحفوظة
function loadLicenses() {
  try {
    if (fs.existsSync(LICENSES_FILE)) {
      return JSON.parse(fs.readFileSync(LICENSES_FILE, 'utf8'));
    }
  } catch (e) {
    console.log(`${colors.yellow}لا يوجد ملف تراخيص سابق، سيتم إنشاء ملف جديد${colors.reset}`);
  }
  return [];
}

// حفظ التراخيص
function saveLicenses(licenses) {
  fs.writeFileSync(LICENSES_FILE, JSON.stringify(licenses, null, 2), 'utf8');
}

// إنشاء مفتاح ترخيص عشوائي
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let s = 0; s < 4; s++) {
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return segments.join('-');
}

// إنشاء كود التفعيل المشفر
function createActivationCode(license) {
  const data = {
    k: license.key,
    t: license.type,
    m: license.maxProfiles,
    e: license.expiresAt,
    c: Date.now()
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

// طباعة الشعار
function printHeader() {
  console.clear();
  console.log(`
${colors.cyan}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ${colors.bright}🔐 مولد التراخيص - لوحة الإدارة${colors.reset}${colors.cyan}                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
`);
}

// طباعة القائمة الرئيسية
function printMenu() {
  console.log(`
${colors.bright}الخيارات المتاحة:${colors.reset}

  ${colors.green}1${colors.reset} - إنشاء ترخيص جديد
  ${colors.blue}2${colors.reset} - عرض جميع التراخيص
  ${colors.yellow}3${colors.reset} - البحث عن ترخيص
  ${colors.magenta}4${colors.reset} - حذف ترخيص
  ${colors.cyan}5${colors.reset} - تصدير التراخيص
  ${colors.red}0${colors.reset} - خروج
`);
}

// إنشاء واجهة القراءة
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// دالة لطرح سؤال
function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// إنشاء ترخيص جديد
async function createLicense(licenses) {
  console.log(`\n${colors.bright}${colors.green}═══ إنشاء ترخيص جديد ═══${colors.reset}\n`);

  const clientName = await ask(`${colors.cyan}اسم العميل: ${colors.reset}`);
  if (!clientName.trim()) {
    console.log(`${colors.red}خطأ: يجب إدخال اسم العميل${colors.reset}`);
    return;
  }

  const clientEmail = await ask(`${colors.cyan}البريد الإلكتروني (اختياري): ${colors.reset}`);

  console.log(`\n${colors.yellow}أنواع التراخيص:${colors.reset}`);
  console.log(`  1 - تجريبي (3 بروفايلات، 7 أيام)`);
  console.log(`  2 - أساسي (10 بروفايلات)`);
  console.log(`  3 - احترافي (50 بروفايل)`);
  console.log(`  4 - مؤسسات (غير محدود)`);
  
  const typeChoice = await ask(`\n${colors.cyan}اختر النوع (1-4): ${colors.reset}`);
  const types = ['trial', 'basic', 'pro', 'enterprise'];
  const type = types[parseInt(typeChoice) - 1] || 'trial';
  const typeConfig = LICENSE_TYPES[type];

  const daysInput = await ask(`${colors.cyan}عدد الأيام (اتركه فارغاً للافتراضي ${typeConfig.defaultDays}): ${colors.reset}`);
  const days = daysInput.trim() ? parseInt(daysInput) : typeConfig.defaultDays;

  const profilesInput = await ask(`${colors.cyan}عدد البروفايلات (اتركه فارغاً للافتراضي ${typeConfig.maxProfiles === -1 ? 'غير محدود' : typeConfig.maxProfiles}): ${colors.reset}`);
  const maxProfiles = profilesInput.trim() ? parseInt(profilesInput) : typeConfig.maxProfiles;

  // إنشاء الترخيص
  const expiresAt = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null;
  
  const license = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    key: generateKey(),
    clientName: clientName.trim(),
    clientEmail: clientEmail.trim() || null,
    type,
    maxProfiles,
    days,
    createdAt: new Date().toISOString(),
    expiresAt,
    status: 'active'
  };

  license.activationCode = createActivationCode(license);

  licenses.push(license);
  saveLicenses(licenses);

  // طباعة النتيجة
  console.log(`
${colors.green}╔═══════════════════════════════════════════════════════════╗
║              ✅ تم إنشاء الترخيص بنجاح!                    ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}تفاصيل الترخيص:${colors.reset}
────────────────────────────────────────────────────────────
  👤 العميل: ${license.clientName}
  📧 البريد: ${license.clientEmail || 'غير محدد'}
  📦 النوع: ${typeConfig.name}
  👥 البروفايلات: ${maxProfiles === -1 ? 'غير محدود' : maxProfiles}
  📅 الانتهاء: ${expiresAt ? new Date(expiresAt).toLocaleDateString('ar-SA') : 'مدى الحياة'}
────────────────────────────────────────────────────────────

${colors.bright}${colors.cyan}كود التفعيل (انسخه وأرسله للعميل):${colors.reset}

${colors.yellow}${license.activationCode}${colors.reset}

────────────────────────────────────────────────────────────
`);

  await ask(`${colors.cyan}اضغط Enter للمتابعة...${colors.reset}`);
}

// عرض جميع التراخيص
async function listLicenses(licenses) {
  console.log(`\n${colors.bright}${colors.blue}═══ جميع التراخيص (${licenses.length}) ═══${colors.reset}\n`);

  if (licenses.length === 0) {
    console.log(`${colors.yellow}لا توجد تراخيص بعد.${colors.reset}`);
  } else {
    const now = new Date();
    licenses.forEach((lic, index) => {
      const isExpired = lic.expiresAt && new Date(lic.expiresAt) < now;
      const statusColor = isExpired ? colors.red : colors.green;
      const statusText = isExpired ? 'منتهي' : 'نشط';
      
      console.log(`${colors.bright}${index + 1}. ${lic.clientName}${colors.reset}`);
      console.log(`   النوع: ${LICENSE_TYPES[lic.type].name} | البروفايلات: ${lic.maxProfiles === -1 ? '∞' : lic.maxProfiles}`);
      console.log(`   الحالة: ${statusColor}${statusText}${colors.reset} | الانتهاء: ${lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString('ar-SA') : 'مدى الحياة'}`);
      console.log(`   الكود: ${colors.cyan}${lic.activationCode.substring(0, 30)}...${colors.reset}`);
      console.log('');
    });
  }

  await ask(`${colors.cyan}اضغط Enter للمتابعة...${colors.reset}`);
}

// البحث عن ترخيص
async function searchLicense(licenses) {
  console.log(`\n${colors.bright}${colors.yellow}═══ البحث عن ترخيص ═══${colors.reset}\n`);
  
  const query = await ask(`${colors.cyan}أدخل اسم العميل أو البريد: ${colors.reset}`);
  
  const results = licenses.filter(lic => 
    lic.clientName.toLowerCase().includes(query.toLowerCase()) ||
    (lic.clientEmail && lic.clientEmail.toLowerCase().includes(query.toLowerCase()))
  );

  if (results.length === 0) {
    console.log(`${colors.yellow}لم يتم العثور على نتائج.${colors.reset}`);
  } else {
    console.log(`\n${colors.green}تم العثور على ${results.length} ترخيص:${colors.reset}\n`);
    results.forEach((lic, index) => {
      console.log(`${colors.bright}${index + 1}. ${lic.clientName}${colors.reset} - ${LICENSE_TYPES[lic.type].name}`);
      console.log(`   كود التفعيل: ${colors.cyan}${lic.activationCode}${colors.reset}`);
      console.log('');
    });
  }

  await ask(`${colors.cyan}اضغط Enter للمتابعة...${colors.reset}`);
}

// حذف ترخيص
async function deleteLicense(licenses) {
  console.log(`\n${colors.bright}${colors.red}═══ حذف ترخيص ═══${colors.reset}\n`);
  
  if (licenses.length === 0) {
    console.log(`${colors.yellow}لا توجد تراخيص للحذف.${colors.reset}`);
    await ask(`${colors.cyan}اضغط Enter للمتابعة...${colors.reset}`);
    return licenses;
  }

  licenses.forEach((lic, index) => {
    console.log(`${index + 1}. ${lic.clientName} - ${LICENSE_TYPES[lic.type].name}`);
  });

  const choice = await ask(`\n${colors.cyan}أدخل رقم الترخيص للحذف (أو 0 للإلغاء): ${colors.reset}`);
  const index = parseInt(choice) - 1;

  if (index >= 0 && index < licenses.length) {
    const confirm = await ask(`${colors.red}هل أنت متأكد من حذف ترخيص "${licenses[index].clientName}"؟ (نعم/لا): ${colors.reset}`);
    if (confirm.trim() === 'نعم' || confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
      licenses.splice(index, 1);
      saveLicenses(licenses);
      console.log(`${colors.green}تم الحذف بنجاح!${colors.reset}`);
    } else {
      console.log(`${colors.yellow}تم الإلغاء.${colors.reset}`);
    }
  }

  await ask(`${colors.cyan}اضغط Enter للمتابعة...${colors.reset}`);
  return licenses;
}

// تصدير التراخيص
async function exportLicenses(licenses) {
  console.log(`\n${colors.bright}${colors.cyan}═══ تصدير التراخيص ═══${colors.reset}\n`);
  
  const filename = `licenses-export-${new Date().toISOString().split('T')[0]}.json`;
  const filepath = path.join(__dirname, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(licenses, null, 2), 'utf8');
  
  console.log(`${colors.green}تم التصدير إلى: ${filepath}${colors.reset}`);
  
  await ask(`${colors.cyan}اضغط Enter للمتابعة...${colors.reset}`);
}

// الدالة الرئيسية
async function main() {
  let licenses = loadLicenses();
  let running = true;

  while (running) {
    printHeader();
    console.log(`${colors.bright}التراخيص المحفوظة: ${licenses.length}${colors.reset}`);
    printMenu();

    const choice = await ask(`${colors.bright}اختر رقم الخيار: ${colors.reset}`);

    switch (choice.trim()) {
      case '1':
        await createLicense(licenses);
        licenses = loadLicenses(); // إعادة تحميل
        break;
      case '2':
        await listLicenses(licenses);
        break;
      case '3':
        await searchLicense(licenses);
        break;
      case '4':
        licenses = await deleteLicense(licenses);
        break;
      case '5':
        await exportLicenses(licenses);
        break;
      case '0':
        running = false;
        console.log(`\n${colors.green}مع السلامة! 👋${colors.reset}\n`);
        break;
      default:
        console.log(`${colors.red}خيار غير صالح${colors.reset}`);
        await ask(`${colors.cyan}اضغط Enter للمتابعة...${colors.reset}`);
    }
  }

  rl.close();
}

// تشغيل البرنامج
main().catch(console.error);
