export function clearPersistedLicense(storageKey = 'browser-manager-storage') {
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.state) {
      parsed.state.license = null;
      window.localStorage.setItem(storageKey, JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
}
