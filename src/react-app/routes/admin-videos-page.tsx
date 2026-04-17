import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { VideoPlayerModal } from "@/components/video/video-player-modal";
import { VideoEditDrawer } from "@/components/video/admin/video-edit-drawer";
import { VideoList } from "@/components/video/admin/video-list";
import { VideoWorkbenchHeader } from "@/components/video/admin/video-workbench-header";
import { UploadTaskPanel } from "@/components/video/admin/upload-task-panel";
import {
	buildVideoListRows,
	getVideoDateTimeLabel,
} from "@/components/video/admin/video-state";
import {
	createAdminVideoUploadUrl,
	deleteAdminVideoDraft,
	publishAdminVideo,
	syncAdminVideoStatus,
	unpublishAdminVideo,
	updateAdminVideo,
	uploadAdminAsset,
	type AdminVideoRecord,
	type UploadAdminAssetInput,
} from "@/lib/api";
import { runVideoUploadTask, type UploadTaskStatus } from "@/lib/video-upload-task";
import {
	adminVideosQueryKey,
	adminVideosQueryOptions,
	publicVideosQueryKey,
} from "@/lib/query-options";
import { Button } from "@/components/ui/button";

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

const toBase64 = (arrayBuffer: ArrayBuffer) => {
	const bytes = new Uint8Array(arrayBuffer);
	let binary = "";
	const chunkSize = 0x8000;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		const chunk = bytes.subarray(i, i + chunkSize);
		binary += String.fromCharCode(...chunk);
	}
	return btoa(binary);
};

