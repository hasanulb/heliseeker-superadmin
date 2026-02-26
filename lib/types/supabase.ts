import { SupabaseClient } from '@supabase/supabase-js'

// Use a generic Database type for now - you can replace this with your generated types
export type Database = any

export type TypedSupabaseClient = SupabaseClient<Database>