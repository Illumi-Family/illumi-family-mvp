import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { createUser } from "@/lib/api";
import { usersQueryKey, usersQueryOptions } from "@/lib/query-options";

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

const formatDateTime = (value: string) => {
	const timestamp = Date.parse(value);
	if (Number.isNaN(timestamp)) return value;
	return new Date(timestamp).toLocaleString();
};

export function UsersPage() {
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");

	const usersQuery = useQuery(usersQueryOptions());
	const createUserMutation = useMutation({
		mutationFn: createUser,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: usersQueryKey,
			});
			setName("");
			setEmail("");
		},
	});

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!name.trim() || !email.trim()) return;
		createUserMutation.mutate({ name: name.trim(), email: email.trim() });
	};

	return (
		<div className="grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>User Query + Mutation</CardTitle>
					<CardDescription>
						读取 <code>/api/users</code> 并调用 <code>POST /api/users</code>。
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<form className="space-y-3" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder="Alice"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="alice@example.com"
							/>
						</div>
						<Button type="submit" disabled={createUserMutation.isPending}>
							{createUserMutation.isPending ? "Creating..." : "Create user"}
						</Button>
					</form>

					{createUserMutation.isError && (
						<p className="text-sm text-destructive">
							{readErrorMessage(createUserMutation.error)}
						</p>
					)}
				</CardContent>
				<CardFooter className="text-xs text-muted-foreground">
					创建成功后会触发 query invalidation，列表自动刷新。
				</CardFooter>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Users List</span>
						<Badge variant="secondary">
							{usersQuery.data?.length ?? 0} records
						</Badge>
					</CardTitle>
					<CardDescription>查询状态与列表内容。</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{usersQuery.isPending && (
						<p className="text-sm text-muted-foreground">Loading users...</p>
					)}
					{usersQuery.isError && (
						<p className="text-sm text-destructive">
							{readErrorMessage(usersQuery.error)}
						</p>
					)}
					{usersQuery.isSuccess && usersQuery.data.length === 0 && (
						<p className="text-sm text-muted-foreground">No users yet.</p>
					)}
					{usersQuery.data?.map((user) => (
						<div key={user.id} className="rounded-md border p-3 text-sm">
							<p className="font-medium">{user.name}</p>
							<p className="text-muted-foreground">{user.email}</p>
							<p className="text-xs text-muted-foreground">
								Created: {formatDateTime(user.createdAt)}
							</p>
						</div>
					))}
				</CardContent>
				<CardFooter className="flex justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => usersQuery.refetch()}
						disabled={usersQuery.isFetching}
					>
						{usersQuery.isFetching ? "Refreshing..." : "Refresh list"}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
