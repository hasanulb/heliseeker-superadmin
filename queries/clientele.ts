import { TypedSupabaseClient } from '@/lib/types/supabase'
import { ClienteleGroupFormInputType, ClientLogoFormInputType, ReorderRequestType } from '@/app/admin/content/clientele/types'

// Groups Queries
export function getClienteleGroups(client: TypedSupabaseClient, includeLogos: boolean = false) {
  if (includeLogos) {
    return client
      .from('clientele_groups')
      .select(`
        *,
        client_logos (*)
      `)
      .order('order_index', { ascending: true })
  } else {
    return client
      .from('clientele_groups')
      .select('*')
      .order('order_index', { ascending: true })
  }
}

export function getClienteleGroupById(client: TypedSupabaseClient, id: string) {
  return client
    .from('clientele_groups')
    .select(`
      *,
      client_logos (*)
    `)
    .eq('group_id', id)
    .single()
}

export function createClienteleGroup(client: TypedSupabaseClient, data: ClienteleGroupFormInputType) {
  return client
    .from('clientele_groups')
    .insert([data])
    .select()
    .single()
}

export function updateClienteleGroup(client: TypedSupabaseClient, id: string, data: ClienteleGroupFormInputType) {
  return client
    .from('clientele_groups')
    .update(data)
    .eq('group_id', id)
    .select()
    .single()
}

export function deleteClienteleGroup(client: TypedSupabaseClient, id: string) {
  return client
    .from('clientele_groups')
    .delete()
    .eq('group_id', id)
}

export function reorderClienteleGroups(client: TypedSupabaseClient, items: ReorderRequestType['items']) {
  // Note: This needs to be handled via API route for batch updates
  // Supabase doesn't support batch updates directly in the client
  return Promise.resolve()
}

// Logos Queries
export function getClientLogos(client: TypedSupabaseClient, groupId?: string) {
  let query = client.from('client_logos').select('*')

  if (groupId) {
    query = query.eq('group_id', groupId)
  }

  return query.order('order_index', { ascending: true })
}

export function getClientLogoById(client: TypedSupabaseClient, id: string) {
  return client
    .from('client_logos')
    .select('*')
    .eq('client_logo_id', id)
    .single()
}

export function createClientLogo(client: TypedSupabaseClient, data: ClientLogoFormInputType) {
  return client
    .from('client_logos')
    .insert([data])
    .select()
    .single()
}

export function updateClientLogo(client: TypedSupabaseClient, id: string, data: ClientLogoFormInputType) {
  return client
    .from('client_logos')
    .update(data)
    .eq('client_logo_id', id)
    .select()
    .single()
}

export function deleteClientLogo(client: TypedSupabaseClient, id: string) {
  return client
    .from('client_logos')
    .delete()
    .eq('client_logo_id', id)
}

export function reorderClientLogos(client: TypedSupabaseClient, items: ReorderRequestType['items']) {
  // Note: This needs to be handled via API route for batch updates
  // Supabase doesn't support batch updates directly in the client
  return Promise.resolve()
}