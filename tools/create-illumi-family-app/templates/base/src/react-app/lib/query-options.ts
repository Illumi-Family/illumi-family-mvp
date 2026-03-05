import { queryOptions } from "@tanstack/react-query";
import { getHealth, listUsers } from "./api";

export const healthQueryKey = ["health"] as const;
export const usersQueryKey = ["users"] as const;

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
