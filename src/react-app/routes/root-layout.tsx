import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function RootLayout() {
	const { data: session } = authClient.useSession();
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const showUtilityNav = pathname !== "/";
	const skipTarget = showUtilityNav ? "#app-main-content" : "#main-content";

	return (
		<div className="min-h-screen bg-background text-foreground">
			<a
				href={skipTarget}
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:outline-none focus:ring-2 focus:ring-ring"
			>
				Skip to content
			</a>
			{showUtilityNav ? (
				<header className="border-b border-border bg-[color:rgba(255,252,247,0.92)]">
					<div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
						<nav className="flex items-center gap-2 text-sm" aria-label="系统导航">
							<Link to="/">
								<Button variant="ghost" size="sm">
									Home
								</Button>
							</Link>
							<Link to="/users">
								<Button variant="ghost" size="sm">
									Users
								</Button>
							</Link>
							<Link to="/auth">
								<Button variant="ghost" size="sm">
									Auth
								</Button>
							</Link>
							<Link to="/admin">
								<Button variant="ghost" size="sm">
									Admin
								</Button>
							</Link>
						</nav>
						<p className="text-xs text-muted-foreground">
							{session?.user
								? `Signed in as ${session.user.email}`
								: "Not signed in"}
						</p>
					</div>
				</header>
			) : null}
			<main id="app-main-content">
				<Outlet />
			</main>
		</div>
	);
}
