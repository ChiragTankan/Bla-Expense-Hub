/**
 * Supabase Backend Client Configuration & Cloud Database Sync Engine
 */

export const SUPABASE_CONFIG = {
  url:
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL)) ||
    'https://bbuupjdltzxddyjbqypy.supabase.co',
  anonKey:
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      (import.meta.env.VITE_SUPABASE_ANON_KEY ||
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) ||
    'sb_publishable_uq7X9n2KvJYB5zSmCAkLAQ_torrsVXD',
}

export class SupabaseService {
  private url: string
  private key: string

  constructor() {
    this.url = SUPABASE_CONFIG.url.replace(/\/$/, '')
    this.key = SUPABASE_CONFIG.anonKey
  }

  public getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
    }
  }

  public async fetchTable<T>(table: string): Promise<T[] | null> {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}?select=*`, {
        method: 'GET',
        headers: this.getHeaders(),
      })
      if (!response.ok) {
        return null
      }
      return (await response.json()) as T[]
    } catch (err) {
      console.warn(`Supabase fetchTable [${table}] fallback:`, err)
      return null
    }
  }

  public async insertRow<T>(table: string, data: Partial<T>): Promise<T | null> {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          Prefer: 'return=representation',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        return null
      }
      const res = await response.json()
      return Array.isArray(res) ? res[0] : res
    } catch (err) {
      console.warn(`Supabase insertRow [${table}] fallback:`, err)
      return null
    }
  }

  public async updateRow<T>(table: string, matchKey: string, matchVal: string, data: Partial<T>): Promise<T | null> {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}?${matchKey}=eq.${encodeURIComponent(matchVal)}`, {
        method: 'PATCH',
        headers: {
          ...this.getHeaders(),
          Prefer: 'return=representation',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        return null
      }
      const res = await response.json()
      return Array.isArray(res) ? res[0] : res
    } catch (err) {
      console.warn(`Supabase updateRow [${table}] fallback:`, err)
      return null
    }
  }

  public async deleteRow(table: string, matchKey: string, matchVal: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}?${matchKey}=eq.${encodeURIComponent(matchVal)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })
      return response.ok
    } catch {
      return false
    }
  }
}

export const supabaseClient = new SupabaseService()
export default supabaseClient
