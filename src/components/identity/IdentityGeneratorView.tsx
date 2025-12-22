import { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Building2, 
  RefreshCw,
  Copy,
  Download,
  Globe,
  Calendar,
  Briefcase,
  FileText,
  Image,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Users,
  Key,
  IdCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generateIdentity, getAvailableCountries, type GeneratedIdentity } from '@/lib/identityGenerator';

interface Identity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  zipCode: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  occupation: string;
  company: string;
  username: string;
  password: string;
  creditCard: string;
  cvv: string;
  expiry: string;
  ssn: string;
  avatar: string;
  createdAt: Date;
}

const countries = [
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة' },
  { code: 'UK', name: 'United Kingdom', nameAr: 'المملكة المتحدة' },
  { code: 'DE', name: 'Germany', nameAr: 'ألمانيا' },
  { code: 'FR', name: 'France', nameAr: 'فرنسا' },
  { code: 'CA', name: 'Canada', nameAr: 'كندا' },
  { code: 'AU', name: 'Australia', nameAr: 'أستراليا' },
  { code: 'JP', name: 'Japan', nameAr: 'اليابان' },
  { code: 'AE', name: 'UAE', nameAr: 'الإمارات' },
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر' },
];

const firstNames = {
  male: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph'],
  female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica']
};
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
const occupations = ['Software Engineer', 'Marketing Manager', 'Financial Analyst', 'Teacher', 'Doctor', 'Designer', 'Consultant', 'Sales Manager'];
const companies = ['Tech Corp', 'Global Solutions', 'Innovative Systems', 'Digital Dynamics', 'Smart Technologies', 'Future Labs'];

function generateRandomIdentity(country: string = 'US'): Identity {
  const gender: 'male' | 'female' = Math.random() > 0.5 ? 'male' : 'female';
  const firstName = firstNames[gender][Math.floor(Math.random() * firstNames[gender].length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const year = 1970 + Math.floor(Math.random() * 35);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');

  return {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}@gmail.com`,
    phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    country,
    city: cities[Math.floor(Math.random() * cities.length)],
    address: `${Math.floor(Math.random() * 9999) + 1} ${['Main', 'Oak', 'Pine', 'Maple', 'Cedar'][Math.floor(Math.random() * 5)]} Street`,
    zipCode: String(Math.floor(Math.random() * 90000) + 10000),
    dateOfBirth: `${year}-${month}-${day}`,
    gender,
    occupation: occupations[Math.floor(Math.random() * occupations.length)],
    company: companies[Math.floor(Math.random() * companies.length)],
    username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}`,
    password: `${firstName}${Math.floor(Math.random() * 9999)}!@#`,
    creditCard: `4${Array.from({length: 15}, () => Math.floor(Math.random() * 10)).join('')}`,
    cvv: String(Math.floor(Math.random() * 900) + 100),
    expiry: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 5) + 25)}`,
    ssn: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`,
    createdAt: new Date()
  };
}

