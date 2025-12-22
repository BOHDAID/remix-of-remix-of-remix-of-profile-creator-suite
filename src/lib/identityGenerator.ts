// Realistic Identity Generator with country-specific data

export interface GeneratedIdentity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  countryCode: string;
  city: string;
  state: string;
  address: string;
  zipCode: string;
  dateOfBirth: string;
  age: number;
  gender: 'male' | 'female';
  occupation: string;
  company: string;
  username: string;
  password: string;
  creditCard: string;
  cvv: string;
  expiry: string;
  ssn: string;
  passport: string;
  driverLicense: string;
  avatar: string;
  nationality: string;
  timezone: string;
  language: string;
  createdAt: Date;
}

// Country-specific data
const countryData: Record<string, {
  code: string;
  names: { male: string[]; female: string[] };
  lastNames: string[];
  cities: { name: string; state: string; zipFormat: string }[];
  phoneFormat: string;
  ssnFormat: string;
  timezone: string;
  language: string;
  companies: string[];
  occupations: string[];
  domains: string[];
}> = {
  US: {
    code: 'US',
    names: {
      male: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Donald', 'Steven'],
      female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra']
    },
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'],
    cities: [
      { name: 'New York', state: 'NY', zipFormat: '100##' },
      { name: 'Los Angeles', state: 'CA', zipFormat: '900##' },
      { name: 'Chicago', state: 'IL', zipFormat: '606##' },
      { name: 'Houston', state: 'TX', zipFormat: '770##' },
      { name: 'Phoenix', state: 'AZ', zipFormat: '850##' },
      { name: 'Philadelphia', state: 'PA', zipFormat: '191##' },
      { name: 'San Antonio', state: 'TX', zipFormat: '782##' },
      { name: 'San Diego', state: 'CA', zipFormat: '921##' },
      { name: 'Dallas', state: 'TX', zipFormat: '752##' },
      { name: 'San Jose', state: 'CA', zipFormat: '951##' }
    ],
    phoneFormat: '+1 (###) ###-####',
    ssnFormat: '###-##-####',
    timezone: 'America/New_York',
    language: 'en-US',
    companies: ['Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Tesla', 'Netflix', 'IBM', 'Intel', 'Oracle'],
    occupations: ['Software Engineer', 'Marketing Manager', 'Financial Analyst', 'Data Scientist', 'Product Manager', 'UX Designer', 'Sales Executive', 'HR Manager', 'Accountant', 'Lawyer'],
    domains: ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com']
  },
  UK: {
    code: 'GB',
    names: {
      male: ['Oliver', 'George', 'Harry', 'Jack', 'Jacob', 'Charlie', 'Thomas', 'Oscar', 'William', 'James', 'Henry', 'Alexander', 'Leo', 'Archie', 'Edward'],
      female: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Emily', 'Sophia', 'Grace', 'Mia', 'Poppy', 'Ella', 'Lily', 'Evie', 'Charlotte', 'Jessica', 'Daisy']
    },
    lastNames: ['Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Roberts', 'Johnson', 'Lewis', 'Walker', 'Robinson', 'Wood'],
    cities: [
      { name: 'London', state: 'England', zipFormat: 'SW1A #AA' },
      { name: 'Birmingham', state: 'England', zipFormat: 'B# #AA' },
      { name: 'Manchester', state: 'England', zipFormat: 'M# #AA' },
      { name: 'Glasgow', state: 'Scotland', zipFormat: 'G# #AA' },
      { name: 'Liverpool', state: 'England', zipFormat: 'L# #AA' },
      { name: 'Edinburgh', state: 'Scotland', zipFormat: 'EH# #AA' },
      { name: 'Bristol', state: 'England', zipFormat: 'BS# #AA' },
      { name: 'Leeds', state: 'England', zipFormat: 'LS# #AA' }
    ],
    phoneFormat: '+44 7### ### ###',
    ssnFormat: 'AB###### C',
    timezone: 'Europe/London',
    language: 'en-GB',
    companies: ['HSBC', 'Barclays', 'BP', 'Unilever', 'Vodafone', 'Tesco', 'GSK', 'AstraZeneca', 'Rolls-Royce', 'BAE Systems'],
    occupations: ['Software Developer', 'Marketing Executive', 'Chartered Accountant', 'Data Analyst', 'Project Manager', 'Graphic Designer', 'Business Analyst', 'HR Advisor', 'Civil Engineer', 'Solicitor'],
    domains: ['gmail.com', 'outlook.com', 'yahoo.co.uk', 'btinternet.com', 'hotmail.co.uk']
  },
  DE: {
    code: 'DE',
    names: {
      male: ['Maximilian', 'Alexander', 'Paul', 'Leon', 'Louis', 'Ben', 'Jonas', 'Noah', 'Elias', 'Felix', 'Lukas', 'Liam', 'Finn', 'Emil', 'Henry'],
      female: ['Emma', 'Mia', 'Hannah', 'Sofia', 'Lina', 'Emilia', 'Lea', 'Marie', 'Lena', 'Anna', 'Charlotte', 'Johanna', 'Clara', 'Sophia', 'Laura']
    },
    lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Klein', 'Wolf', 'Schröder'],
    cities: [
      { name: 'Berlin', state: 'Berlin', zipFormat: '10###' },
      { name: 'Hamburg', state: 'Hamburg', zipFormat: '20###' },
      { name: 'München', state: 'Bayern', zipFormat: '80###' },
      { name: 'Köln', state: 'NRW', zipFormat: '50###' },
      { name: 'Frankfurt', state: 'Hessen', zipFormat: '60###' },
      { name: 'Stuttgart', state: 'BW', zipFormat: '70###' },
      { name: 'Düsseldorf', state: 'NRW', zipFormat: '40###' }
    ],
    phoneFormat: '+49 ### #######',
    ssnFormat: '## ########## #',
    timezone: 'Europe/Berlin',
    language: 'de-DE',
    companies: ['Volkswagen', 'Siemens', 'BMW', 'Mercedes-Benz', 'SAP', 'Deutsche Bank', 'Allianz', 'BASF', 'Bosch', 'Adidas'],
    occupations: ['Softwareentwickler', 'Ingenieur', 'Buchhalter', 'Projektmanager', 'Arzt', 'Lehrer', 'Architekt', 'Berater', 'Analyst', 'Designer'],
    domains: ['gmail.com', 'web.de', 'gmx.de', 't-online.de', 'outlook.de']
  },
  FR: {
    code: 'FR',
    names: {
      male: ['Gabriel', 'Léo', 'Raphaël', 'Arthur', 'Louis', 'Lucas', 'Adam', 'Jules', 'Hugo', 'Maël', 'Noah', 'Nathan', 'Ethan', 'Paul', 'Thomas'],
      female: ['Emma', 'Jade', 'Louise', 'Alice', 'Chloé', 'Léa', 'Manon', 'Inès', 'Rose', 'Léna', 'Anna', 'Mia', 'Julia', 'Lina', 'Camille']
    },
    lastNames: ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux'],
    cities: [
      { name: 'Paris', state: 'Île-de-France', zipFormat: '75###' },
      { name: 'Lyon', state: 'Auvergne-Rhône-Alpes', zipFormat: '69###' },
      { name: 'Marseille', state: 'PACA', zipFormat: '13###' },
      { name: 'Toulouse', state: 'Occitanie', zipFormat: '31###' },
      { name: 'Nice', state: 'PACA', zipFormat: '06###' },
      { name: 'Nantes', state: 'Pays de la Loire', zipFormat: '44###' },
      { name: 'Bordeaux', state: 'Nouvelle-Aquitaine', zipFormat: '33###' }
    ],
    phoneFormat: '+33 # ## ## ## ##',
    ssnFormat: '# ## ## ## ### ### ##',
    timezone: 'Europe/Paris',
    language: 'fr-FR',
    companies: ['LVMH', 'Total', 'L\'Oréal', 'Sanofi', 'BNP Paribas', 'Carrefour', 'Orange', 'Danone', 'Renault', 'Airbus'],
    occupations: ['Développeur', 'Ingénieur', 'Comptable', 'Chef de projet', 'Médecin', 'Professeur', 'Architecte', 'Consultant', 'Analyste', 'Designer'],
    domains: ['gmail.com', 'orange.fr', 'free.fr', 'sfr.fr', 'yahoo.fr']
  },
  SA: {
    code: 'SA',
    names: {
      male: ['محمد', 'عبدالله', 'فهد', 'سلطان', 'خالد', 'سعود', 'فيصل', 'عبدالرحمن', 'أحمد', 'عمر', 'يوسف', 'إبراهيم', 'عبدالعزيز', 'ناصر', 'تركي'],
      female: ['نورة', 'سارة', 'لمى', 'ريم', 'هيا', 'منيرة', 'عهود', 'دلال', 'أروى', 'لينا', 'غادة', 'نجلاء', 'مها', 'هند', 'آلاء']
    },
    lastNames: ['العتيبي', 'القحطاني', 'الغامدي', 'الشمري', 'الدوسري', 'الحربي', 'الزهراني', 'المطيري', 'العنزي', 'السبيعي', 'الشهري', 'البلوي', 'الرشيدي', 'الحازمي', 'المالكي'],
    cities: [
      { name: 'الرياض', state: 'منطقة الرياض', zipFormat: '1####' },
      { name: 'جدة', state: 'منطقة مكة', zipFormat: '2####' },
      { name: 'مكة المكرمة', state: 'منطقة مكة', zipFormat: '2####' },
      { name: 'المدينة المنورة', state: 'منطقة المدينة', zipFormat: '4####' },
      { name: 'الدمام', state: 'المنطقة الشرقية', zipFormat: '3####' },
      { name: 'الخبر', state: 'المنطقة الشرقية', zipFormat: '3####' }
    ],
    phoneFormat: '+966 5# ### ####',
    ssnFormat: '1### #### ####',
    timezone: 'Asia/Riyadh',
    language: 'ar-SA',
    companies: ['أرامكو', 'سابك', 'الراجحي', 'STC', 'الأهلي', 'موبايلي', 'المراعي', 'جرير', 'إكسترا', 'بنده'],
    occupations: ['مهندس برمجيات', 'محاسب', 'مدير مشاريع', 'طبيب', 'معلم', 'مهندس', 'محامي', 'مستشار', 'محلل', 'مصمم'],
    domains: ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com']
  },
  AE: {
    code: 'AE',
    names: {
      male: ['محمد', 'أحمد', 'راشد', 'سعيد', 'خالد', 'عمر', 'علي', 'حمدان', 'سلطان', 'عبدالله', 'ماجد', 'فيصل', 'يوسف', 'حسن', 'طارق'],
      female: ['فاطمة', 'مريم', 'عائشة', 'موزة', 'شما', 'لطيفة', 'علياء', 'نورة', 'حصة', 'سارة', 'هند', 'آمنة', 'رقية', 'ميثاء', 'شيخة']
    },
    lastNames: ['المكتوم', 'النهيان', 'الفلاسي', 'المزروعي', 'الشامسي', 'العبدولي', 'الكعبي', 'النعيمي', 'الظاهري', 'الحمادي', 'المهيري', 'الرميثي', 'الكتبي', 'البلوشي', 'السويدي'],
    cities: [
      { name: 'دبي', state: 'إمارة دبي', zipFormat: '#####' },
      { name: 'أبوظبي', state: 'إمارة أبوظبي', zipFormat: '#####' },
      { name: 'الشارقة', state: 'إمارة الشارقة', zipFormat: '#####' },
      { name: 'عجمان', state: 'إمارة عجمان', zipFormat: '#####' },
      { name: 'رأس الخيمة', state: 'إمارة رأس الخيمة', zipFormat: '#####' }
    ],
    phoneFormat: '+971 5# ### ####',
    ssnFormat: '784-####-#######-#',
    timezone: 'Asia/Dubai',
    language: 'ar-AE',
    companies: ['طيران الإمارات', 'إعمار', 'اتصالات', 'دو', 'مبادلة', 'أدنوك', 'مجموعة الفطيم', 'ماجد الفطيم', 'داماك', 'نخيل'],
    occupations: ['مهندس', 'مدير', 'محاسب', 'طبيب', 'مستشار', 'محلل', 'مصمم', 'معلم', 'محامي', 'تاجر'],
    domains: ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com']
  },
  EG: {
    code: 'EG',
    names: {
      male: ['محمد', 'أحمد', 'محمود', 'مصطفى', 'علي', 'عمر', 'يوسف', 'إبراهيم', 'حسن', 'كريم', 'خالد', 'طارق', 'سامي', 'عمرو', 'هاني'],
      female: ['فاطمة', 'نور', 'سارة', 'مريم', 'ياسمين', 'منة', 'هبة', 'دينا', 'رانيا', 'نهى', 'سمر', 'شيماء', 'إسراء', 'مي', 'آية']
    },
    lastNames: ['محمد', 'أحمد', 'علي', 'حسن', 'إبراهيم', 'عبدالله', 'السيد', 'مصطفى', 'عبدالرحمن', 'سليمان', 'الشريف', 'العربي', 'حسين', 'خليل', 'يوسف'],
    cities: [
      { name: 'القاهرة', state: 'محافظة القاهرة', zipFormat: '1####' },
      { name: 'الإسكندرية', state: 'محافظة الإسكندرية', zipFormat: '2####' },
      { name: 'الجيزة', state: 'محافظة الجيزة', zipFormat: '1####' },
      { name: 'شرم الشيخ', state: 'جنوب سيناء', zipFormat: '4####' },
      { name: 'الأقصر', state: 'محافظة الأقصر', zipFormat: '8####' }
    ],
    phoneFormat: '+20 1# #### ####',
    ssnFormat: '##### #### ##### #',
    timezone: 'Africa/Cairo',
    language: 'ar-EG',
    companies: ['اتصالات مصر', 'فودافون مصر', 'أورانج مصر', 'البنك الأهلي', 'بنك مصر', 'طلبات', 'سويفل', 'فوري', 'المصرية للاتصالات', 'إعمار مصر'],
    occupations: ['مهندس', 'طبيب', 'محاسب', 'معلم', 'محامي', 'صيدلي', 'مصمم', 'مبرمج', 'صحفي', 'مدير'],
    domains: ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
  },
  JP: {
    code: 'JP',
    names: {
      male: ['Haruto', 'Yuto', 'Sota', 'Yuki', 'Hayato', 'Haruki', 'Ryota', 'Kota', 'Kaito', 'Sora', 'Riku', 'Hinata', 'Yamato', 'Ren', 'Takumi'],
      female: ['Yui', 'Hina', 'Aoi', 'Sakura', 'Riko', 'Himari', 'Mio', 'Yuna', 'Koharu', 'Mei', 'Sara', 'Rin', 'Akari', 'Yuzuki', 'Honoka']
    },
    lastNames: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto'],
    cities: [
      { name: 'Tokyo', state: 'Tokyo', zipFormat: '1##-####' },
      { name: 'Osaka', state: 'Osaka', zipFormat: '5##-####' },
      { name: 'Yokohama', state: 'Kanagawa', zipFormat: '2##-####' },
      { name: 'Nagoya', state: 'Aichi', zipFormat: '4##-####' },
      { name: 'Kyoto', state: 'Kyoto', zipFormat: '6##-####' },
      { name: 'Fukuoka', state: 'Fukuoka', zipFormat: '8##-####' }
    ],
    phoneFormat: '+81 ##-####-####',
    ssnFormat: '####-####-####',
    timezone: 'Asia/Tokyo',
    language: 'ja-JP',
    companies: ['Toyota', 'Sony', 'Honda', 'Nintendo', 'Panasonic', 'Mitsubishi', 'Hitachi', 'Canon', 'Toshiba', 'NTT'],
    occupations: ['エンジニア', '医者', '教師', '会計士', 'デザイナー', 'プログラマー', 'マネージャー', 'コンサルタント', '弁護士', '研究者'],
    domains: ['gmail.com', 'yahoo.co.jp', 'docomo.ne.jp', 'ezweb.ne.jp', 'softbank.ne.jp']
  }
};

