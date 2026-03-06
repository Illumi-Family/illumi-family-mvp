import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const navigation = [
	{ to: "/", label: "Home" },
	{ to: "/users", label: "Profile" },
] as const;

export function RootLayout() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
			<header className="space-y-4">
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">
						Cloudflare Worker + React + TanStack
					</p>
					<h1 className="text-3xl font-semibold tracking-tight">
						TanStack Router + Query Playground
					</h1>
					<p className="text-sm text-muted-foreground">
						演示路由切换与账号资料设置交互（Router + Query）。
					</p>
				</div>

				<nav className="flex items-center gap-2 rounded-lg border bg-card p-2">
					{navigation.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							preload="intent"
							className={cn(
								"rounded-md px-3 py-2 text-sm transition-colors",
								"text-muted-foreground hover:bg-accent hover:text-accent-foreground",
							)}
							activeProps={{
								className: cn(
									"rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground",
								),
							}}
						>
							{item.label}
						</Link>
					))}
				</nav>

				<p className="text-xs text-muted-foreground">
					Current route: <span className="font-mono">{pathname}</span>
				</p>
			</header>

			<Outlet />
		</main>
	);
}
