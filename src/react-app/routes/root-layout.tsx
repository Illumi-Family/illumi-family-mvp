import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { authClient } from "@/lib/auth-client";

export function RootLayout() {
	const { t } = useTranslation("common");
	const { data: session } = authClient.useSession();
	const isSignedIn = Boolean(session?.user);
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const showUtilityNav = pathname !== "/";
	const skipTarget = showUtilityNav ? "#app-main-content" : "#main-content";

	return (
		<div className="min-h-screen bg-background text-foreground">
			<a
				href={skipTarget}
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:outline-none focus:ring-2 focus:ring-ring"
			>
				{t("skipToContent")}
			</a>
			{showUtilityNav ? (
				<header className="border-b border-border bg-[color:rgba(255,252,247,0.92)]">
					<div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
						<nav className="flex items-center gap-2 text-sm" aria-label={t("utilityNav.ariaLabel")}>
							<Link to="/">
								<Button variant="ghost" size="sm">
									{t("utilityNav.home")}
								</Button>
							</Link>
							{!isSignedIn ? (
								<Link to="/users">
									<Button variant="ghost" size="sm">
										{t("utilityNav.profile")}
									</Button>
								</Link>
							) : null}
							<Link to="/videos">
								<Button variant="ghost" size="sm">
									{t("utilityNav.videos", { defaultValue: "Videos" })}
								</Button>
							</Link>
							{!isSignedIn ? (
								<Link to="/auth">
									<Button variant="ghost" size="sm">
										{t("utilityNav.auth")}
									</Button>
								</Link>
							) : null}
							<Link to="/admin">
								<Button variant="ghost" size="sm">
									{t("utilityNav.admin")}
								</Button>
							</Link>
							<Link to="/admin/videos">
								<Button variant="ghost" size="sm">
									{t("utilityNav.adminVideos", { defaultValue: "Admin Videos" })}
								</Button>
							</Link>
						</nav>
						<div className="flex items-center gap-3">
							<LanguageSwitcher className="flex items-center gap-2" />
							<p className="text-xs text-muted-foreground">
								{session?.user
									? t("session.signedInAs", { email: session.user.email })
									: t("session.notSignedIn")}
							</p>
						</div>
					</div>
				</header>
			) : null}
			<main id="app-main-content">
				<Outlet />
			</main>
		</div>
	);
}
