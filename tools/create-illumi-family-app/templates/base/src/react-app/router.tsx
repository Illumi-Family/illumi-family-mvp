import { QueryClient } from "@tanstack/react-query";
import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { HomePage } from "@/routes/home-page";
import { RootLayout } from "@/routes/root-layout";
import { UsersPage } from "@/routes/users-page";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

const rootRoute = createRootRoute({
	component: RootLayout,
});

const homeRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: HomePage,
});

const usersRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/users",
	component: UsersPage,
});

const routeTree = rootRoute.addChildren([homeRoute, usersRoute]);

export const router = createRouter({
	routeTree,
	defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
