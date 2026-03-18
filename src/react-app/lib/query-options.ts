import { queryOptions } from "@tanstack/react-query";
import type { AppLocale } from "@/i18n/types";
import {
	getCurrentUser,
	getHealth,
	getHomeContent,
	listAdminHomeSections,
} from "./api";

export const healthQueryKey = ["health"] as const;
export const currentUserQueryKey = ["users", "me"] as const;
export const homeContentQueryKeyPrefix = ["home-content"] as const;
export const homeContentQueryKey = (locale: AppLocale) =>
	[...homeContentQueryKeyPrefix, locale] as const;
export const adminHomeSectionsQueryKey = (locale: AppLocale) =>
	["admin-home-sections", locale] as const;

export const healthQueryOptions = () =>
	queryOptions({
		queryKey: healthQueryKey,
		queryFn: getHealth,
		staleTime: 30_000,
	});

export const currentUserQueryOptions = () =>
	queryOptions({
		queryKey: currentUserQueryKey,
		queryFn: getCurrentUser,
		staleTime: 10_000,
	});

export const homeContentQueryOptions = (locale: AppLocale) =>
	queryOptions({
		queryKey: homeContentQueryKey(locale),
		queryFn: () => getHomeContent(locale),
		staleTime: 30_000,
	});

export const adminHomeSectionsQueryOptions = (locale: AppLocale) =>
	queryOptions({
		queryKey: adminHomeSectionsQueryKey(locale),
		queryFn: () => listAdminHomeSections(locale),
		staleTime: 5_000,
	});
