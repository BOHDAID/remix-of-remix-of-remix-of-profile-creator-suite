// Identity Generator Types

export interface GeneratedIdentity {
  id: string;
  // Personal Info
  firstName: string;
  lastName: string;
  fullName: string;
  gender: 'male' | 'female';
  age: number;
  dateOfBirth: string;
  
  // Contact
  email: string;
  phone: string;
  
  // Address
  country: string;
  countryCode: string;
  city: string;
  state: string;
  street: string;
  zipCode: string;
  
  // Online
  username: string;
  password: string;
  userAgent: string;
  
  // Financial (fake for forms)
  creditCard: string;
  cvv: string;
  expiryDate: string;
  bankName: string;
  
  // Documents
  ssn: string;
  passport: string;
  driverLicense: string;
  
  // Social
  avatar: string;
  bio: string;
  occupation: string;
  company: string;
  
  // Metadata
  createdAt: Date;
  nationality: string;
  timezone: string;
}

export interface PersonaProfile {
  id: string;
  name: string;
  identity: GeneratedIdentity;
  behaviorPattern: 'casual' | 'professional' | 'tech-savvy' | 'elderly';
  interests: string[];
  socialProfiles: SocialProfile[];
  documents: DocumentTemplate[];
  createdAt: Date;
}

export interface SocialProfile {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'tiktok';
  username: string;
  email: string;
  password: string;
  profileUrl?: string;
  created: boolean;
}

export interface DocumentTemplate {
  id: string;
  type: 'id_card' | 'passport' | 'driver_license' | 'utility_bill' | 'bank_statement';
  data: Record<string, string>;
  generated: boolean;
}

export interface BusinessIdentity {
  id: string;
  companyName: string;
  industry: string;
  registrationNumber: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  foundedDate: string;
  employeeCount: number;
  revenue: string;
  logo?: string;
  createdAt: Date;
}

export interface IdentityGeneratorConfig {
  defaultCountry: string;
  defaultLanguage: string;
  ageRange: { min: number; max: number };
  includeFinancial: boolean;
  includeDocuments: boolean;
  avatarStyle: 'realistic' | 'cartoon' | 'abstract';
}
