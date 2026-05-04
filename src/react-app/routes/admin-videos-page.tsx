import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stream } from "@cloudflare/stream-react";
import { VideoEditDrawer } from "@/components/video/admin/video-edit-drawer";
import { VideoList } from "@/components/video/admin/video-list";
import { VideoWorkbenchHeader } from "@/components/video/admin/video-workbench-header";
import { UploadTaskPanel } from "@/components/video/admin/upload-task-panel";
import {
	buildVideoListRows,
	getVideoDateTimeLabel,
} from "@/components/video/admin/video-state";
import {
	ApiClientError,
	createAdminVideoUploadUrl,
	deleteAdminVideoDraft,
	importAdminVideo,
	publishAdminVideo,
	syncAdminVideoCatalog,
	syncAdminVideoStatus,
	unpublishAdminVideo,
	updateAdminVideo,
	uploadAdminAsset,
	type AdminVideoRecord,
	type UploadAdminAssetInput,
} from "@/lib/api";
import { runVideoUploadTask, type UploadTaskStatus } from "@/lib/video-upload-task";
import {
	scheduleVideoPlayerSdkWarmup,
	warmupVideoPlaybackIntent,
} from "@/lib/video-player-warmup";
import {
	adminVideosQueryKey,
	adminVideosQueryOptions,
	publicVideosQueryKey,
} from "@/lib/query-options";
import {
	pickProcessingVideoIds,
	summarizeProcessingVideoSync,
} from "@/lib/video-sync";
import { isDeleteDraftConfirmationMatch } from "@/routes/admin-videos-page.delete-confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

