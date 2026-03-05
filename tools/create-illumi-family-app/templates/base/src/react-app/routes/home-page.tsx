import { useQuery } from "@tanstack/react-query";
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
import { healthQueryOptions } from "@/lib/query-options";

const formatTime = (value: number) => {
	if (!value) return "unknown";
	return new Date(value).toLocaleTimeString();
};

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

export function HomePage() {
	const healthQuery = useQuery(healthQueryOptions());

	return (
		<div className="grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Health Query</CardTitle>
					<CardDescription>
						读取 <code>/api/health</code>，展示 Query 的加载状态与刷新行为。
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant={healthQuery.isSuccess ? "default" : "outline"}>
							{healthQuery.status}
						</Badge>
						{healthQuery.isFetching && <Badge variant="secondary">fetching</Badge>}
					</div>

					{healthQuery.isPending && (
						<p className="text-sm text-muted-foreground">Loading health data...</p>
					)}

					{healthQuery.isError && (
						<p className="text-sm text-destructive">
							{readErrorMessage(healthQuery.error)}
						</p>
					)}

					{healthQuery.data && (
						<div className="space-y-2 text-sm">
							<p>
								Status: <strong>{healthQuery.data.status}</strong>
							</p>
							<p>
								Environment: <strong>{healthQuery.data.appEnv}</strong>
							</p>
							<p>
								API Version: <strong>{healthQuery.data.apiVersion}</strong>
							</p>
							<p>
								Server Timestamp: <strong>{healthQuery.data.timestamp}</strong>
							</p>
						</div>
					)}
				</CardContent>
				<CardFooter className="flex items-center justify-between gap-3">
					<p className="text-xs text-muted-foreground">
						Last updated: {formatTime(healthQuery.dataUpdatedAt)}
					</p>
					<Button
						type="button"
						variant="outline"
						onClick={() => healthQuery.refetch()}
						disabled={healthQuery.isFetching}
					>
						Refetch
					</Button>
				</CardFooter>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Expected Effect</CardTitle>
					<CardDescription>接入后可见行为。</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2 text-sm text-muted-foreground">
					<p>1. 顶部导航可在 Home / Users 路由间切换。</p>
					<p>2. Home 页显示 Query 状态（pending/success/fetching）。</p>
					<p>3. 点击 Refetch 会触发新的请求并更新更新时间。</p>
				</CardContent>
			</Card>
		</div>
	);
}
