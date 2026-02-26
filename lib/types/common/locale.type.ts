export type Locale = 'en' | 'ar'
export enum LocaleEnum {
    en = 'en',
    ar = 'ar',
}
export enum LocaleEnumLabel {
    en = 'English',
    ar = 'Arabic',
}

export type LocalizedStringType = {
    en: string;
    ar?: string;
};

export type LocalizedStringTypeOptional = {
    en?: string;
    ar?: string;
};