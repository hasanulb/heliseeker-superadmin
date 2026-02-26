import { PROFILE_SEARCH_KEYS } from "@/lib/types";

export enum SelectorTypeEnum {
    id = 'id',
    label = 'label',
}

export interface IIndexInput {
    key: PROFILE_SEARCH_KEYS;
    value: string;
    selectorType?: SelectorTypeEnum;
}

export interface ISearchIndexItem {
    key: string;
    value: string;
    selector: string;
    page: string;
    id: string;
}