import { QueryClient } from "@tanstack/react-query";
import {
	createRootRoute,
	createRoute,
	createRouter,
	redirect,
} from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { getAdminMe } from "@/lib/api";
import { AdminPage } from "@/routes/admin-page";
import { AdminVideosPage } from "@/routes/admin-videos-page";
import { AuthPage } from "@/routes/auth-page";
import { HomePage } from "@/routes/home-page";
import { RootLayout } from "@/routes/root-layout";
import { UsersPage } from "@/routes/users-page";
import { VideosPage } from "@/routes/videos-page";

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
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			throw redirect({ to: "/auth" });
		}
	},
	component: UsersPage,
});

const authRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/auth",
	component: AuthPage,
});

const requireAdminAccess = async () => {
	const session = await authClient.getSession();
	if (!session.data) {
		throw redirect({ to: "/auth" });
	}
	try {
		await getAdminMe();
	} catch {
		throw redirect({ to: "/" });
	}
};

const adminRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/admin",
	beforeLoad: requireAdminAccess,
	component: AdminPage,
});

const adminVideosRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/admin/videos",
	beforeLoad: requireAdminAccess,
	component: AdminVideosPage,
});

const videosRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/videos",
	component: VideosPage,
});

const routeTree = rootRoute.addChildren([
	homeRoute,
	videosRoute,
	usersRoute,
	authRoute,
	adminRoute,
	adminVideosRoute,
]);

export const router = createRouter({
	routeTree,
	defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
