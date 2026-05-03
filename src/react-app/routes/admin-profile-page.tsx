import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/i18n/format";
import { useAppI18n } from "@/i18n/context";
import { authClient } from "@/lib/auth-client";
import { ApiClientError, updateCurrentUser } from "@/lib/api";
import {
	currentUserQueryKey,
	currentUserQueryOptions,
} from "@/lib/query-options";

const readErrorMessage = (error: unknown, t: (key: string) => string) => {
	if (error instanceof ApiClientError) {
		if (error.code === "CURRENT_USER_NOT_FOUND") {
			return t("errors.currentUserNotFound");
		}
		return error.message;
	}
	return error instanceof Error ? error.message : t("errors.unexpected");
};

export function AdminProfilePage() {
	const { t } = useTranslation("users");
	const { locale } = useAppI18n();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [draftName, setDraftName] = useState<string | null>(null);

	const currentUserQuery = useQuery(currentUserQueryOptions());
	const updateProfileMutation = useMutation({
		mutationFn: updateCurrentUser,
		onSuccess: (user) => {
			queryClient.setQueryData(currentUserQueryKey, user);
			setDraftName(null);
		},
	});

	const onSignOut = async () => {
		await authClient.signOut();
		await navigate({ to: "/auth" });
	};

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const normalizedName = (draftName ?? currentUserQuery.data?.name ?? "").trim();
		if (!currentUserQuery.data || !normalizedName) return;
		if (normalizedName === currentUserQuery.data.name) return;
		updateProfileMutation.mutate({ name: normalizedName });
	};

	const editableName = draftName ?? currentUserQuery.data?.name ?? "";
	const isDirty =
		currentUserQuery.isSuccess &&
		editableName.trim() !== currentUserQuery.data.name;

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>{t("titles.profileSettings")}</span>
						<Badge variant="secondary">{t("labels.currentUser")}</Badge>
					</CardTitle>
					<CardDescription>{t("descriptions.profileSettings")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant={currentUserQuery.isSuccess ? "default" : "outline"}>
							{currentUserQuery.status}
						</Badge>
						{currentUserQuery.isFetching ? (
							<Badge variant="secondary">{t("status.fetching")}</Badge>
						) : null}
					</div>

					{currentUserQuery.isPending ? (
						<p className="text-sm text-muted-foreground">{t("descriptions.pending")}</p>
					) : null}

					{currentUserQuery.isError ? (
						<p className="text-sm text-destructive">
							{readErrorMessage(currentUserQuery.error, t)}
						</p>
					) : null}

					{currentUserQuery.isSuccess ? (
						<form className="space-y-3" onSubmit={onSubmit}>
							<div className="space-y-2">
								<Label htmlFor="email">{t("labels.email")}</Label>
								<Input
									id="email"
									type="email"
									value={currentUserQuery.data.email}
									disabled
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="name">{t("labels.displayName")}</Label>
								<Input
									id="name"
									value={editableName}
									onChange={(event) => setDraftName(event.target.value)}
									placeholder={t("labels.displayNamePlaceholder")}
								/>
							</div>
							<div className="grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-2">
								<div>
									<p className="text-xs text-muted-foreground">{t("labels.createdAt")}</p>
									<p>{formatDateTime(currentUserQuery.data.createdAt, locale)}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{t("labels.updatedAt")}</p>
									<p>{formatDateTime(currentUserQuery.data.updatedAt, locale)}</p>
								</div>
								<div className="sm:col-span-2">
									<p className="text-xs text-muted-foreground">{t("labels.userId")}</p>
									<p className="font-mono text-xs">{currentUserQuery.data.id}</p>
								</div>
							</div>
							<Button type="submit" disabled={updateProfileMutation.isPending || !isDirty}>
								{updateProfileMutation.isPending ? t("buttons.saving") : t("buttons.save")}
							</Button>
						</form>
					) : null}

					{updateProfileMutation.isError ? (
						<p className="text-sm text-destructive">
							{readErrorMessage(updateProfileMutation.error, t)}
						</p>
					) : null}
				</CardContent>
				<CardFooter className="flex flex-wrap justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => currentUserQuery.refetch()}
						disabled={currentUserQuery.isFetching}
					>
						{currentUserQuery.isFetching ? t("buttons.refreshing") : t("buttons.refresh")}
					</Button>
					<Button type="button" variant="ghost" onClick={onSignOut}>
						{t("buttons.signOut")}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