// Street types by country
const streetTypes: Record<string, string[]> = {
  US: ['Street', 'Avenue', 'Boulevard', 'Drive', 'Lane', 'Court', 'Way', 'Place'],
  UK: ['Street', 'Road', 'Lane', 'Avenue', 'Close', 'Drive', 'Way', 'Gardens'],
  DE: ['Straße', 'Weg', 'Allee', 'Platz', 'Ring', 'Gasse'],
  FR: ['Rue', 'Avenue', 'Boulevard', 'Place', 'Chemin', 'Impasse'],
  SA: ['شارع', 'طريق', 'حي'],
  AE: ['شارع', 'طريق', 'حي'],
  EG: ['شارع', 'طريق', 'ميدان'],
  JP: ['通り', '丁目', '番地']
};

const streetNames: Record<string, string[]> = {
  US: ['Oak', 'Main', 'Cedar', 'Maple', 'Park', 'Pine', 'Washington', 'Lake', 'Hill', 'Sunset'],
  UK: ['High', 'Church', 'Station', 'Victoria', 'Green', 'King', 'Queen', 'Park', 'Mill', 'London'],
  DE: ['Haupt', 'Garten', 'Schiller', 'Goethe', 'Berg', 'Kirch', 'Bahn', 'Wald', 'Wiesen', 'Linden'],
  FR: ['de la Paix', 'Victor Hugo', 'de la République', 'du Commerce', 'du Marché', 'Pasteur', 'Voltaire'],
  SA: ['الملك فهد', 'الملك عبدالعزيز', 'التحلية', 'العليا', 'الأمير سلطان', 'خريص'],
  AE: ['الشيخ زايد', 'الاتحاد', 'الوصل', 'جميرا', 'المطار', 'خليفة'],
  EG: ['التحرير', 'رمسيس', 'الهرم', 'فيصل', 'مصر والسودان', 'الثورة'],
  JP: ['Sakura', 'Shibuya', 'Ginza', 'Shinjuku', 'Aoyama', 'Roppongi']
};

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNumber(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function formatPattern(pattern: string): string {
  return pattern.replace(/#/g, () => String(Math.floor(Math.random() * 10)))
                .replace(/A/g, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)));
}

