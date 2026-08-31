/**
 * Supabase Backend Client Configuration & Utilities
 */

export const SUPABASE_CONFIG = {
  url:
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL)) ||
    'https://bbuupjdltzxddyjbqypy.supabase.co',
  anonKey:
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) ||
    'sb_publishable_uq7X9n2KvJYB5zSmCAkLAQ_torrsVXD',
}

export class SupabaseService {
  private url: string
  private key: string

  constructor() {
    this.url = SUPABASE_CONFIG.url
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
        headers: this.getHeaders(),
      })
      if (!response.ok) {
        return null
      }
      return (await response.json()) as T[]
    } catch {
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
    } catch {
      return null
    }
  }
}

export const supabaseClient = new SupabaseService()
export default supabaseClient
