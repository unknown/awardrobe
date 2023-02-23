export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      prices: {
        Row: {
          created_at: string
          id: string
          in_stock: boolean
          price_in_cents: number
          size: string
          stock: number | null
          store_id: string
          style: string
        }
        Insert: {
          created_at?: string
          id?: string
          in_stock: boolean
          price_in_cents: number
          size: string
          stock?: number | null
          store_id: string
          style: string
        }
        Update: {
          created_at?: string
          id?: string
          in_stock?: boolean
          price_in_cents?: number
          size?: string
          stock?: number | null
          store_id?: string
          style?: string
        }
      }
      stores: {
        Row: {
          created_at: string | null
          id: string
          name: string
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