export function IdentityGeneratorView() {
  const { isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState('generator');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [includeFinancial, setIncludeFinancial] = useState(true);
  const [currentIdentity, setCurrentIdentity] = useState<GeneratedIdentity | null>(null);
  const [savedIdentities, setSavedIdentities] = useState<GeneratedIdentity[]>([]);
  
  const countries = getAvailableCountries();

  const handleGenerateIdentity = () => {
    const identity = generateIdentity(selectedCountry);
    setCurrentIdentity(identity);
    toast.success(isRTL ? 'تم توليد هوية جديدة!' : 'New identity generated!', {
      description: `${identity.firstName} ${identity.lastName} - ${identity.city}, ${identity.country}`
    });
  };

  const copyField = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    toast.success(isRTL ? `تم نسخ ${field}` : `${field} copied`);
  };

  const saveIdentity = () => {
    if (currentIdentity) {
      setSavedIdentities(prev => [currentIdentity, ...prev]);
      toast.success(isRTL ? 'تم حفظ الهوية' : 'Identity saved');
    }
  };

  const deleteIdentity = (id: string) => {
    setSavedIdentities(prev => prev.filter(i => i.id !== id));
    toast.success(isRTL ? 'تم حذف الهوية' : 'Identity deleted');
  };

  const exportIdentity = (identity: Identity) => {
    const data = JSON.stringify(identity, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `identity-${identity.firstName}-${identity.lastName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const IdentityField = ({ icon: Icon, label, value, copyable = true }: { 
    icon: any; 
    label: string; 
    value: string;
    copyable?: boolean;
  }) => (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-medium text-sm">{value}</p>
        </div>
      </div>
      {copyable && (
        <Button variant="ghost" size="icon" onClick={() => copyField(value, label)}>
          <Copy className="w-4 h-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isRTL ? 'مولد الهويات الذكي' : 'AI Identity Generator'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL ? 'توليد هويات واقعية ومتسقة للبروفايلات' : 'Generate realistic and consistent identities'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 px-3 py-1.5">
          <Sparkles className="w-3 h-3" />
          AI-Powered
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card">
          <TabsTrigger value="generator">{isRTL ? 'توليد' : 'Generator'}</TabsTrigger>
          <TabsTrigger value="saved">
            {isRTL ? 'المحفوظة' : 'Saved'} ({savedIdentities.length})
          </TabsTrigger>
          <TabsTrigger value="business">{isRTL ? 'شركات' : 'Business'}</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{isRTL ? 'الإعدادات' : 'Settings'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{isRTL ? 'الدولة' : 'Country'}</label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {isRTL ? c.nameAr : c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {isRTL ? 'تضمين البيانات المالية' : 'Include Financial Data'}
                  </label>
                  <Switch checked={includeFinancial} onCheckedChange={setIncludeFinancial} />
                </div>

                <Button onClick={handleGenerateIdentity} className="w-full" size="lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isRTL ? 'توليد هوية جديدة' : 'Generate New Identity'}
                </Button>

                {currentIdentity && (
                  <div className="flex gap-2">
                    <Button onClick={saveIdentity} variant="outline" className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      {isRTL ? 'حفظ' : 'Save'}
                    </Button>
                    <Button onClick={() => exportIdentity(currentIdentity)} variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      {isRTL ? 'تصدير' : 'Export'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generated Identity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">{isRTL ? 'الهوية المولدة' : 'Generated Identity'}</CardTitle>
              </CardHeader>
              <CardContent>
                {currentIdentity ? (
                  <div className="space-y-6">
                    {/* Avatar & Name */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={currentIdentity.avatar} />
                        <AvatarFallback>{currentIdentity.firstName[0]}{currentIdentity.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-bold">{currentIdentity.firstName} {currentIdentity.lastName}</h3>
                        <p className="text-muted-foreground">{currentIdentity.occupation} at {currentIdentity.company}</p>
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <IdentityField icon={Mail} label={isRTL ? 'البريد الإلكتروني' : 'Email'} value={currentIdentity.email} />
                      <IdentityField icon={Phone} label={isRTL ? 'الهاتف' : 'Phone'} value={currentIdentity.phone} />
                      <IdentityField icon={Calendar} label={isRTL ? 'تاريخ الميلاد' : 'Date of Birth'} value={currentIdentity.dateOfBirth} />
                      <IdentityField icon={User} label={isRTL ? 'اسم المستخدم' : 'Username'} value={currentIdentity.username} />
                    </div>

                    {/* Address */}
                    <div className="grid grid-cols-2 gap-3">
                      <IdentityField icon={MapPin} label={isRTL ? 'العنوان' : 'Address'} value={currentIdentity.address} />
                      <IdentityField icon={Globe} label={isRTL ? 'المدينة' : 'City'} value={currentIdentity.city} />
                      <IdentityField icon={MapPin} label={isRTL ? 'الرمز البريدي' : 'ZIP Code'} value={currentIdentity.zipCode} />
                      <IdentityField icon={Globe} label={isRTL ? 'الدولة' : 'Country'} value={currentIdentity.country} />
                    </div>

                    {/* Financial */}
                    {includeFinancial && (
                      <div className="grid grid-cols-2 gap-3">
                        <IdentityField icon={CreditCard} label={isRTL ? 'بطاقة الائتمان' : 'Credit Card'} value={currentIdentity.creditCard} />
                        <IdentityField icon={CreditCard} label="CVV" value={currentIdentity.cvv} />
                        <IdentityField icon={CreditCard} label={isRTL ? 'تاريخ الانتهاء' : 'Expiry'} value={currentIdentity.expiry} />
                        <IdentityField icon={FileText} label="SSN" value={currentIdentity.ssn} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <User className="w-16 h-16 mb-4 opacity-20" />
                    <p>{isRTL ? 'اضغط على توليد هوية جديدة' : 'Click Generate New Identity to start'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'الهويات المحفوظة' : 'Saved Identities'}</CardTitle>
              <CardDescription>
                {isRTL ? 'إدارة الهويات المحفوظة' : 'Manage your saved identities'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedIdentities.length > 0 ? (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {savedIdentities.map((identity) => (
                      <div 
                        key={identity.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={identity.avatar} />
                            <AvatarFallback>{identity.firstName[0]}{identity.lastName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{identity.firstName} {identity.lastName}</p>
                            <p className="text-sm text-muted-foreground">{identity.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{identity.country}</Badge>
                          <Button variant="ghost" size="icon" onClick={() => {
                            setCurrentIdentity(identity);
                            setActiveTab('generator');
                          }}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => exportIdentity(identity)}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteIdentity(identity.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="w-16 h-16 mb-4 opacity-20" />
                  <p>{isRTL ? 'لا توجد هويات محفوظة' : 'No saved identities'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {isRTL ? 'مولد هويات الشركات' : 'Business Identity Generator'}
              </CardTitle>
              <CardDescription>
                {isRTL ? 'توليد بيانات شركات واقعية' : 'Generate realistic business data'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Building2 className="w-16 h-16 mb-4 opacity-20" />
                <p>{isRTL ? 'قريباً...' : 'Coming soon...'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
