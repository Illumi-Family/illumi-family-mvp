import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import i18n from "./config";
import { normalizeLocale } from "./detector";
import type { AppLocale } from "./types";

const resolveLocale = (locale?: AppLocale) => normalizeLocale(locale ?? i18n.language);

const toDayjsLocale = (locale: AppLocale) => (locale === "en-US" ? "en" : "zh-cn");

export const formatDateTime = (value: string, locale?: AppLocale) => {
	const timestamp = dayjs(value);
	if (!timestamp.isValid()) return value;
	const resolvedLocale = resolveLocale(locale);
	const pattern = resolvedLocale === "en-US" ? "MMM D, YYYY h:mm A" : "YYYY-MM-DD HH:mm";
	return timestamp.locale(toDayjsLocale(resolvedLocale)).format(pattern);
};

export const formatNumber = (
	value: number,
	locale?: AppLocale,
	options?: Intl.NumberFormatOptions,
) => {
	const resolvedLocale = resolveLocale(locale);
	return new Intl.NumberFormat(resolvedLocale, options).format(value);
};
