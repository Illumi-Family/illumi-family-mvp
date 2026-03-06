import { queryOptions } from "@tanstack/react-query";
import { getHealth, getHomeContent, listAdminHomeSections, listUsers } from "./api";

export const healthQueryKey = ["health"] as const;
export const usersQueryKey = ["users"] as const;
export const homeContentQueryKey = ["home-content"] as const;
export const adminHomeSectionsQueryKey = ["admin-home-sections"] as const;

export const healthQueryOptions = () =>
	queryOptions({
		queryKey: healthQueryKey,
		queryFn: getHealth,
		staleTime: 30_000,
	});

export const usersQueryOptions = () =>
	queryOptions({
		queryKey: usersQueryKey,
		queryFn: listUsers,
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
