export const SUPPORTED_CONTENT_LOCALES = ["zh-CN", "en-US"] as const;

export type ContentLocale = (typeof SUPPORTED_CONTENT_LOCALES)[number];

export const DEFAULT_CONTENT_LOCALE: ContentLocale = "zh-CN";

const toLower = (value: string) => value.trim().toLowerCase();

export const normalizeContentLocale = (
	value: string | null | undefined,
): ContentLocale => {
	if (!value) return DEFAULT_CONTENT_LOCALE;
	const normalized = toLower(value);
	if (normalized === "zh" || normalized.startsWith("zh-")) return "zh-CN";
	if (normalized === "en" || normalized.startsWith("en-")) return "en-US";
	return DEFAULT_CONTENT_LOCALE;
};

export const parseContentLocale = (
	value: string | null | undefined,
): ContentLocale | null => {
	if (!value) return null;
	const normalized = toLower(value);
	if (normalized === "zh" || normalized.startsWith("zh-")) return "zh-CN";
	if (normalized === "en" || normalized.startsWith("en-")) return "en-US";
	return null;
};
