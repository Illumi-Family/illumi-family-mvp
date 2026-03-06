import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
import { authClient } from "@/lib/auth-client";
import { ApiClientError, updateCurrentUser } from "@/lib/api";
import {
	currentUserQueryKey,
	currentUserQueryOptions,
} from "@/lib/query-options";

const readErrorMessage = (error: unknown) => {
	if (error instanceof ApiClientError) {
		if (error.code === "CURRENT_USER_NOT_FOUND") {
			return "尚未检测到当前账号，请先完成注册并验证邮箱。";
		}

		return error.message;
	}

	return error instanceof Error ? error.message : "Unexpected error";
};

const formatDateTime = (value: string) => {
	const timestamp = Date.parse(value);
	if (Number.isNaN(timestamp)) return value;
	return new Date(timestamp).toLocaleString();
};

export function UsersPage() {
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

	const handleSignOut = async () => {
		await authClient.signOut();
		await navigate({ to: "/auth" });
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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
		<div className="grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Profile Settings</CardTitle>
					<CardDescription>
						账号会在注册并完成邮箱验证后自动创建。此页面仅用于管理当前用户资料。
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant={currentUserQuery.isSuccess ? "default" : "outline"}>
							{currentUserQuery.status}
						</Badge>
						{currentUserQuery.isFetching && (
							<Badge variant="secondary">fetching</Badge>
						)}
					</div>

					{currentUserQuery.isPending && (
						<p className="text-sm text-muted-foreground">
							Loading current profile...
						</p>
					)}

					{currentUserQuery.isError && (
						<p className="text-sm text-destructive">
							{readErrorMessage(currentUserQuery.error)}
						</p>
					)}

					{currentUserQuery.isSuccess && (
						<form className="space-y-3" onSubmit={handleSubmit}>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={currentUserQuery.data.email}
									disabled
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="name">Display Name</Label>
								<Input
									id="name"
									value={editableName}
									onChange={(event) => setDraftName(event.target.value)}
									placeholder="Your display name"
								/>
							</div>
							<Button
								type="submit"
								disabled={updateProfileMutation.isPending || !isDirty}
							>
								{updateProfileMutation.isPending ? "Saving..." : "Save changes"}
							</Button>
						</form>
					)}

					{updateProfileMutation.isError && (
						<p className="text-sm text-destructive">
							{readErrorMessage(updateProfileMutation.error)}
						</p>
					)}
				</CardContent>
				<CardFooter className="text-xs text-muted-foreground">
					不再提供手动创建用户入口，用户身份由注册流程统一生成。
				</CardFooter>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Profile Snapshot</span>
						<Badge variant="secondary">Current User</Badge>
					</CardTitle>
					<CardDescription>当前资料与账号生命周期信息。</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{currentUserQuery.isPending && (
						<p className="text-sm text-muted-foreground">
							Waiting for profile data...
						</p>
					)}

					{currentUserQuery.isError && (
						<p className="text-sm text-destructive">
							{readErrorMessage(currentUserQuery.error)}
						</p>
					)}

					{currentUserQuery.isSuccess && (
						<div className="space-y-3 text-sm">
							<div className="rounded-md border p-3">
								<p className="text-xs text-muted-foreground">User ID</p>
								<p className="font-mono text-xs">{currentUserQuery.data.id}</p>
							</div>
							<div className="rounded-md border p-3">
								<p className="text-xs text-muted-foreground">Created At</p>
								<p>{formatDateTime(currentUserQuery.data.createdAt)}</p>
							</div>
							<div className="rounded-md border p-3">
								<p className="text-xs text-muted-foreground">Updated At</p>
								<p>{formatDateTime(currentUserQuery.data.updatedAt)}</p>
							</div>
						</div>
					)}
				</CardContent>
				<CardFooter className="flex justify-end">
					<Button type="button" variant="ghost" onClick={handleSignOut}>
						Sign out
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => currentUserQuery.refetch()}
						disabled={currentUserQuery.isFetching}
					>
						{currentUserQuery.isFetching ? "Refreshing..." : "Refresh profile"}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
