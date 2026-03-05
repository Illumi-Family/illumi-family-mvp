import { Link, Outlet } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function RootLayout() {
	const { data: session } = authClient.useSession();

	return (
		<div className="min-h-screen bg-background text-foreground">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:outline-none focus:ring-2 focus:ring-ring"
			>
				Skip to content
			</a>
			<header className="border-b">
				<div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
					<nav className="flex items-center gap-2 text-sm">
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
					</nav>
					<p className="text-xs text-muted-foreground">
						{session?.user
							? `Signed in as ${session.user.email}`
							: "Not signed in"}
					</p>
				</div>
			</header>
			<main id="main-content">
				<Outlet />
			</main>
		</div>
	);
}
