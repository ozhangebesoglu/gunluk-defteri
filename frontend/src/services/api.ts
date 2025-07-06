// Single-Mode API Service - Always uses the backend API
import { logger } from '../utils/logger'
import { API_URL } from '../config/env'
import { supabase } from '../lib/supabase'
import type { DiaryEntry, DiaryTag } from '../types/diary';

// DTO (Data Transfer Object) types
export type CreateEntryDto = Omit<DiaryEntry, 'id' | 'created_at' | 'updated_at'>;
export type UpdateEntryDto = Partial<CreateEntryDto>;

// Re-export type for external use
export type { DiaryEntry, DiaryTag };

// API Configuration
const API_BASE_URL = API_URL;

// CSRF Token Management
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string | null> | null = null;

/**
 * Fetches the CSRF token from the backend and stores it.
 * This should be called once when the application initializes.
 * It now returns a promise that resolves when the token is fetched.
 */
export const initializeCsrfToken = (): Promise<string | null> => {
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = (async () => {
    try {
      // Use getSession to ensure we have the latest session data
      const { data: { session } } = await supabase.auth.getSession();
      
      // Only fetch CSRF token if user is logged in
      if (session) {
        logger.info('[API] Session found, fetching CSRF token...');
        const response = await fetch(`${API_BASE_URL}/csrf-token`);
        
        if (!response.ok) {
          throw new Error(`CSRF token could not be retrieved. Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.csrfToken) {
          throw new Error('CSRF token is empty in the response from server.');
        }

        csrfToken = data.csrfToken;
        logger.success('[API] CSRF Token initialized successfully.');
        return csrfToken;
      } else {
        logger.warn('[API] No active session found. Skipping CSRF token fetch.');
        csrfToken = null; // Ensure token is null if no session
        return null;
      }
    } catch (error) {
      logger.error('[API] Failed to initialize CSRF token:', error);
      csrfToken = null; // Ensure token is null on error
      csrfTokenPromise = null; // Allow re-fetching on next attempt
      // In a real-world scenario, you might want to prevent the user from
      // making state-changing requests or show a global error message.
      throw error; // Re-throw to allow callers to handle it
    }
  })();

  return csrfTokenPromise;
};

// Function to reset the CSRF token state, e.g., on logout
export const resetCsrfToken = () => {
    csrfToken = null;
    csrfTokenPromise = null;
    logger.info('[API] CSRF Token has been reset.');
};

/**
 * API istekleri için merkezi `fetch` fonksiyonu.
 * Otomatik olarak Authorization ve CSRF başlıklarını ekler.
 * Hata durumlarını ve boş yanıtları yönetir.
 */
const fetchApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const isStateChangingMethod = options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase());

    if (isStateChangingMethod) {
      if (!csrfToken) {
        logger.warn('[API] CSRF token is missing, attempting to fetch it now.');
        await initializeCsrfToken();
      }
      
      if (csrfToken) {
        headers.set('x-csrf-token', csrfToken);
      } else {
        logger.error('[API] CSRF token is still missing after fetch attempt. The request will likely fail.');
        throw new Error('İstemci taraflı güvenlik hatası: CSRF token alınamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
      }
    }

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const defaultOptions: RequestInit = {
      method: 'GET',
      headers,
      credentials: 'include',
    };

    logger.info(`[API] Fetching: ${API_BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers,
    });

    if (!response.ok) {
      const responseForJson = response.clone();
      try {
        const errorData = await responseForJson.json();
        logger.error(`[API] Error ${response.status}: `, errorData);
        const message = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
      } catch (e) {
        const errorText = await response.text();
        logger.error(`[API] Fetch failed with status ${response.status} and non-JSON response:`, errorText);
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
    }

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        // Sunucudan JSON gelmediyse, boş bir nesne veya null döndür.
        // Bu durum, '204 No Content' dışındaki durumları da kapsar.
        return {} as T;
    }
    
    return response.json() as Promise<T>;

  } catch (error) {
    logger.error('[API] Fetch failed:', error);
    throw error;
  }
};

export class ApiService {
  get mode(): string {
    return 'Backend API';
  }
  get environment(): string {
    return 'Unified';
  }

  // Health check
  async healthCheck() {
    return fetchApi('/health');
  }

  // Get all entries with pagination support
  async getEntries(options: { page?: number; limit?: number } = {}): Promise<{ data: any[]; totalCount: number }> {
    const params = new URLSearchParams();
    if (options.page) {
      params.set('page', String(options.page));
    }
    if (options.limit) {
      params.set('limit', String(options.limit));
    }
    const result = await fetchApi<{ data: any[], totalCount: number }>(`/entries?${params.toString()}`);
    return result || { data: [], totalCount: 0 };
  }
  
  // Get entry by ID
  async getEntryById(id: string): Promise<any | null> {
    return fetchApi(`/entries/${id}`);
  }

  // Get entry by ID (alias)
  async getEntry(id: string): Promise<any | null> {
    return this.getEntryById(id);
  }

  // Create new entry
  async createEntry(entry: any): Promise<any> {
    return fetchApi('/entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  // Update entry
  async updateEntry(id: string, updates: any): Promise<any> {
    return fetchApi(`/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Delete entry
  async deleteEntry(id: string): Promise<void> {
    await fetchApi(`/entries/${id}`, { method: 'DELETE' });
  }

  // Delete all entries
  async deleteAllEntries(): Promise<void> {
    await fetchApi(`/entries`, { method: 'DELETE' });
  }

  // Toggle favorite
  async toggleFavorite(id: string): Promise<any> {
    return fetchApi(`/entries/${id}/favorite`, { method: 'POST' });
  }

  // Get stats
  async getStats(): Promise<any> {
    return fetchApi('/stats');
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      // Throw an error with the message from the backend
      throw new Error(data.message || 'Password reset request failed');
    }
    return data;
  }

  // Update user password
  async updatePassword(password: string | null): Promise<any> {
    return fetchApi('/user/password', {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  }
}

export const apiService = new ApiService()

// Initialize CSRF token as soon as the module is loaded
// This ensures it's ready for any subsequent API calls.
// We'll call it but we don't need to block on the promise here.
// It will be awaited in fetchApi if needed.
initializeCsrfToken().catch(() => {
  // We can ignore the error here because it's already logged inside the function
  // and will be handled during the actual API call.
  // This initial call is just to start the process early.
}); 