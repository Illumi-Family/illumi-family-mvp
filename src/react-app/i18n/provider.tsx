import {
	type PropsWithChildren,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./config";
import {
	AppI18nContext,
	type AppI18nContextValue,
} from "./context";
import {
	localeToLang,
	normalizeLocale,
	setLangQuery,
	setLocaleCookie,
} from "./detector";
import type { AppLocale } from "./types";

export function AppI18nProvider({ children }: PropsWithChildren) {
	const [locale, setLocale] = useState<AppLocale>(() => normalizeLocale(i18n.language));

	useEffect(() => {
		const onLanguageChanged = (value: string) => {
			const nextLocale = normalizeLocale(value);
			setLocale(nextLocale);
			if (typeof document !== "undefined") {
				document.documentElement.lang = nextLocale;
			}
		};

		onLanguageChanged(i18n.language);
		i18n.on("languageChanged", onLanguageChanged);
		return () => {
			i18n.off("languageChanged", onLanguageChanged);
		};
	}, []);

	const switchLocale = useCallback((nextLocale: AppLocale) => {
		setLocaleCookie(nextLocale);
		setLangQuery(nextLocale);
		void i18n.changeLanguage(nextLocale);
	}, []);

	const value = useMemo<AppI18nContextValue>(
		() => ({
			locale,
			lang: localeToLang(locale),
			switchLocale,
		}),
		[locale, switchLocale],
	);

	return (
		<I18nextProvider i18n={i18n}>
			<AppI18nContext.Provider value={value}>{children}</AppI18nContext.Provider>
		</I18nextProvider>
	);
}
