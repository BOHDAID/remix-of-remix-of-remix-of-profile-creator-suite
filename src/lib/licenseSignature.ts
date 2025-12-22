// License signature verification
// This uses a simple hash-based signature to verify license authenticity

const SECRET_KEY = 'BHD-LICENSE-SECRET-2024-XK9M';

// Simple hash function for signature
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and make it longer by repeating the process
  let result = Math.abs(hash).toString(16);
  
  // Create a more complex signature
  let signature = '';
  for (let i = 0; i < 4; i++) {
    let subHash = 0;
    const subStr = str + SECRET_KEY + i.toString();
    for (let j = 0; j < subStr.length; j++) {
      const char = subStr.charCodeAt(j);
      subHash = ((subHash << 5) - subHash) + char;
      subHash = subHash & subHash;
    }
    signature += Math.abs(subHash).toString(16).padStart(8, '0');
  }
  
  return signature.toUpperCase();
}

// Generate signature for license data
export function generateLicenseSignature(data: {
  k: string;
  t: string;
  m: number;
  e: string | null;
  c: number;
}): string {
  const payload = `${data.k}|${data.t}|${data.m}|${data.e || 'null'}|${data.c}|${SECRET_KEY}`;
  return simpleHash(payload);
}

// Verify license signature
export function verifyLicenseSignature(data: {
  k: string;
  t: string;
  m: number;
  e: string | null;
  c: number;
  s: string; // signature
}): boolean {
  const expectedSignature = generateLicenseSignature({
    k: data.k,
    t: data.t,
    m: data.m,
    e: data.e,
    c: data.c,
  });
  
  return data.s === expectedSignature;
}
