import type { AppLang, AppLocale } from "./types";

export const DEFAULT_LOCALE: AppLocale = "zh-CN";
export const DEFAULT_LANG: AppLang = "zh";
export const LOCALE_COOKIE_NAME = "illumi_locale" as const;

const toLower = (value: string) => value.trim().toLowerCase();

export const normalizeLocale = (value: string | null | undefined): AppLocale => {
	if (!value) return DEFAULT_LOCALE;
	const normalized = toLower(value);
	if (normalized === "zh" || normalized.startsWith("zh-")) return "zh-CN";
	if (normalized === "en" || normalized.startsWith("en-")) return "en-US";
	return DEFAULT_LOCALE;
};

export const localeToLang = (locale: AppLocale): AppLang =>
	locale === "en-US" ? "en" : "zh";

export const parseLocaleFromLangParam = (
	lang: string | null | undefined,
): AppLocale | null => {
	if (!lang) return null;
	const normalized = toLower(lang);
	if (normalized === "zh" || normalized.startsWith("zh-")) return "zh-CN";
	if (normalized === "en" || normalized.startsWith("en-")) return "en-US";
	return null;
};

export const readLocaleFromCookie = (
	cookie: string | null | undefined,
): AppLocale | null => {
	if (!cookie) return null;
	const parts = cookie.split(";").map((item) => item.trim());
	const row = parts.find((item) => item.startsWith(`${LOCALE_COOKIE_NAME}=`));
	if (!row) return null;
	return parseLocaleFromLangParam(row.split("=")[1] ?? null);
};

type DetectLocaleInput = {
	search?: string;
	cookie?: string;
	navigatorLanguage?: string;
};

export const detectLocale = (input?: DetectLocaleInput): AppLocale => {
	const search =
		input?.search ?? (typeof window !== "undefined" ? window.location.search : "");
	const cookie =
		input?.cookie ??
		(typeof document !== "undefined" ? document.cookie : "");
	const navigatorLanguage =
		input?.navigatorLanguage ??
		(typeof navigator !== "undefined" ? navigator.language : "");

	const queryLocale = parseLocaleFromLangParam(
		new URLSearchParams(search).get("lang"),
	);
	if (queryLocale) return queryLocale;

	const cookieLocale = readLocaleFromCookie(cookie);
	if (cookieLocale) return cookieLocale;

	return normalizeLocale(navigatorLanguage);
};

export const setLocaleCookie = (locale: AppLocale) => {
	if (typeof document === "undefined") return;
	document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`;
};

export const setLangQuery = (locale: AppLocale) => {
	if (typeof window === "undefined") return;
	const url = new URL(window.location.href);
	url.searchParams.set("lang", localeToLang(locale));
	window.history.replaceState(window.history.state, "", url.toString());
};
