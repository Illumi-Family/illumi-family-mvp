import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	AlertCircle,
	ArrowRight,
	CheckCircle2,
	LoaderCircle,
	Mail,
	UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";

const readErrorMessage = (error: unknown, fallbackMessage: string) => {
	if (!error) return null;
	if (error instanceof Error) return error.message;
	if (typeof error === "object" && error && "message" in error) {
		return String(error.message);
	}
	return fallbackMessage;
};

function GoogleMark() {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 48 48"
			className="h-4 w-4 shrink-0"
			focusable="false"
		>
			<path
				fill="#EA4335"
				d="M24 9.5c3.15 0 6.03 1.1 8.28 2.92l6.16-6.16C34.68 2.84 29.65 1 24 1 14.7 1 6.72 6.3 2.82 14.02l7.6 5.9C12.2 13.7 17.6 9.5 24 9.5z"
			/>
			<path
				fill="#4285F4"
				d="M46.5 24.5c0-1.64-.14-2.83-.44-4.06H24v8.06h12.95c-.26 2-1.66 5-4.78 7.02l7.38 5.72c4.38-4.04 6.95-9.97 6.95-16.74z"
			/>
			<path
				fill="#FBBC05"
				d="M10.42 28.08A14.41 14.41 0 0 1 9.64 24c0-1.42.26-2.8.7-4.08l-7.6-5.9A22.96 22.96 0 0 0 1 24c0 3.7.88 7.21 2.44 10.3l7-6.22z"
			/>
			<path
				fill="#34A853"
				d="M24 47c6.47 0 11.9-2.12 15.86-5.76l-7.38-5.72c-1.98 1.38-4.64 2.34-8.48 2.34-6.4 0-11.8-4.2-13.58-10.08l-7 6.22C6.7 40.62 14.88 47 24 47z"
			/>
		</svg>
	);
}

