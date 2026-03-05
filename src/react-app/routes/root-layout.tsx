import { Outlet } from "@tanstack/react-router";

export function RootLayout() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:outline-none focus:ring-2 focus:ring-ring"
			>
				Skip to content
			</a>
			<Outlet />
		</div>
	);
}

