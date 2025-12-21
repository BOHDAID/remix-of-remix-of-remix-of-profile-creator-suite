// License revocation check utility
// Checks against a remote JSON file to see if a license has been revoked

interface RevokedLicensesData {
  version: number;
  updatedAt: string;
  revokedKeys: string[];
}

const REVOCATION_CHECK_KEY = 'license-revocation-url';
const REVOKED_KEYS_CACHE = 'revoked-licenses-cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

export function setRevocationUrl(url: string): void {
  localStorage.setItem(REVOCATION_CHECK_KEY, url);
}

export function getRevocationUrl(): string | null {
  return localStorage.getItem(REVOCATION_CHECK_KEY);
}

export async function checkLicenseRevocation(licenseKey: string): Promise<boolean> {
  const url = getRevocationUrl();
  
  // If no revocation URL is set, license is not revoked
  if (!url) {
    return false;
  }

  try {
    // Check cache first
    const cached = getCachedRevokedKeys();
    if (cached) {
      return cached.includes(licenseKey);
    }

    // Fetch fresh data
    const response = await fetch(url, {
      cache: 'no-cache',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch revocation list:', response.status);
      return false;
    }

    const data: RevokedLicensesData = await response.json();
    
    // Cache the result
    cacheRevokedKeys(data.revokedKeys);
    
    return data.revokedKeys.includes(licenseKey);
  } catch (error) {
    console.warn('Error checking license revocation:', error);
    // On network error, check cached data
    const cached = getCachedRevokedKeys();
    if (cached) {
      return cached.includes(licenseKey);
    }
    return false;
  }
}

function getCachedRevokedKeys(): string[] | null {
  try {
    const cached = localStorage.getItem(REVOKED_KEYS_CACHE);
    if (!cached) return null;
    
    const { keys, timestamp } = JSON.parse(cached);
    
    // Check if cache is still valid
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(REVOKED_KEYS_CACHE);
      return null;
    }
    
    return keys;
  } catch {
    return null;
  }
}

function cacheRevokedKeys(keys: string[]): void {
  localStorage.setItem(REVOKED_KEYS_CACHE, JSON.stringify({
    keys,
    timestamp: Date.now(),
  }));
}

// Clear the revocation cache (useful when updating settings)
export function clearRevocationCache(): void {
  localStorage.removeItem(REVOKED_KEYS_CACHE);
}
