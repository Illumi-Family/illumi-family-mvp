import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	createAdminVideoUploadUrl,
	deleteAdminVideoDraft,
	publishAdminVideo,
	syncAdminVideoStatus,
	unpublishAdminVideo,
	updateAdminVideo,
	type AdminVideoRecord,
} from "@/lib/api";
import {
	adminVideosQueryKey,
	adminVideosQueryOptions,
	publicVideosQueryKey,
} from "@/lib/query-options";

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

const formatDateTime = (value: string | null) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return date.toLocaleString();
};

const formatDuration = (seconds: number | null) => {
	if (seconds === null || Number.isNaN(seconds)) return "-";
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remain = seconds % 60;
	return `${minutes}m ${remain}s`;
};

const processingBadgeClass: Record<AdminVideoRecord["processingStatus"], string> = {
	processing: "bg-amber-100 text-amber-800",
	ready: "bg-emerald-100 text-emerald-800",
	failed: "bg-rose-100 text-rose-800",
};

const publishBadgeClass: Record<AdminVideoRecord["publishStatus"], string> = {
	draft: "bg-slate-100 text-slate-800",
	published: "bg-indigo-100 text-indigo-800",
};

export function AdminVideosPage() {
	const queryClient = useQueryClient();
	const videosQuery = useQuery(adminVideosQueryOptions());

	const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
	const [posterDrafts, setPosterDrafts] = useState<Record<string, string>>({});
	const [uploadTitle, setUploadTitle] = useState("");
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const invalidateVideoQueries = async () => {
		await queryClient.invalidateQueries({ queryKey: adminVideosQueryKey });
		await queryClient.invalidateQueries({ queryKey: publicVideosQueryKey });
	};

	const uploadUrlMutation = useMutation({
		mutationFn: createAdminVideoUploadUrl,
	});
	const updateMetadataMutation = useMutation({
		mutationFn: updateAdminVideo,
	});
	const publishMutation = useMutation({
		mutationFn: publishAdminVideo,
	});
	const unpublishMutation = useMutation({
		mutationFn: unpublishAdminVideo,
	});
	const syncMutation = useMutation({
		mutationFn: syncAdminVideoStatus,
	});
	const deleteDraftMutation = useMutation({
		mutationFn: deleteAdminVideoDraft,
	});

	const isActionPending = useMemo(
		() =>
			uploadUrlMutation.isPending ||
			updateMetadataMutation.isPending ||
			publishMutation.isPending ||
			unpublishMutation.isPending ||
			syncMutation.isPending ||
			deleteDraftMutation.isPending,
		[
			uploadUrlMutation.isPending,
			updateMetadataMutation.isPending,
			publishMutation.isPending,
			unpublishMutation.isPending,
			syncMutation.isPending,
			deleteDraftMutation.isPending,
		],
	);

	const resetNotice = () => {
		setStatusMessage(null);
		setErrorMessage(null);
	};

	const handleUpload = async () => {
		resetNotice();
		if (!uploadFile) {
			setErrorMessage("Please select a video file before uploading");
			return;
		}
		if (uploadFile.size > 200 * 1024 * 1024) {
			setErrorMessage("Files larger than 200MB require tus upload (not enabled yet)");
			return;
		}

		let issuedVideoId: string | null = null;
		try {
			const uploadMeta = await uploadUrlMutation.mutateAsync({
				title: uploadTitle.trim() || undefined,
			});
			issuedVideoId = uploadMeta.videoId;

			const formData = new FormData();
			formData.append("file", uploadFile, uploadFile.name);
			const uploadResponse = await fetch(uploadMeta.uploadUrl, {
				method: "POST",
				body: formData,
			});
			if (!uploadResponse.ok) {
				throw new Error(`Upload failed with status ${uploadResponse.status}`);
			}

			setStatusMessage(`Upload started for video ${uploadMeta.videoId}`);
			setUploadFile(null);
			setUploadTitle("");
			await invalidateVideoQueries();
		} catch (error) {
			if (issuedVideoId) {
				try {
					await deleteAdminVideoDraft(issuedVideoId);
				} catch (cleanupError) {
					console.warn("Failed to cleanup draft video after upload error", {
						videoId: issuedVideoId,
						cleanupError,
					});
				}
				await invalidateVideoQueries();
			}
			setErrorMessage(readErrorMessage(error));
		}
	};

	const resolveTitle = (video: AdminVideoRecord) =>
		titleDrafts[video.id] ?? video.title;
	const resolvePoster = (video: AdminVideoRecord) =>
		posterDrafts[video.id] ?? (video.posterUrl ?? "");

	const handleSaveMetadata = async (video: AdminVideoRecord) => {
		resetNotice();
		const title = resolveTitle(video).trim();
		if (!title) {
			setErrorMessage("Title cannot be empty");
			return;
		}

		try {
			await updateMetadataMutation.mutateAsync({
				videoId: video.id,
				title,
				posterUrl: resolvePoster(video).trim() || null,
			});
			setStatusMessage(`Saved metadata for ${video.id}`);
			await invalidateVideoQueries();
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
		}
	};

	const handlePublish = async (videoId: string) => {
		resetNotice();
		try {
			await publishMutation.mutateAsync(videoId);
			setStatusMessage(`Published ${videoId}`);
			await invalidateVideoQueries();
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
		}
	};

	const handleUnpublish = async (videoId: string) => {
		resetNotice();
		try {
			await unpublishMutation.mutateAsync(videoId);
			setStatusMessage(`Unpublished ${videoId}`);
			await invalidateVideoQueries();
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
		}
	};

	const handleSyncStatus = async (videoId: string) => {
		resetNotice();
		try {
			await syncMutation.mutateAsync(videoId);
			setStatusMessage(`Synced status for ${videoId}`);
			await invalidateVideoQueries();
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
		}
	};

	const handleDeleteDraft = async (videoId: string) => {
		resetNotice();
		const shouldDelete = globalThis.confirm?.(
			`Delete draft video ${videoId}? This action cannot be undone.`,
		);
		if (!shouldDelete) return;

		try {
			await deleteDraftMutation.mutateAsync(videoId);
			setStatusMessage(`Deleted draft ${videoId}`);
			await invalidateVideoQueries();
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
		}
	};

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
			<header className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">Admin Videos</h1>
				<p className="text-sm text-muted-foreground">
					Issue Stream upload URLs, sync processing state, and control publish lifecycle.
				</p>
			</header>

			<section className="rounded-2xl border border-border bg-card p-4">
				<div className="grid gap-3 md:grid-cols-[1fr,1fr,auto] md:items-end">
					<div className="space-y-2">
						<Label htmlFor="video-title">Video title</Label>
						<Input
							id="video-title"
							value={uploadTitle}
							onChange={(event) => setUploadTitle(event.target.value)}
							placeholder="e.g. Weekend Story"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="video-file">Video file</Label>
						<Input
							id="video-file"
							type="file"
							accept="video/*"
							onChange={(event) =>
								setUploadFile(event.target.files?.[0] ?? null)
							}
						/>
					</div>
					<Button type="button" onClick={handleUpload} disabled={isActionPending}>
						{uploadUrlMutation.isPending ? "Issuing..." : "Upload Video"}
					</Button>
				</div>
			</section>

			{statusMessage ? (
				<div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
					{statusMessage}
				</div>
			) : null}
			{errorMessage ? (
				<div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
					{errorMessage}
				</div>
			) : null}

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-medium">Video Inventory</h2>
					<Button
						type="button"
						variant="outline"
						onClick={() => videosQuery.refetch()}
						disabled={videosQuery.isFetching}
					>
						{videosQuery.isFetching ? "Refreshing..." : "Refresh"}
					</Button>
				</div>

				{videosQuery.isLoading ? (
					<div className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
						Loading videos...
					</div>
				) : null}

				{videosQuery.isError ? (
					<div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-6 text-sm text-rose-800">
						Failed to load videos: {readErrorMessage(videosQuery.error)}
					</div>
				) : null}

				{videosQuery.data && videosQuery.data.length === 0 ? (
					<div className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
						No videos yet. Upload one to get started.
					</div>
				) : null}

				{videosQuery.data?.map((video) => {
					const canPublish =
						video.processingStatus === "ready" && video.publishStatus === "draft";

					return (
						<div
							key={video.id}
							className="space-y-4 rounded-2xl border border-border bg-card p-4"
						>
							<div className="flex flex-wrap items-center gap-2">
								<Badge className={processingBadgeClass[video.processingStatus]}>
									{video.processingStatus}
								</Badge>
								<Badge className={publishBadgeClass[video.publishStatus]}>
									{video.publishStatus}
								</Badge>
								<p className="text-xs text-muted-foreground">ID: {video.id}</p>
								<p className="text-xs text-muted-foreground">
									Stream: {video.streamVideoId}
								</p>
							</div>

							<div className="grid gap-3 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor={`title-${video.id}`}>Title</Label>
									<Input
										id={`title-${video.id}`}
										value={resolveTitle(video)}
										onChange={(event) =>
											setTitleDrafts((prev) => ({
												...prev,
												[video.id]: event.target.value,
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`poster-${video.id}`}>Poster URL</Label>
									<Input
										id={`poster-${video.id}`}
										value={resolvePoster(video)}
										onChange={(event) =>
											setPosterDrafts((prev) => ({
												...prev,
												[video.id]: event.target.value,
											}))
										}
									/>
								</div>
							</div>

							<div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
								<p>Duration: {formatDuration(video.durationSeconds)}</p>
								<p>Updated: {formatDateTime(video.updatedAt)}</p>
								<p>Published: {formatDateTime(video.publishedAt)}</p>
							</div>

							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => handleSaveMetadata(video)}
									disabled={isActionPending}
								>
									Save Metadata
								</Button>
								<Button
									type="button"
									onClick={() => handlePublish(video.id)}
									disabled={!canPublish || isActionPending}
								>
									Publish
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => handleUnpublish(video.id)}
									disabled={video.publishStatus !== "published" || isActionPending}
								>
									Unpublish
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => handleSyncStatus(video.id)}
									disabled={isActionPending}
								>
									Sync Status
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => handleDeleteDraft(video.id)}
									disabled={video.publishStatus !== "draft" || isActionPending}
								>
									Delete Draft
								</Button>
							</div>
						</div>
					);
				})}
			</section>
		</div>
	);
}