function generateLuhnValidCC(): string {
  const prefixes = ['4', '51', '52', '53', '54', '55', '37'];
  const prefix = randomItem(prefixes);
  const length = prefix === '37' ? 15 : 16;
  
  let cc = prefix;
  while (cc.length < length - 1) {
    cc += Math.floor(Math.random() * 10);
  }
  
  // Calculate Luhn check digit
  let sum = 0;
  let isEven = true;
  for (let i = cc.length - 1; i >= 0; i--) {
    let digit = parseInt(cc[i]);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return cc + checkDigit;
}

function generatePassword(): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%&*';
  
  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  const all = lower + upper + numbers;
  for (let i = 0; i < 10; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function generateIdentity(countryCode: string = 'US'): GeneratedIdentity {
  const data = countryData[countryCode] || countryData.US;
  const gender: 'male' | 'female' = Math.random() > 0.5 ? 'male' : 'female';
  
  const firstName = randomItem(data.names[gender]);
  const lastName = randomItem(data.lastNames);
  const city = randomItem(data.cities);
  
  // Generate realistic age (18-65)
  const age = 18 + Math.floor(Math.random() * 47);
  const birthYear = new Date().getFullYear() - age;
  const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  
  // Generate address
  const streetNum = Math.floor(Math.random() * 9999) + 1;
  const streetName = randomItem(streetNames[countryCode] || streetNames.US);
  const streetType = randomItem(streetTypes[countryCode] || streetTypes.US);
  const address = ['SA', 'AE', 'EG'].includes(countryCode) 
    ? `${streetNum} ${streetType} ${streetName}`
    : `${streetNum} ${streetName} ${streetType}`;
  
  // Generate username variations
  const usernameStyles = [
    `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${birthYear.toString().slice(-2)}`,
    `${firstName[0].toLowerCase()}${lastName.toLowerCase()}${generateNumber(3)}`
  ];
  
  return {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 99)}@${randomItem(data.domains)}`,
    phone: formatPattern(data.phoneFormat),
    country: countryCode,
    countryCode: data.code,
    city: city.name,
    state: city.state,
    address,
    zipCode: formatPattern(city.zipFormat),
    dateOfBirth: `${birthYear}-${birthMonth}-${birthDay}`,
    age,
    gender,
    occupation: randomItem(data.occupations),
    company: randomItem(data.companies),
    username: randomItem(usernameStyles),
    password: generatePassword(),
    creditCard: generateLuhnValidCC(),
    cvv: generateNumber(3),
    expiry: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 6) + 25)}`,
    ssn: formatPattern(data.ssnFormat),
    passport: `${data.code}${generateNumber(8)}`,
    driverLicense: `${city.state.slice(0, 2).toUpperCase()}${generateNumber(8)}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}${Date.now()}`,
    nationality: countryCode,
    timezone: data.timezone,
    language: data.language,
    createdAt: new Date()
  };
}

// Get available countries
export function getAvailableCountries(): { code: string; name: string; nameAr: string }[] {
  return [
    { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة' },
    { code: 'UK', name: 'United Kingdom', nameAr: 'المملكة المتحدة' },
    { code: 'DE', name: 'Germany', nameAr: 'ألمانيا' },
    { code: 'FR', name: 'France', nameAr: 'فرنسا' },
    { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية' },
    { code: 'AE', name: 'UAE', nameAr: 'الإمارات' },
    { code: 'EG', name: 'Egypt', nameAr: 'مصر' },
    { code: 'JP', name: 'Japan', nameAr: 'اليابان' }
  ];
}

// Validate credit card using Luhn algorithm
export function validateCreditCard(cc: string): boolean {
  const digits = cc.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}
