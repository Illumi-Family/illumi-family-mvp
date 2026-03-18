export const SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const SUPPORTED_LANGS = ["zh", "en"] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];
