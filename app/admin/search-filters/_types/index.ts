import { AgeUnit, FilterKind, SearchFilterItem } from "@/lib/admin-panel/types"

export interface SearchFiltersResponse {
  data: SearchFilterItem[]
}

export interface CreateSearchFilterPayload {
  kind: FilterKind
  name: string
  description?: string
  parentId?: string
  enabled?: boolean
  fromAge?: number
  toAge?: number
  unit?: AgeUnit
}