const MAX_PROCESSING_VIDEO_SYNC_PER_REFRESH = 12;
const EMPTY_ADMIN_VIDEOS: AdminVideoRecord[] = [];

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
	const adminVideos = videosQuery.data ?? EMPTY_ADMIN_VIDEOS;
	const refetchAdminVideos = videosQuery.refetch;

	const [uploadTitle, setUploadTitle] = useState("");
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [uploadStatus, setUploadStatus] = useState<UploadTaskStatus>("idle");
	const [uploadProgressPercent, setUploadProgressPercent] = useState(0);
	const [importStreamVideoId, setImportStreamVideoId] = useState("");
	const [importTitle, setImportTitle] = useState("");
	const [importPosterUrl, setImportPosterUrl] = useState("");
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [autoRefreshUntil, setAutoRefreshUntil] = useState<number | null>(null);
	const [activePreviewStreamVideoId, setActivePreviewStreamVideoId] = useState<
		string | null
	>(null);
	const [pendingDeleteVideo, setPendingDeleteVideo] =
		useState<AdminVideoRecord | null>(null);
	const [deleteConfirmStreamInput, setDeleteConfirmStreamInput] = useState("");
	const [editingVideo, setEditingVideo] = useState<AdminVideoRecord | null>(null);
	const [editTitle, setEditTitle] = useState("");
	const [editPoster, setEditPoster] = useState("");
	const [editBaselineUpdatedAt, setEditBaselineUpdatedAt] =
		useState<string | null>(null);
	const refreshInFlightRef = useRef(false);

	const invalidateVideoQueries = async () => {
		await queryClient.invalidateQueries({ queryKey: adminVideosQueryKey });
		await queryClient.invalidateQueries({ queryKey: publicVideosQueryKey });
	};

	const updateMetadataMutation = useMutation({ mutationFn: updateAdminVideo });
	const uploadPosterMutation = useMutation({
		mutationFn: (payload: UploadAdminAssetInput) => uploadAdminAsset(payload),
	});
	const importMutation = useMutation({ mutationFn: importAdminVideo });
	const publishMutation = useMutation({ mutationFn: publishAdminVideo });
	const unpublishMutation = useMutation({ mutationFn: unpublishAdminVideo });
	const syncMutation = useMutation({ mutationFn: syncAdminVideoStatus });
	const deleteDraftMutation = useMutation({ mutationFn: deleteAdminVideoDraft });
	const syncCatalogMutation = useMutation({ mutationFn: syncAdminVideoCatalog });

	const isActionPending = useMemo(
		() =>
			updateMetadataMutation.isPending ||
			importMutation.isPending ||
			publishMutation.isPending ||
			unpublishMutation.isPending ||
			syncMutation.isPending ||
			deleteDraftMutation.isPending ||
			syncCatalogMutation.isPending,
		[
			updateMetadataMutation.isPending,
			importMutation.isPending,
			publishMutation.isPending,
			unpublishMutation.isPending,
			syncMutation.isPending,
			deleteDraftMutation.isPending,
			syncCatalogMutation.isPending,
		],
	);

	const videoRows = useMemo(
		() => buildVideoListRows(adminVideos),
		[adminVideos],
	);
	const activePreviewVideo = useMemo(() => {
		if (adminVideos.length === 0) return null;
		if (!activePreviewStreamVideoId) return adminVideos[0] ?? null;
		const matched = adminVideos.find(
			(video) => video.streamVideoId === activePreviewStreamVideoId,
		);
		return matched ?? adminVideos[0] ?? null;
	}, [adminVideos, activePreviewStreamVideoId]);

	useEffect(() => {
		void scheduleVideoPlayerSdkWarmup();
	}, []);

	const hasRemoteUpdateConflict = useMemo(() => {
		if (!editingVideo || !editBaselineUpdatedAt) return false;
		const latest = adminVideos.find((video) => video.id === editingVideo.id);
		if (!latest) return false;
		return latest.updatedAt !== editBaselineUpdatedAt;
	}, [adminVideos, editingVideo, editBaselineUpdatedAt]);

	const resetNotice = () => {
		setStatusMessage(null);
		setErrorMessage(null);
	};

	const handleRefreshVideos = useCallback(
		async (mode: "manual" | "auto") => {
			if (refreshInFlightRef.current) return;
			if (mode === "manual") {
				setStatusMessage(null);
				setErrorMessage(null);
			}

			refreshInFlightRef.current = true;
			setIsRefreshing(true);

			try {
				const processingVideoIds = pickProcessingVideoIds(
					adminVideos,
					MAX_PROCESSING_VIDEO_SYNC_PER_REFRESH,
				);
				const syncSummary =
					processingVideoIds.length === 0
						? { total: 0, synced: 0, failed: 0 }
						: summarizeProcessingVideoSync(
								await Promise.allSettled(
									processingVideoIds.map((videoId) =>
										syncAdminVideoStatus(videoId),
									),
								),
							);

				await refetchAdminVideos();

				if (mode === "manual") {
					if (syncSummary.total === 0) {
						setStatusMessage("已刷新列表（无处理中视频）");
					} else if (syncSummary.failed === 0) {
						setStatusMessage(
							`已同步 ${syncSummary.synced} 条处理中视频并刷新列表`,
						);
					} else {
						setStatusMessage(
							`已同步 ${syncSummary.synced}/${syncSummary.total} 条处理中视频并刷新列表，${syncSummary.failed} 条同步失败`,
						);
					}
				}
			} catch (error) {
				setErrorMessage(readErrorMessage(error));
			} finally {
				refreshInFlightRef.current = false;
				setIsRefreshing(false);
			}
		},
		[adminVideos, refetchAdminVideos],
	);

	useEffect(() => {
		if (!autoRefreshUntil) return;

		const timer = globalThis.setInterval(() => {
			if (Date.now() >= autoRefreshUntil) {
				setAutoRefreshUntil(null);
				return;
			}
			void handleRefreshVideos("auto");
		}, 3000);

		return () => globalThis.clearInterval(timer);
	}, [autoRefreshUntil, handleRefreshVideos]);

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

	const handleImportVideo = async () => {
		resetNotice();
		const streamVideoId = importStreamVideoId.trim();
		if (!streamVideoId) {
			setErrorMessage("请先输入 Stream Video ID");
			return;
		}

		try {
			const result = await importMutation.mutateAsync({
				streamVideoId,
				title: importTitle.trim() || undefined,
				posterUrl: importPosterUrl.trim() || undefined,
			});
			setImportStreamVideoId("");
			setImportTitle("");
			setImportPosterUrl("");
			setStatusMessage(
				result.reused
					? `已复用现有记录：${result.video.id}`
					: `导入成功：${result.video.id}`,
			);
			await invalidateVideoQueries();
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
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

	const handleSyncCatalog = async () => {
		resetNotice();
		try {
			const summary = await syncCatalogMutation.mutateAsync();
			setStatusMessage(
				`同步完成：新增 ${summary.created}，更新 ${summary.updated}，下架 ${summary.downgraded}，失败 ${summary.failed}`,
			);
			await invalidateVideoQueries();
		} catch (error) {
			if (error instanceof ApiClientError && error.code === "CONFLICT") {
				setStatusMessage("同步进行中");
				return;
			}
			setErrorMessage(readErrorMessage(error));
		}
	};

	const handleDeleteDraft = (video: AdminVideoRecord) => {
		resetNotice();
		setPendingDeleteVideo(video);
		setDeleteConfirmStreamInput("");
	};

	const handleCancelDeleteDraft = () => {
		if (!pendingDeleteVideo) return;
		const canceledVideoId = pendingDeleteVideo.id;
		setPendingDeleteVideo(null);
		setDeleteConfirmStreamInput("");
		setStatusMessage(`已取消删除草稿 ${canceledVideoId}`);
	};

	const handleConfirmDeleteDraft = async () => {
		if (!pendingDeleteVideo) return;
		resetNotice();
		if (
			!isDeleteDraftConfirmationMatch(
				deleteConfirmStreamInput,
				pendingDeleteVideo.streamVideoId,
			)
		) {
			setErrorMessage("输入的 Stream Video ID 不匹配，已阻止删除");
			return;
		}

		try {
			const deletedVideoId = pendingDeleteVideo.id;
			await deleteDraftMutation.mutateAsync(deletedVideoId);
			if (editingVideo?.id === deletedVideoId) {
				closeEditDrawer();
			}
			setPendingDeleteVideo(null);
			setDeleteConfirmStreamInput("");
			setStatusMessage(`已删除草稿 ${deletedVideoId}`);
			await invalidateVideoQueries();
		} catch (error) {
			setErrorMessage(readErrorMessage(error));
		}
	};

	const handlePreviewVideo = (video: AdminVideoRecord) => {
		setActivePreviewStreamVideoId(video.streamVideoId);
	};

	const activePreviewStreamVideoIdForList =
		activePreviewVideo?.streamVideoId ?? null;
	const isDeleteConfirmationMatched = pendingDeleteVideo
		? isDeleteDraftConfirmationMatch(
				deleteConfirmStreamInput,
				pendingDeleteVideo.streamVideoId,
			)
		: false;

	return (
		<div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-8">
			<VideoWorkbenchHeader />

			<section className="space-y-4 rounded-2xl border border-border bg-card p-4">
				<div className="space-y-1">
					<h2 className="text-base font-semibold tracking-tight">
						导入已有 Stream 视频
					</h2>
					<p className="text-xs text-muted-foreground">
						优先复用已上传素材。导入仅写入当前环境 D1 记录，不会新增 Stream 计费对象。
					</p>
				</div>
				<div className="grid gap-3 md:grid-cols-3">
					<div className="space-y-2">
						<Label htmlFor="import-stream-video-id">Stream Video ID</Label>
						<Input
							id="import-stream-video-id"
							value={importStreamVideoId}
							onChange={(event) => setImportStreamVideoId(event.target.value)}
							placeholder="例如：c8f4f2d8f7a24e0f9f7d..."
							disabled={importMutation.isPending}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="import-video-title">标题（可选）</Label>
						<Input
							id="import-video-title"
							value={importTitle}
							onChange={(event) => setImportTitle(event.target.value)}
							placeholder="例如：周末家庭记录"
							disabled={importMutation.isPending}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="import-video-poster">封面 URL（可选）</Label>
						<Input
							id="import-video-poster"
							value={importPosterUrl}
							onChange={(event) => setImportPosterUrl(event.target.value)}
							placeholder="https://..."
							disabled={importMutation.isPending}
						/>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => void handleImportVideo()}
						disabled={importMutation.isPending}
					>
						{importMutation.isPending ? "导入中..." : "导入已有视频"}
					</Button>
					<p className="text-xs text-muted-foreground">
						同一环境重复导入同一 Stream Video ID 时会直接复用已有记录。
					</p>
				</div>
			</section>

			<div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
				新上传会创建新的 Stream 计费对象。若素材已在任一环境上传，优先使用“导入已有 Stream 视频”。
			</div>

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
							onClick={() => void handleSyncCatalog()}
							disabled={syncCatalogMutation.isPending}
						>
							{syncCatalogMutation.isPending
								? "同步中..."
								: "同步 Stream 目录"}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => void handleRefreshVideos("manual")}
							disabled={videosQuery.isFetching || isRefreshing}
						>
							{videosQuery.isFetching || isRefreshing ? "刷新中..." : "手动刷新"}
						</Button>
					</div>
				</div>

				{statusMessage ? (
					<div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
						{statusMessage}
					</div>
				) : null}

				{pendingDeleteVideo ? (
					<div className="space-y-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-4 text-sm text-rose-900">
						<div className="space-y-1">
							<p className="font-semibold">删除草稿（高风险操作）</p>
							<p>
								此操作会删除 Cloudflare Stream 源文件，不仅是当前环境本地草稿记录。
							</p>
							<p>
								dev 与 prod 当前共用同一 Stream 资源池，任一环境删除都会影响另一环境。
							</p>
							<p>删除后不可恢复，需要重新上传或重新导入才能恢复。</p>
							<p className="text-xs text-rose-700">
								目标视频：{pendingDeleteVideo.id}（Stream Video ID：
								{pendingDeleteVideo.streamVideoId}）
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="delete-draft-confirm-stream-video-id">
								请输入目标 Stream Video ID 以确认删除
							</Label>
							<Input
								id="delete-draft-confirm-stream-video-id"
								value={deleteConfirmStreamInput}
								onChange={(event) =>
									setDeleteConfirmStreamInput(event.target.value)
								}
								placeholder={pendingDeleteVideo.streamVideoId}
								autoComplete="off"
								spellCheck={false}
								disabled={deleteDraftMutation.isPending}
							/>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleCancelDeleteDraft}
								disabled={deleteDraftMutation.isPending}
							>
								取消删除
							</Button>
							<Button
								type="button"
								onClick={() => void handleConfirmDeleteDraft()}
								disabled={
									deleteDraftMutation.isPending || !isDeleteConfirmationMatched
								}
							>
								{deleteDraftMutation.isPending ? "删除中..." : "确认删除草稿"}
							</Button>
						</div>
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
					<div className="space-y-4">
						{activePreviewVideo ? (
							<section className="space-y-2" aria-live="polite">
								<div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[color:rgba(166,124,82,0.24)] bg-black">
									<Stream
										key={activePreviewVideo.streamVideoId}
										src={activePreviewVideo.streamVideoId}
										controls
										autoplay
										muted={false}
										loop={false}
										preload="metadata"
										responsive={false}
										width="100%"
										height="100%"
										className="h-full w-full"
										poster={activePreviewVideo.posterUrl ?? undefined}
									/>
								</div>
								<div className="space-y-1">
									<p className="text-xs uppercase tracking-[0.12em] text-[color:var(--brand-primary)]">
										当前预览
									</p>
									<p className="text-sm font-medium text-foreground">
										{activePreviewVideo.title}
									</p>
								</div>
							</section>
						) : null}
					<VideoList
						videos={videoRows}
						isActionPending={isActionPending}
						activeStreamVideoId={activePreviewStreamVideoIdForList}
						onPreview={handlePreviewVideo}
						onPreviewIntent={(video) =>
							void warmupVideoPlaybackIntent(video.streamVideoId)
						}
						onPublish={(videoId) => void handlePublish(videoId)}
						onUnpublish={(videoId) => void handleUnpublish(videoId)}
						onOpenEdit={(video) => handleOpenEditDrawer(video)}
						onSyncStatus={(videoId) => void handleSyncStatus(videoId)}
						onDeleteDraft={(video) => handleDeleteDraft(video)}
					/>
					</div>
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
		</div>
	);
}
