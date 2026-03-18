import { createContext, useContext } from "react";
import type { AppLocale } from "./types";

export type AppI18nContextValue = {
	locale: AppLocale;
	lang: "zh" | "en";
	switchLocale: (nextLocale: AppLocale) => void;
};

export const AppI18nContext = createContext<AppI18nContextValue | null>(null);

export const useAppI18n = () => {
	const context = useContext(AppI18nContext);
	if (!context) {
		throw new Error("useAppI18n must be used inside AppI18nProvider");
	}
	return context;
};
