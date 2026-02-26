import { SeoSettings, TagItem } from "@/lib/admin-panel/types"

export interface SeoResponse {
  data: SeoSettings
}

export interface TagsResponse {
  data: TagItem[]
}
