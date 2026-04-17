import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { VideoPlayerModal } from "@/components/video/video-player-modal";
import { VideoStatusBoard } from "@/components/video/admin/video-status-board";
import { VideoWorkbenchHeader } from "@/components/video/admin/video-workbench-header";
import { UploadTaskPanel } from "@/components/video/admin/upload-task-panel";
import {
	buildVideoBoardColumns,
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

	const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
	const [posterDrafts, setPosterDrafts] = useState<Record<string, string>>({});
	const [uploadTitle, setUploadTitle] = useState("");
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [uploadStatus, setUploadStatus] = useState<UploadTaskStatus>("idle");
	const [uploadProgressPercent, setUploadProgressPercent] = useState(0);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [autoRefreshUntil, setAutoRefreshUntil] = useState<number | null>(null);
	const [activeInlinePreviewId, setActiveInlinePreviewId] = useState<string | null>(null);
	const [selectedVideo, setSelectedVideo] = useState<AdminVideoRecord | null>(null);

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

	const boardColumns = useMemo(
		() => buildVideoBoardColumns(videosQuery.data ?? []),
		[videosQuery.data],
	);

	useEffect(() => {
		if (!autoRefreshUntil) return;
		const now = Date.now();
		if (now >= autoRefreshUntil) {
			setAutoRefreshUntil(null);
			return;
		}

		const timer = globalThis.setInterval(() => {
			if (Date.now() >= autoRefreshUntil) {
				setAutoRefreshUntil(null);
				return;
			}
			void videosQuery.refetch();
		}, 3000);

		return () => globalThis.clearInterval(timer);
	}, [autoRefreshUntil, videosQuery]);

	const resetNotice = () => {
		setStatusMessage(null);
		setErrorMessage(null);
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

	const resolveTitle = (video: AdminVideoRecord) =>
		titleDrafts[video.id] ?? video.title;
	const resolvePoster = (video: AdminVideoRecord) =>
		posterDrafts[video.id] ?? (video.posterUrl ?? "");

	const handleSaveMetadata = async (video: AdminVideoRecord) => {
		resetNotice();
		const title = resolveTitle(video).trim();
		if (!title) {
			setErrorMessage("标题不能为空");
			return;
		}

		try {
			await updateMetadataMutation.mutateAsync({
				videoId: video.id,
				title,
				posterUrl: resolvePoster(video).trim() || null,
			});
			setStatusMessage(`已保存 ${video.id} 的元信息`);
			await invalidateVideoQueries();
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
		}
	};

	const handleUploadPosterFile = async (videoId: string, file: File) => {
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

			setPosterDrafts((prev) => ({ ...prev, [videoId]: assetUrl }));
			setStatusMessage(
				`封面上传成功，已回填 ${videoId} 的封面地址，点击“保存信息”即可生效`,
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
					<h2 className="text-lg font-semibold tracking-tight">状态看板</h2>
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

				{videosQuery.data && videosQuery.data.length > 0 ? (
					<VideoStatusBoard
						columns={boardColumns}
						titleDrafts={titleDrafts}
						posterDrafts={posterDrafts}
						activeInlinePreviewId={activeInlinePreviewId}
						isActionPending={isActionPending}
						onTitleDraft={(videoId, value) =>
							setTitleDrafts((prev) => ({ ...prev, [videoId]: value }))
						}
						onPosterDraft={(videoId, value) =>
							setPosterDrafts((prev) => ({ ...prev, [videoId]: value }))
						}
						isPosterUploading={uploadPosterMutation.isPending}
						onUploadPosterFile={(videoId, file) =>
							void handleUploadPosterFile(videoId, file)
						}
						onSaveMetadata={(video) => void handleSaveMetadata(video)}
						onPublish={(videoId) => void handlePublish(videoId)}
						onUnpublish={(videoId) => void handleUnpublish(videoId)}
						onSyncStatus={(videoId) => void handleSyncStatus(videoId)}
						onDeleteDraft={(videoId) => void handleDeleteDraft(videoId)}
						onInlinePreview={(videoId) => setActiveInlinePreviewId(videoId)}
						onOpenModal={(video) => setSelectedVideo(video)}
					/>
				) : null}
			</section>

			<VideoPlayerModal
				open={Boolean(selectedVideo)}
				onClose={() => setSelectedVideo(null)}
				streamVideoId={selectedVideo?.streamVideoId ?? null}
			/>
		</div>
	);
}
