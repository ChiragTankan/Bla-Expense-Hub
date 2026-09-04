/**
 * Supabase Backend Client Configuration & Robust REST Data Transformer Engine
 */

export const SUPABASE_CONFIG = {
  url:
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      (import.meta.env.VITE_SUPABASE_URL ||
        import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
        import.meta.env.SUPABASE_URL)) ||
    'https://bbuupjdltzxddyjbqypy.supabase.co',
  anonKey:
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      (import.meta.env.VITE_SUPABASE_ANON_KEY ||
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
        import.meta.env.SUPABASE_SECRET_KEY)) ||
    'sb_publishable_uq7X9n2KvJYB5zSmCAkLAQ_torrsVXD',
  secretKey:
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      (import.meta.env.SUPABASE_SECRET_KEY || import.meta.env.VITE_SUPABASE_SECRET_KEY)) ||
    'sb_secret_D0m1p-1KVuBAMtVpIz6i7g_GGQjk9WR',
  jwksUrl:
    'https://bbuupjdltzxddyjbqypy.supabase.co/auth/v1/.well-known/jwks.json',
}

// Convert camelCase keys to snake_case for Supabase PostgreSQL tables
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    result[snakeKey] = obj[key]
  }
  return result
}

// Convert snake_case keys to camelCase for Frontend JavaScript models
function toCamelCase<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = obj[key]
  }
  return result as T
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
      const rawRows = (await response.json()) as Record<string, unknown>[]
      if (!Array.isArray(rawRows)) return null
      return rawRows.map((row) => toCamelCase<T>(row))
    } catch (err) {
      console.warn(`Supabase fetchTable [${table}] fallback:`, err)
      return null
    }
  }

  public async insertRow<T extends Record<string, unknown>>(table: string, data: T): Promise<T | null> {
    try {
      const payload = toSnakeCase(data)
      const response = await fetch(`${this.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`Supabase insertRow [${table}] failed: ${response.status}`, errorText)
        return null
      }
      const res = await response.json()
      const raw = Array.isArray(res) ? res[0] : res
      return raw ? toCamelCase<T>(raw) : data
    } catch (err) {
      console.warn(`Supabase insertRow [${table}] fallback:`, err)
      return null
    }
  }

  public async updateRow<T extends Record<string, unknown>>(
    table: string,
    matchKey: string,
    matchVal: string,
    data: Partial<T>
  ): Promise<T | null> {
    try {
      const snakeMatchKey = matchKey.replace(/([A-Z])/g, '_$1').toLowerCase()
      const payload = toSnakeCase(data as Record<string, unknown>)
      const response = await fetch(
        `${this.url}/rest/v1/${table}?${snakeMatchKey}=eq.${encodeURIComponent(matchVal)}`,
        {
          method: 'PATCH',
          headers: {
            ...this.getHeaders(),
            Prefer: 'return=representation',
          },
          body: JSON.stringify(payload),
        }
      )
      if (!response.ok) {
        return null
      }
      const res = await response.json()
      const raw = Array.isArray(res) ? res[0] : res
      return raw ? toCamelCase<T>(raw) : (data as T)
    } catch (err) {
      console.warn(`Supabase updateRow [${table}] fallback:`, err)
      return null
    }
  }

  public async deleteRow(table: string, matchKey: string, matchVal: string): Promise<boolean> {
    try {
      const snakeMatchKey = matchKey.replace(/([A-Z])/g, '_$1').toLowerCase()
      const response = await fetch(
        `${this.url}/rest/v1/${table}?${snakeMatchKey}=eq.${encodeURIComponent(matchVal)}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      )
      return response.ok
    } catch {
      return false
    }
  }
}

export const supabaseClient = new SupabaseService()
export default supabaseClient
