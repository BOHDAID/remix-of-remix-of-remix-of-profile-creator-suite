import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Key,
  Copy,
  CheckCircle2,
  Plus,
  Trash2,
  Download,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { generateLicenseSignature } from '@/lib/licenseSignature';

interface GeneratedLicense {
  id: string;
  clientName: string;
  clientEmail: string;
  type: string;
  maxProfiles: number;
  days: number;
  createdAt: string;
  expiresAt: string | null;
  key: string;
  activationCode: string;
}

const LICENSE_TYPES = {
  trial: { name: 'تجريبي', maxProfiles: 3, defaultDays: 7 },
  basic: { name: 'أساسي', maxProfiles: 10, defaultDays: 365 },
  pro: { name: 'احترافي', maxProfiles: 50, defaultDays: 365 },
  enterprise: { name: 'مؤسسات', maxProfiles: -1, defaultDays: 365 },
};

// Generate random license key
function generateKey(): string {
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

// Create activation code with signature
function createActivationCode(license: {
  key: string;
  type: string;
  maxProfiles: number;
  expiresAt: string | null;
}): string {
  const timestamp = Date.now();
  const data = {
    k: license.key,
    t: license.type,
    m: license.maxProfiles,
    e: license.expiresAt,
    c: timestamp,
    s: '', // Will be filled
  };
  // Generate signature
  data.s = generateLicenseSignature({
    k: data.k,
    t: data.t,
    m: data.m,
    e: data.e,
    c: data.c,
  });
  return btoa(JSON.stringify(data));
}

// Load licenses from localStorage
function loadLicenses(): GeneratedLicense[] {
  try {
    const saved = localStorage.getItem('admin-licenses');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Save licenses to localStorage
function saveLicenses(licenses: GeneratedLicense[]) {
  localStorage.setItem('admin-licenses', JSON.stringify(licenses));
}

export function LicenseAdminView() {
  const [licenses, setLicenses] = useState<GeneratedLicense[]>(loadLicenses);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [licenseType, setLicenseType] = useState<keyof typeof LICENSE_TYPES>('basic');
  const [days, setDays] = useState(365);
  const [maxProfiles, setMaxProfiles] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleTypeChange = (type: keyof typeof LICENSE_TYPES) => {
    setLicenseType(type);
    setMaxProfiles(LICENSE_TYPES[type].maxProfiles);
    setDays(LICENSE_TYPES[type].defaultDays);
  };

  const createLicense = () => {
    if (!clientName.trim()) {
      toast.error('يرجى إدخال اسم العميل');
      return;
    }

    const key = generateKey();
    const expiresAt = days > 0 
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() 
      : null;

    const activationCode = createActivationCode({
      key,
      type: licenseType,
      maxProfiles,
      expiresAt,
    });

    const newLicense: GeneratedLicense = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      type: licenseType,
      maxProfiles,
      days,
      createdAt: new Date().toISOString(),
      expiresAt,
      key,
      activationCode,
    };

    const updatedLicenses = [newLicense, ...licenses];
    setLicenses(updatedLicenses);
    saveLicenses(updatedLicenses);

    // Reset form
    setClientName('');
    setClientEmail('');
    toast.success('تم إنشاء الترخيص بنجاح!');
  };

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast.success('تم نسخ كود التفعيل');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('فشل في النسخ');
    }
  };

  const deleteLicense = (id: string) => {
    const updatedLicenses = licenses.filter(l => l.id !== id);
    setLicenses(updatedLicenses);
    saveLicenses(updatedLicenses);
    toast.info('تم حذف الترخيص');
  };

  const exportLicenses = () => {
    const dataStr = JSON.stringify(licenses, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `licenses-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير التراخيص');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          إدارة التراخيص
        </h1>
        <p className="text-muted-foreground mt-1">
          إنشاء وإدارة تراخيص البرنامج
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create License Form */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            إنشاء ترخيص جديد
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">اسم العميل *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="أدخل اسم العميل"
                className="bg-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">البريد الإلكتروني (اختياري)</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="email@example.com"
                className="bg-input"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>نوع الترخيص</Label>
              <Select value={licenseType} onValueChange={(v) => handleTypeChange(v as keyof typeof LICENSE_TYPES)}>
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">تجريبي (3 بروفايلات، 7 أيام)</SelectItem>
                  <SelectItem value="basic">أساسي (10 بروفايلات)</SelectItem>
                  <SelectItem value="pro">احترافي (50 بروفايل)</SelectItem>
                  <SelectItem value="enterprise">مؤسسات (غير محدود)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="days">عدد الأيام</Label>
                <Input
                  id="days"
                  type="number"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                  className="bg-input"
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxProfiles">عدد البروفايلات</Label>
                <Input
                  id="maxProfiles"
                  type="number"
                  value={maxProfiles}
                  onChange={(e) => setMaxProfiles(parseInt(e.target.value) || 0)}
                  className="bg-input"
                  min={-1}
                />
                <p className="text-xs text-muted-foreground">-1 = غير محدود</p>
              </div>
            </div>

            <Button variant="glow" onClick={createLicense} className="w-full">
              <Key className="w-4 h-4 ml-2" />
              إنشاء الترخيص
            </Button>
          </div>
        </div>

        {/* Licenses List */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              التراخيص ({licenses.length})
            </h2>
            {licenses.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportLicenses}>
                <Download className="w-4 h-4 ml-1" />
                تصدير
              </Button>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {licenses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                لا توجد تراخيص بعد
              </p>
            ) : (
              licenses.map((license) => {
                const isExpired = license.expiresAt && new Date(license.expiresAt) < new Date();
                
                return (
                  <div
                    key={license.id}
                    className={cn(
                      "bg-muted/50 rounded-lg p-4 space-y-2",
                      isExpired && "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{license.clientName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {LICENSE_TYPES[license.type as keyof typeof LICENSE_TYPES]?.name} • 
                          {license.maxProfiles === -1 ? ' غير محدود' : ` ${license.maxProfiles} بروفايل`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(license.activationCode, license.id)}
                        >
                          {copiedId === license.id ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteLicense(license.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <p className="text-muted-foreground">
                        المفتاح: <span className="font-mono text-foreground">{license.key}</span>
                      </p>
                      <p className="text-muted-foreground">
                        {isExpired ? (
                          <span className="text-destructive">منتهي الصلاحية</span>
                        ) : (
                          <>
                            الانتهاء: {license.expiresAt 
                              ? new Date(license.expiresAt).toLocaleDateString('ar-SA')
                              : 'مدى الحياة'
                            }
                          </>
                        )}
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-1">كود التفعيل:</p>
                      <code className="text-xs bg-background/50 p-2 rounded block break-all font-mono">
                        {license.activationCode}
                      </code>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
