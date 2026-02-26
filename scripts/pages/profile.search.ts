import { createProfileSearchIndex } from "@/lib/utils-tsx";
import { IIndexInput, SelectorTypeEnum, PROFILE_SEARCH_KEYS } from "@/lib/types";
import { PROFILE_STRINGS } from "@/lib/constants";

const page = "/admin/profile";

const indexStrings: IIndexInput[] = [
  { key: PROFILE_SEARCH_KEYS.mainTitle, value: PROFILE_STRINGS.main.title, selectorType: SelectorTypeEnum.id },
  { key: PROFILE_SEARCH_KEYS.tableLabelsProfileImage, value: PROFILE_STRINGS.table.labels.profileImage },
  { key: PROFILE_SEARCH_KEYS.tableLabelsName, value: PROFILE_STRINGS.table.labels.name },
  { key: PROFILE_SEARCH_KEYS.tableLabelsEmail, value: PROFILE_STRINGS.table.labels.email },
  { key: PROFILE_SEARCH_KEYS.tableLabelsRole, value: PROFILE_STRINGS.table.labels.role },
];

export const PROFILE_SEARCH_INDEX = createProfileSearchIndex(indexStrings, page);