export function AdminVideosPage() {
	const queryClient = useQueryClient();
	const videosQuery = useQuery(adminVideosQueryOptions());

	const [uploadTitle, setUploadTitle] = useState("");
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [uploadStatus, setUploadStatus] = useState<UploadTaskStatus>("idle");
	const [uploadProgressPercent, setUploadProgressPercent] = useState(0);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [autoRefreshUntil, setAutoRefreshUntil] = useState<number | null>(null);
	const [selectedVideo, setSelectedVideo] = useState<AdminVideoRecord | null>(null);
	const [editingVideo, setEditingVideo] = useState<AdminVideoRecord | null>(null);
	const [editTitle, setEditTitle] = useState("");
	const [editPoster, setEditPoster] = useState("");
	const [editBaselineUpdatedAt, setEditBaselineUpdatedAt] =
		useState<string | null>(null);

	const invalidateVideoQueries = async () => {
		await queryClient.invalidateQueries({ queryKey: adminVideosQueryKey });
		await queryClient.invalidateQueries({ queryKey: publicVideosQueryKey });
	};

	const updateMetadataMutation = useMutation({ mutationFn: updateAdminVideo });
	const uploadPosterMutation = useMutation({
		mutationFn: (payload: UploadAdminAssetInput) => uploadAdminAsset(payload),
	});
	const publishMutation = useMutation({ mutationFn: publishAdminVideo });
	const unpublishMutation = useMutation({ mutationFn: unpublishAdminVideo });
	const syncMutation = useMutation({ mutationFn: syncAdminVideoStatus });
	const deleteDraftMutation = useMutation({ mutationFn: deleteAdminVideoDraft });

	const isActionPending = useMemo(
		() =>
			updateMetadataMutation.isPending ||
			publishMutation.isPending ||
			unpublishMutation.isPending ||
			syncMutation.isPending ||
			deleteDraftMutation.isPending,
		[
			updateMetadataMutation.isPending,
			publishMutation.isPending,
			unpublishMutation.isPending,
			syncMutation.isPending,
			deleteDraftMutation.isPending,
		],
	);

	const videoRows = useMemo(
		() => buildVideoListRows(videosQuery.data ?? []),
		[videosQuery.data],
	);

	useEffect(() => {
		if (!autoRefreshUntil) return;

		const timer = globalThis.setInterval(() => {
			if (Date.now() >= autoRefreshUntil) {
				setAutoRefreshUntil(null);
				return;
			}
			void videosQuery.refetch();
		}, 3000);

		return () => globalThis.clearInterval(timer);
	}, [autoRefreshUntil, videosQuery]);

	const hasRemoteUpdateConflict = useMemo(() => {
		if (!editingVideo || !editBaselineUpdatedAt) return false;
		const latest = (videosQuery.data ?? []).find(
			(video) => video.id === editingVideo.id,
		);
		if (!latest) return false;
		return latest.updatedAt !== editBaselineUpdatedAt;
	}, [videosQuery.data, editingVideo, editBaselineUpdatedAt]);

	const resetNotice = () => {
		setStatusMessage(null);
		setErrorMessage(null);
	};

	const closeEditDrawer = () => {
		setEditingVideo(null);
		setEditTitle("");
		setEditPoster("");
		setEditBaselineUpdatedAt(null);
	};

	const handleOpenEditDrawer = (video: AdminVideoRecord) => {
		resetNotice();
		setEditingVideo(video);
		setEditTitle(video.title);
		setEditPoster(video.posterUrl ?? "");
		setEditBaselineUpdatedAt(video.updatedAt);
	};

	const handleUpload = async () => {
		resetNotice();
		if (!uploadFile) {
			setErrorMessage("请先选择视频文件");
			return;
		}
		if (!uploadFile.type.startsWith("video/")) {
			setErrorMessage("仅支持视频文件");
			return;
		}
		if (uploadFile.size > 200 * 1024 * 1024) {
			setErrorMessage("当前版本仅支持 200MB 以内视频文件");
			return;
		}

		try {
			const { videoId } = await runVideoUploadTask({
				taskTitle: uploadTitle,
				file: uploadFile,
				issueUploadUrl: createAdminVideoUploadUrl,
				cleanupDraftVideo: deleteAdminVideoDraft,
				onProgress: (event) => {
					setUploadStatus(event.status);
					setUploadProgressPercent(event.progressPercent);
					if (event.errorMessage) {
						setErrorMessage(event.errorMessage);
					}
				},
			});

			setStatusMessage(`上传完成，视频 ${videoId} 进入处理中`);
			setUploadFile(null);
			setUploadStatus("processing_wait");
			setUploadProgressPercent(100);
			setAutoRefreshUntil(Date.now() + 60_000);
			await invalidateVideoQueries();
		} catch (error) {
			setUploadStatus("failed");
			setErrorMessage(readErrorMessage(error));
			await invalidateVideoQueries();
		}
	};

	const handleRetryUpload = async () => {
		if (!uploadFile) {
			setErrorMessage("没有可重试的文件，请重新选择视频");
			return;
		}
		await handleUpload();
	};

	const handleSaveMetadata = async () => {
		if (!editingVideo) return;
		resetNotice();
		const title = editTitle.trim();
		if (!title) {
			setErrorMessage("标题不能为空");
			return;
		}

		try {
			await updateMetadataMutation.mutateAsync({
				videoId: editingVideo.id,
				title,
				posterUrl: editPoster.trim() || null,
			});
			setStatusMessage(`已保存 ${editingVideo.id} 的元信息`);
			closeEditDrawer();
			await invalidateVideoQueries();
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
		}
	};

	const handleUploadPosterFile = async (file: File) => {
		if (!editingVideo) return;
		resetNotice();
		if (!file.type.startsWith("image/")) {
			setErrorMessage("封面仅支持图片文件");
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			setErrorMessage("封面文件需小于 10MB");
			return;
		}

		try {
			const payload: UploadAdminAssetInput = {
				fileName: file.name,
				contentType: file.type || "application/octet-stream",
				dataBase64: toBase64(await file.arrayBuffer()),
			};
			const asset = await uploadPosterMutation.mutateAsync(payload);
			const assetUrl = `/api/content/assets/${asset.id}`;

			setEditPoster(assetUrl);
			setStatusMessage(
				`封面上传成功，已回填 ${editingVideo.id} 的封面地址，点击“保存信息”即可生效`,
			);
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
		}
	};

	const handlePublish = async (videoId: string) => {
		resetNotice();
		try {
			await publishMutation.mutateAsync(videoId);
			setStatusMessage(`已发布 ${videoId}`);
			await invalidateVideoQueries();
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
		}
	};

	const handleUnpublish = async (videoId: string) => {
		resetNotice();
		try {
			await unpublishMutation.mutateAsync(videoId);
			setStatusMessage(`已下线 ${videoId}`);
			await invalidateVideoQueries();
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
		}
	};

	const handleSyncStatus = async (videoId: string) => {
		resetNotice();
		try {
			await syncMutation.mutateAsync(videoId);
			setStatusMessage(`已同步 ${videoId} 状态`);
			await invalidateVideoQueries();
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
		}
	};

	const handleDeleteDraft = async (videoId: string) => {
		resetNotice();
		const shouldDelete = globalThis.confirm?.(
			`删除草稿 ${videoId} ？该操作不可恢复。`,
		);
		if (!shouldDelete) return;

		try {
			await deleteDraftMutation.mutateAsync(videoId);
			if (editingVideo?.id === videoId) {
				closeEditDrawer();
			}
			setStatusMessage(`已删除草稿 ${videoId}`);
			await invalidateVideoQueries();
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
		}
	};

	return (
		<div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-8">
			<VideoWorkbenchHeader />

			<UploadTaskPanel
				title={uploadTitle}
				file={uploadFile}
				progressPercent={uploadProgressPercent}
				status={uploadStatus}
				errorMessage={errorMessage}
				isSubmitting={uploadStatus === "issuing_url" || uploadStatus === "uploading"}
				onTitleChange={setUploadTitle}
				onSelectFile={setUploadFile}
				onSubmit={() => void handleUpload()}
				onRetry={() => void handleRetryUpload()}
			/>

			<section className="space-y-3">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="space-y-1">
						<h2 className="text-lg font-semibold tracking-tight">视频列表</h2>
						<p className="text-xs text-muted-foreground">共 {videoRows.length} 条</p>
					</div>
					<div className="flex items-center gap-2">
						{autoRefreshUntil ? (
							<p className="text-xs text-muted-foreground">
								自动刷新中，截止 {getVideoDateTimeLabel(new Date(autoRefreshUntil).toISOString())}
							</p>
						) : null}
						<Button
							type="button"
							variant="outline"
							onClick={() => videosQuery.refetch()}
							disabled={videosQuery.isFetching}
						>
							{videosQuery.isFetching ? "刷新中..." : "手动刷新"}
						</Button>
					</div>
				</div>

				{statusMessage ? (
					<div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
						{statusMessage}
					</div>
				) : null}

				{videosQuery.isLoading ? (
					<div className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
						正在加载视频列表...
					</div>
				) : null}

				{videosQuery.isError ? (
					<div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-6 text-sm text-rose-800">
						加载失败：{readErrorMessage(videosQuery.error)}
					</div>
				) : null}

				{videosQuery.data && videosQuery.data.length === 0 ? (
					<div className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
						暂无视频，先上传一个试试。
					</div>
				) : null}

				{videoRows.length > 0 ? (
					<VideoList
						videos={videoRows}
						isActionPending={isActionPending}
						onPreview={(video) => setSelectedVideo(video)}
						onPublish={(videoId) => void handlePublish(videoId)}
						onUnpublish={(videoId) => void handleUnpublish(videoId)}
						onOpenEdit={(video) => handleOpenEditDrawer(video)}
						onSyncStatus={(videoId) => void handleSyncStatus(videoId)}
						onDeleteDraft={(videoId) => void handleDeleteDraft(videoId)}
					/>
				) : null}
			</section>

			<VideoEditDrawer
				open={Boolean(editingVideo)}
				video={editingVideo}
				titleValue={editTitle}
				posterValue={editPoster}
				hasRemoteUpdate={hasRemoteUpdateConflict}
				isSaving={updateMetadataMutation.isPending}
				isPosterUploading={uploadPosterMutation.isPending}
				onClose={closeEditDrawer}
				onTitleChange={setEditTitle}
				onPosterChange={setEditPoster}
				onUploadPosterFile={(file) => void handleUploadPosterFile(file)}
				onSave={() => void handleSaveMetadata()}
			/>

			<VideoPlayerModal
				open={Boolean(selectedVideo)}
				onClose={() => setSelectedVideo(null)}
				streamVideoId={selectedVideo?.streamVideoId ?? null}
			/>
		</div>
	);
}
