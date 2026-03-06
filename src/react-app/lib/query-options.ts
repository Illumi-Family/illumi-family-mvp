import { queryOptions } from "@tanstack/react-query";
import { getCurrentUser, getHealth } from "./api";

export const healthQueryKey = ["health"] as const;
export const currentUserQueryKey = ["users", "me"] as const;

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
