import { FormEvent, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	AlertCircle,
	ArrowRight,
	CheckCircle2,
	LoaderCircle,
	Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

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
	const { data: sessionData } = authClient.useSession();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [infoMessage, setInfoMessage] = useState<string | null>(null);
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
			const result = await authClient.signIn.email({
				email: email.trim().toLowerCase(),
				password,
				callbackURL: "/admin/profile",
			});

			if (result.error) {
				setErrorMessage(readErrorMessage(result.error, t("messages.authenticationFailed")));
				return;
			}

			await navigate({ to: "/admin/profile" });
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
				callbackURL: "/admin/profile",
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
				callbackURL: "/admin/profile",
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
				<section className="motion-enter w-full max-w-2xl [animation-delay:120ms]">
					<Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white/87 shadow-[0_40px_120px_-72px_rgba(15,23,42,0.85)] backdrop-blur-xl">
						<CardHeader className="p-8 pb-4 sm:p-10 sm:pb-4">
							<CardTitle className="text-4xl font-semibold text-slate-900">
								{t("mode.signIn.title")}
							</CardTitle>
						</CardHeader>

						<CardContent className="space-y-5 p-8 pt-0 sm:p-10 sm:pt-0">
							<form
								className="space-y-5"
								onSubmit={onSubmit}
								aria-busy={isSubmitting}
								noValidate
							>
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
											className="h-12 rounded-xl border-slate-200/90 bg-white/90 pl-10 text-base placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/70"
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
										className="h-12 rounded-xl border-slate-200/90 bg-white/90 text-base placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/70"
									/>
								</div>
								<Button
									type="submit"
									disabled={isSubmitting}
									className="h-12 w-full cursor-pointer rounded-xl bg-slate-900 text-lg text-white transition-all duration-200 hover:bg-slate-800"
								>
											{isSubmitting ? (
												<>
													<LoaderCircle className="h-4 w-4 animate-spin" />
													{t("buttons.submitting")}
												</>
											) : (
												<>
													{t("mode.signIn.action")}
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
								className="h-12 w-full cursor-pointer rounded-xl border-slate-300 bg-white text-lg text-slate-700 transition-all duration-200 hover:bg-slate-50"
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