export function AuthPage() {
	const { t } = useTranslation("auth");
	const navigate = useNavigate();
	const { data: sessionData, isPending } = authClient.useSession();
	const [mode, setMode] = useState<AuthMode>("sign-in");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [infoMessage, setInfoMessage] = useState<string | null>(null);

	const modeCopy: Record<AuthMode, { title: string; subtitle: string; action: string }> = useMemo(
		() => ({
			"sign-in": {
				title: t("mode.signIn.title"),
				subtitle: t("mode.signIn.subtitle"),
				action: t("mode.signIn.action"),
			},
			"sign-up": {
				title: t("mode.signUp.title"),
				subtitle: t("mode.signUp.subtitle"),
				action: t("mode.signUp.action"),
			},
		}),
		[t],
	);
	const modeMeta = modeCopy[mode];
	const isAuthenticated = Boolean(sessionData?.user);

	const resetMessages = () => {
		setErrorMessage(null);
		setInfoMessage(null);
	};

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		resetMessages();
		setIsSubmitting(true);

		try {
			if (mode === "sign-up") {
				const normalizedName = name.trim();
				if (!normalizedName) {
					setErrorMessage(t("messages.requireName"));
					return;
				}

				const result = await authClient.signUp.email({
					name: normalizedName,
					email: email.trim().toLowerCase(),
					password,
					callbackURL: "/users",
				});

				if (result.error) {
					setErrorMessage(readErrorMessage(result.error, t("messages.authenticationFailed")));
					return;
				}

				setInfoMessage(t("messages.registerSuccess"));
				setMode("sign-in");
				return;
			}

			const result = await authClient.signIn.email({
				email: email.trim().toLowerCase(),
				password,
				callbackURL: "/users",
			});

			if (result.error) {
				setErrorMessage(readErrorMessage(result.error, t("messages.authenticationFailed")));
				return;
			}

			await navigate({ to: "/users" });
		} catch (error) {
			setErrorMessage(readErrorMessage(error, t("messages.authenticationFailed")));
		} finally {
			setIsSubmitting(false);
		}
	};

	const onGoogleSignIn = async () => {
		resetMessages();
		setIsSubmitting(true);
		try {
			const result = await authClient.signIn.social({
				provider: "google",
				callbackURL: "/users",
			});
			if (result.error) {
				setErrorMessage(readErrorMessage(result.error, t("messages.authenticationFailed")));
				return;
			}
			if (result.data?.url) {
				window.location.href = result.data.url;
				return;
			}
			setInfoMessage(t("status.googleRequested"));
		} catch (error) {
			setErrorMessage(readErrorMessage(error, t("messages.authenticationFailed")));
		} finally {
			setIsSubmitting(false);
		}
	};

	const onSendVerification = async () => {
		resetMessages();
		try {
			const normalizedEmail = email.trim().toLowerCase();
			if (!normalizedEmail) {
				setErrorMessage(t("messages.emailRequired"));
				return;
			}

			const result = await authClient.sendVerificationEmail({
				email: normalizedEmail,
				callbackURL: "/users",
			});
			if (result.error) {
				setErrorMessage(readErrorMessage(result.error, t("messages.authenticationFailed")));
				return;
			}
			setInfoMessage(t("messages.verificationSent"));
		} catch (error) {
			setErrorMessage(readErrorMessage(error, t("messages.authenticationFailed")));
		}
	};

	const onSignOut = async () => {
		await authClient.signOut();
		resetMessages();
		setInfoMessage(t("messages.signedOut"));
	};

	return (
		<div className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_10%_15%,rgba(219,234,254,0.8),rgba(248,250,252,1)_45%,rgba(241,245,249,1)_100%)]">
			<div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/45 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-24 -left-16 -z-10 h-72 w-72 rounded-full bg-slate-200/60 blur-3xl" />
			<div className="mx-auto flex items-center justify-center min-h-[calc(100vh-57px)] w-full  max-w-6xl px-4 py-8 sm:px-6 lg:gap-10 lg:py-14">
				<section className="motion-enter [animation-delay:120ms]">
					<Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white/87 shadow-[0_40px_120px_-72px_rgba(15,23,42,0.85)] backdrop-blur-xl">
						<CardHeader className="space-y-5 p-6 sm:p-8">
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-xs font-medium tracking-wide text-slate-500">
										{t("meta.badge")}
									</p>
									<CardTitle className="mt-1 text-2xl font-semibold text-slate-900">
										{modeMeta.title}
									</CardTitle>
									<p className="mt-1.5 text-sm text-slate-600">{modeMeta.subtitle}</p>
								</div>
								<Badge
									variant="secondary"
									className="border border-slate-200/90 bg-white/85 text-slate-700"
								>
									{isAuthenticated ? t("status.authenticated") : t("status.guest")}
								</Badge>
							</div>

							<div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
								<button
									type="button"
									onClick={() => setMode("sign-in")}
									className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
										mode === "sign-in"
											? "bg-white text-slate-900 shadow-sm"
											: "text-slate-600 hover:text-slate-900"
									}`}
								>
									{t("mode.signIn.tab")}
								</button>
								<button
									type="button"
									onClick={() => setMode("sign-up")}
									className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
										mode === "sign-up"
											? "bg-white text-slate-900 shadow-sm"
											: "text-slate-600 hover:text-slate-900"
									}`}
								>
									{t("mode.signUp.tab")}
								</button>
							</div>
						</CardHeader>

						<CardContent className="space-y-5 p-6 pt-0 sm:p-8 sm:pt-0">
							<form
								className="space-y-4"
								onSubmit={onSubmit}
								aria-busy={isSubmitting}
								noValidate
							>
								{mode === "sign-up" && (
									<div className="space-y-2">
										<Label htmlFor="name" className="text-slate-700">
											{t("fields.name")}
										</Label>
										<div className="relative">
											<UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
											<Input
												id="name"
												value={name}
												onChange={(event) => setName(event.target.value)}
												required
												placeholder={t("fields.namePlaceholder")}
												className="h-11 rounded-xl border-slate-200/90 bg-white/90 pl-10 text-[15px] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/70"
											/>
										</div>
									</div>
								)}
								<div className="space-y-2">
									<Label htmlFor="email" className="text-slate-700">
										{t("fields.email")}
									</Label>
									<div className="relative">
										<Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
										<Input
											id="email"
											type="email"
											value={email}
											onChange={(event) => setEmail(event.target.value)}
											required
											placeholder={t("fields.emailPlaceholder")}
											className="h-11 rounded-xl border-slate-200/90 bg-white/90 pl-10 text-[15px] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/70"
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="password" className="text-slate-700">
										{t("fields.password")}
									</Label>
									<Input
										id="password"
										type="password"
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										required
										minLength={8}
										placeholder={t("fields.passwordPlaceholder")}
										className="h-11 rounded-xl border-slate-200/90 bg-white/90 text-[15px] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/70"
									/>
								</div>
								<Button
									type="submit"
									disabled={isSubmitting}
									className="h-11 w-full cursor-pointer rounded-xl bg-slate-900 text-white transition-all duration-200 hover:bg-slate-800"
								>
									{isSubmitting ? (
										<>
											<LoaderCircle className="h-4 w-4 animate-spin" />
											{t("buttons.submitting")}
										</>
									) : (
										<>
											{modeMeta.action}
											<ArrowRight className="h-4 w-4" />
										</>
									)}
								</Button>
							</form>

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t border-slate-200" />
								</div>
								<div className="relative flex justify-center text-xs uppercase tracking-wide text-slate-500">
									<span className="bg-white px-2">{t("meta.orContinueWith")}</span>
								</div>
							</div>

							<Button
								type="button"
								variant="outline"
								onClick={onGoogleSignIn}
								disabled={isSubmitting}
								className="h-11 w-full cursor-pointer rounded-xl border-slate-300 bg-white text-slate-700 transition-all duration-200 hover:bg-slate-50"
							>
								<GoogleMark />
								{t("buttons.google")}
							</Button>

							<div className="flex flex-wrap items-center justify-between gap-3 text-sm">
								<Button
									type="button"
									variant="ghost"
									onClick={onSendVerification}
									className="h-auto cursor-pointer p-0 text-slate-600 hover:bg-transparent hover:text-slate-900"
								>
									{t("buttons.resendVerification")}
								</Button>
								{isAuthenticated && (
									<Button
										type="button"
										variant="ghost"
										onClick={onSignOut}
										className="h-auto cursor-pointer p-0 text-slate-600 hover:bg-transparent hover:text-slate-900"
									>
										{t("buttons.signOut")}
									</Button>
								)}
							</div>

							<div aria-live="polite" aria-atomic="true" className="space-y-2">
								{isPending && (
									<p className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100/70 px-3 py-2 text-sm text-slate-700">
										<LoaderCircle className="h-4 w-4 animate-spin text-slate-500" />
										{t("status.checkingSession")}
									</p>
								)}
								{errorMessage && (
									<p
										role="alert"
										className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
									>
										<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
										<span>{errorMessage}</span>
									</p>
								)}
								{infoMessage && (
									<p
										role="status"
										className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
									>
										<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
										<span>{infoMessage}</span>
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</section>
			</div>
		</div>
	);
}
