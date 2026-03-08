/**
 * Offline Storage Manager for Now-Now Assist
 * 
 * Handles local persistence of non-sensitive data for offline-first support.
 * Uses localStorage for simplicity and broad device compatibility.
 * 
 * SECURITY: Never stores card details, tokens, or passwords locally.
 * Only caches: user name, phone, vehicles, last location, and pending drafts.
 */

const STORAGE_KEYS = {
  CACHED_PROFILE: 'nna_cached_profile',
  CACHED_VEHICLES: 'nna_cached_vehicles',
  LAST_LOCATION: 'nna_last_location',
  PENDING_DRAFTS: 'nna_pending_drafts',
} as const;

// ── Request Status Model ──
export type RequestStatus = 'draft' | 'pending_sync' | 'submitted' | 'failed';

export interface PendingJobDraft {
  id: string;
  serviceId: string;
  serviceName: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  estimatedPrice: number;
  etaMinutes: number;
  notes?: string;
  status: RequestStatus;
  createdAt: string;
  lastRetryAt?: string;
  retryCount: number;
  errorMessage?: string;
}

export interface CachedProfile {
  fullName: string | null;
  phone: string | null;
}

export interface CachedVehicle {
  id: string;
  make: string;
  model: string | null;
  registrationNumber: string;
  color: string | null;
  isDefault: boolean;
}

export interface CachedLocation {
  address: string;
  lat: number;
  lng: number;
  cachedAt: string;
}

// ── Profile Cache ──
export function cacheProfile(profile: CachedProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CACHED_PROFILE, JSON.stringify(profile));
  } catch { /* quota exceeded — silently fail */ }
}

export function getCachedProfile(): CachedProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHED_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Vehicle Cache ──
export function cacheVehicles(vehicles: CachedVehicle[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CACHED_VEHICLES, JSON.stringify(vehicles));
  } catch { /* silently fail */ }
}

export function getCachedVehicles(): CachedVehicle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHED_VEHICLES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── Location Cache ──
export function cacheLastLocation(location: CachedLocation): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_LOCATION, JSON.stringify(location));
  } catch { /* silently fail */ }
}

export function getCachedLocation(): CachedLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_LOCATION);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Pending Job Drafts ──
export function getPendingDrafts(): PendingJobDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_DRAFTS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDrafts(drafts: PendingJobDraft[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PENDING_DRAFTS, JSON.stringify(drafts));
  } catch { /* silently fail */ }
}

export function addPendingDraft(draft: Omit<PendingJobDraft, 'id' | 'createdAt' | 'retryCount' | 'status'>): PendingJobDraft {
  const newDraft: PendingJobDraft = {
    ...draft,
    id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending_sync',
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  const drafts = getPendingDrafts();
  drafts.push(newDraft);
  saveDrafts(drafts);
  return newDraft;
}

export function updateDraftStatus(draftId: string, status: RequestStatus, errorMessage?: string): void {
  const drafts = getPendingDrafts();
  const idx = drafts.findIndex(d => d.id === draftId);
  if (idx !== -1) {
    drafts[idx].status = status;
    drafts[idx].lastRetryAt = new Date().toISOString();
    drafts[idx].retryCount += 1;
    if (errorMessage) drafts[idx].errorMessage = errorMessage;
    saveDrafts(drafts);
  }
}

export function removeDraft(draftId: string): void {
  const drafts = getPendingDrafts().filter(d => d.id !== draftId);
  saveDrafts(drafts);
}

export function getDraftsToSync(): PendingJobDraft[] {
  return getPendingDrafts().filter(d => d.status === 'pending_sync' || d.status === 'failed');
}

export function clearAllOfflineData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  });
}
