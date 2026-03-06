import { queryOptions } from "@tanstack/react-query";
import {
	getCurrentUser,
	getHealth,
	getHomeContent,
	listAdminHomeSections,
} from "./api";

export const healthQueryKey = ["health"] as const;
export const currentUserQueryKey = ["users", "me"] as const;
export const homeContentQueryKey = ["home-content"] as const;
export const adminHomeSectionsQueryKey = ["admin-home-sections"] as const;

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

export const homeContentQueryOptions = () =>
	queryOptions({
		queryKey: homeContentQueryKey,
		queryFn: getHomeContent,
		staleTime: 30_000,
	});

export const adminHomeSectionsQueryOptions = () =>
	queryOptions({
		queryKey: adminHomeSectionsQueryKey,
		queryFn: listAdminHomeSections,
		staleTime: 5_000,
	});
