import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function RootLayout() {
	const { t } = useTranslation("common");
	const { data: session } = authClient.useSession();
	const isSignedIn = Boolean(session?.user);
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const isPublicSurface =
		pathname === "/" || pathname.startsWith("/video") || pathname.startsWith("/legal/");
	const isAuthSurface = pathname === "/auth";
	const isAdminSurface = pathname === "/admin" || pathname.startsWith("/admin/");
	const showUtilityNav = !isPublicSurface && !isAuthSurface;
	const skipTarget = showUtilityNav ? "#app-main-content" : "#main-content";

	const onSignOut = async () => {
		await authClient.signOut();
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<a
				href={skipTarget}
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:outline-none focus:ring-2 focus:ring-ring"
			>
				{t("skipToContent")}
			</a>
			{showUtilityNav ? (
				<header className="fixed inset-x-0 top-0 z-40 border-b border-border/80 bg-[color:rgba(255,252,247,0.84)] backdrop-blur-md">
					<div className="flex w-full items-center justify-between px-4 py-3 md:px-6">
						<nav className="flex items-center gap-2 text-sm" aria-label={t("utilityNav.ariaLabel")}>
							{isAdminSurface ? (
								<>
									<Link to="/admin/profile">
										<Button variant="ghost" size="sm">
											{t("utilityNav.adminProfile", { defaultValue: "我的账号" })}
										</Button>
									</Link>
									<Link to="/admin/cms">
										<Button variant="ghost" size="sm">
											{t("utilityNav.adminCms", { defaultValue: "CMS 配置" })}
										</Button>
									</Link>
									<Link to="/admin/videos">
										<Button variant="ghost" size="sm">
											{t("utilityNav.adminVideos", { defaultValue: "视频管理" })}
										</Button>
									</Link>
									<Button variant="ghost" size="sm" onClick={onSignOut}>
										{t("utilityNav.signOut", { defaultValue: "退出登录" })}
									</Button>
								</>
							) : (
								<>
									<Link to="/">
										<Button variant="ghost" size="sm">
											{t("utilityNav.home")}
										</Button>
									</Link>
									<Link to="/video">
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
									{!isSignedIn ? null : (
										<Link to="/admin/profile">
											<Button variant="ghost" size="sm">
												{t("utilityNav.admin", { defaultValue: "Admin" })}
											</Button>
										</Link>
									)}
								</>
							)}
						</nav>
						<div className="flex items-center gap-3">
							<p className="text-xs text-muted-foreground">
								{session?.user
									? t("session.signedInAs", { email: session.user.email })
									: t("session.notSignedIn")}
							</p>
						</div>
					</div>
				</header>
			) : null}
			<main id="app-main-content" className={showUtilityNav ? "pt-16" : undefined}>
				<Outlet />
			</main>
		</div>
	);
}
