import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	CheckCircle2,
	LayoutPanelLeft,
	Plus,
	Save,
	SendHorizontal,
	Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	ApiClientError,
	type HomeSectionEntryKey,
	publishAdminHomeSection,
	saveAdminHomeSectionDraft,
} from "@/lib/api";
import {
	adminHomeSectionsQueryKey,
	adminHomeSectionsQueryOptions,
	adminVideosQueryOptions,
	homeContentQueryKeyPrefix,
} from "@/lib/query-options";

const ENTRY_KEY_OPTIONS: Array<{ value: HomeSectionEntryKey; label: string }> = [
	{ value: "home.main_video", label: "首屏核心视频" },
	{ value: "home.character_videos", label: "角色视频列表" },
	{ value: "home.family_story_videos", label: "家庭故事列表" },
];

const LOCALE = "zh-CN" as const;
const MAX_CHARACTER_VIDEOS = 12;

type MainVideoContent = {
	streamVideoId: string;
};

type VideoListContent = {
	items: Array<{ streamVideoId: string }>;
};

type SectionContentByEntry = {
	"home.main_video": MainVideoContent;
	"home.character_videos": VideoListContent;
	"home.family_story_videos": VideoListContent;
};

const DEFAULT_CONTENT_BY_ENTRY: SectionContentByEntry = {
	"home.main_video": {
		streamVideoId: "",
	},
	"home.character_videos": {
		items: [],
	},
	"home.family_story_videos": {
		items: [],
	},
};

const SECTION_EDITOR_META: Record<
	HomeSectionEntryKey,
	{ moduleName: string; titlePlaceholder: string; maxItems: number | null }
> = {
	"home.main_video": {
		moduleName: "核心视频模块",
		titlePlaceholder: "例如：首页核心视频配置",
		maxItems: null,
	},
	"home.character_videos": {
		moduleName: "角色视频模块",
		titlePlaceholder: "例如：角色视频排序配置",
		maxItems: MAX_CHARACTER_VIDEOS,
	},
	"home.family_story_videos": {
		moduleName: "家庭故事视频模块",
		titlePlaceholder: "例如：家庭故事视频排序配置",
		maxItems: null,
	},
};

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

type ValidationIssue = {
	field: string;
	message: string;
};

const parseValidationIssues = (error: unknown): ValidationIssue[] => {
	if (!(error instanceof ApiClientError)) return [];
	if (!error.details || typeof error.details !== "object") return [];

	const rawIssues = (error.details as { issues?: unknown }).issues;
	if (!Array.isArray(rawIssues)) return [];

	return rawIssues
		.map((item) => {
			if (!item || typeof item !== "object") return null;
			const row = item as { field?: unknown; message?: unknown };
			if (typeof row.field !== "string" || typeof row.message !== "string") {
				return null;
			}
			return {
				field: row.field,
				message: row.message,
			};
		})
		.filter((item): item is ValidationIssue => Boolean(item));
};

const readValidationSummary = (error: unknown) => {
	if (!(error instanceof ApiClientError)) return null;
	if (!error.details || typeof error.details !== "object") return null;
	const summary = (error.details as { summary?: unknown }).summary;
	return typeof summary === "string" ? summary : null;
};

const ensureString = (value: unknown, fallback = "") =>
	typeof value === "string" ? value : fallback;

const normalizeContentForEntry = <K extends HomeSectionEntryKey>(
	entryKey: K,
	value: unknown,
): SectionContentByEntry[K] => {
	if (!value || typeof value !== "object") {
		return DEFAULT_CONTENT_BY_ENTRY[entryKey];
	}
	const raw = value as Record<string, unknown>;

	if (entryKey === "home.main_video") {
		return {
			streamVideoId: ensureString(raw.streamVideoId),
		} as SectionContentByEntry[K];
	}

	const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
	const items = itemsRaw
		.map((item) => {
			if (!item || typeof item !== "object") return null;
			const row = item as { streamVideoId?: unknown };
			return {
				streamVideoId: ensureString(row.streamVideoId),
			};
		})
		.filter((item): item is { streamVideoId: string } => Boolean(item));

	return {
		items,
	} as SectionContentByEntry[K];
};

type DraftFormState = {
	title: string;
	content: SectionContentByEntry[HomeSectionEntryKey];
};

const buildDraftKey = (entryKey: HomeSectionEntryKey) => `${LOCALE}:${entryKey}`;

type AdminPageProps = {
	initialEntryKey?: HomeSectionEntryKey;
};

const normalizeStreamVideoId = (value: string) => value.trim();

const hasDuplicateStreamVideoId = (items: Array<{ streamVideoId: string }>) => {
	const seen = new Set<string>();
	for (const item of items) {
		const streamVideoId = normalizeStreamVideoId(item.streamVideoId);
		if (!streamVideoId) continue;
		if (seen.has(streamVideoId)) return true;
		seen.add(streamVideoId);
	}
	return false;
};

export function AdminPage({
	initialEntryKey = "home.main_video",
}: AdminPageProps = {}) {
	const queryClient = useQueryClient();
	const sectionsQuery = useQuery(adminHomeSectionsQueryOptions(LOCALE));
	const videosQuery = useQuery(adminVideosQueryOptions());
	const [entryKey, setEntryKey] = useState<HomeSectionEntryKey>(initialEntryKey);
	const [draftByEntry, setDraftByEntry] = useState<Record<string, DraftFormState>>({});
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

	const activeEntryKey = entryKey;
	const sectionMap = useMemo(
		() => new Map((sectionsQuery.data ?? []).map((section) => [section.entryKey, section])),
		[sectionsQuery.data],
	);

	const selectedSection = useMemo(
		() => sectionMap.get(activeEntryKey),
		[sectionMap, activeEntryKey],
	);

	const baselineFormState = useMemo<DraftFormState>(
		() => ({
			title: selectedSection?.latestTitle ?? SECTION_EDITOR_META[activeEntryKey].moduleName,
			content: normalizeContentForEntry(activeEntryKey, selectedSection?.latestContentJson),
		}),
		[selectedSection, activeEntryKey],
	);

	const resolvedFormState = useMemo<DraftFormState>(() => {
		const existingDraft = draftByEntry[buildDraftKey(activeEntryKey)];
		if (existingDraft) return existingDraft;
		return baselineFormState;
	}, [draftByEntry, activeEntryKey, baselineFormState]);

	const hasUnsavedChanges = useMemo(
		() =>
			resolvedFormState.title !== baselineFormState.title ||
			JSON.stringify(resolvedFormState.content) !==
				JSON.stringify(baselineFormState.content),
		[resolvedFormState, baselineFormState],
	);

	const readyPublishedVideos = useMemo(
		() =>
			(videosQuery.data ?? []).filter(
				(video) =>
					video.processingStatus === "ready" &&
					video.publishStatus === "published",
			),
		[videosQuery.data],
	);

	const videoLabelByStreamId = useMemo(
		() =>
			new Map(
				readyPublishedVideos.map((video) => [video.streamVideoId, video.title || video.streamVideoId]),
			),
		[readyPublishedVideos],
	);

	const setFormState = (partial: Partial<DraftFormState>) => {
		setDraftByEntry((prev) => ({
			...prev,
			[buildDraftKey(activeEntryKey)]: {
				...resolvedFormState,
				...partial,
			},
		}));
	};

	const resetMessage = () => {
		setStatusMessage(null);
		setErrorMessage(null);
		setValidationIssues([]);
	};

	const invalidateAdminSectionQueries = async () => {
		await queryClient.invalidateQueries({
			queryKey: adminHomeSectionsQueryKey(LOCALE),
		});
	};

	const readFieldIssue = (field: string) => {
		const direct = validationIssues.find((issue) => issue.field === field);
		if (direct) return direct.message;
		const prefixed = validationIssues.find((issue) =>
			issue.field.startsWith(`${field}.`),
		);
		return prefixed?.message ?? null;
	};

	const saveDraftMutation = useMutation({
		mutationFn: saveAdminHomeSectionDraft,
		onSuccess: async () => {
			setStatusMessage("草稿已保存");
			setErrorMessage(null);
			setValidationIssues([]);
			await invalidateAdminSectionQueries();
		},
		onError: (error) => {
			setStatusMessage(null);
			setValidationIssues(parseValidationIssues(error));
			setErrorMessage(readValidationSummary(error) ?? readErrorMessage(error));
		},
	});

	const publishMutation = useMutation({
		mutationFn: publishAdminHomeSection,
		onSuccess: async () => {
			setStatusMessage("发布成功");
			setErrorMessage(null);
			setValidationIssues([]);
			await invalidateAdminSectionQueries();
			await queryClient.invalidateQueries({ queryKey: homeContentQueryKeyPrefix });
		},
		onError: (error) => {
			setStatusMessage(null);
			setValidationIssues(parseValidationIssues(error));
			setErrorMessage(readValidationSummary(error) ?? readErrorMessage(error));
		},
	});

	const handleSaveDraft = () => {
		resetMessage();
		if (!resolvedFormState.title.trim()) {
			setErrorMessage("标题不能为空");
			return;
		}

		if (
			(activeEntryKey === "home.family_story_videos" ||
				activeEntryKey === "home.character_videos") &&
			hasDuplicateStreamVideoId((resolvedFormState.content as VideoListContent).items)
		) {
			setErrorMessage("列表中存在重复视频，请先去重");
			return;
		}

		saveDraftMutation.mutate({
			locale: LOCALE,
			entryKey: activeEntryKey,
			title: resolvedFormState.title,
			contentJson: resolvedFormState.content as unknown as Record<string, unknown>,
		});
	};

	const handlePublish = () => {
		resetMessage();
		if (hasUnsavedChanges) {
			setErrorMessage("请先保存草稿，再发布");
			return;
		}
		if (!selectedSection?.latestRevisionId) {
			setErrorMessage("当前没有可发布版本");
			return;
		}

		const shouldPublish = window.confirm(
			`确认发布 ${SECTION_EDITOR_META[activeEntryKey].moduleName}（rev ${selectedSection.latestRevisionNo ?? "-"}）？`,
		);
		if (!shouldPublish) return;

		publishMutation.mutate({
			locale: LOCALE,
			entryKey: activeEntryKey,
			revisionId: selectedSection.latestRevisionId,
		});
	};

	const renderVideoListEditor = (
		entryKey: "home.character_videos" | "home.family_story_videos",
		label: string,
		helperText: string,
	) => {
		const content = resolvedFormState.content as VideoListContent;
		const maxItems = SECTION_EDITOR_META[entryKey].maxItems;
		const reachedMax = maxItems !== null && content.items.length >= maxItems;
		return (
			<div className="space-y-3 border-t border-border/70 pt-4">
				<div className="flex items-center justify-between">
					<p className="text-sm font-medium text-foreground">
						{label}
						{maxItems ? `（最多 ${maxItems} 条）` : ""}
					</p>
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							if (reachedMax) return;
							setFormState({
								content: {
									...content,
									items: [
										...content.items,
										{
											streamVideoId: readyPublishedVideos[0]?.streamVideoId ?? "",
										},
									],
								},
							});
						}}
						disabled={reachedMax}
					>
						<Plus className="mr-1 size-4" />
						新增视频
					</Button>
				</div>
				<p className="text-xs text-muted-foreground">{helperText}</p>
				{readFieldIssue("contentJson.items") ? (
					<p className="text-xs text-destructive">
						{readFieldIssue("contentJson.items")}
					</p>
				) : null}
				{content.items.length === 0 ? (
					<p className="rounded-lg border border-dashed border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
						当前列表为空，前台将展示空态。
					</p>
				) : null}
				{content.items.map((item, index) => (
					<div
						key={`${entryKey}-${index}`}
						className="space-y-3 rounded-xl border border-border/70 p-3"
					>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<p className="text-sm font-medium text-foreground">
								视频 {index + 1}
							</p>
							<div className="flex items-center gap-1">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										if (index === 0) return;
										const nextItems = [...content.items];
										[nextItems[index - 1], nextItems[index]] = [
											nextItems[index],
											nextItems[index - 1],
										];
										setFormState({
											content: {
												...content,
												items: nextItems,
											},
										});
									}}
									disabled={index === 0}
								>
									上移
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										if (index >= content.items.length - 1) return;
										const nextItems = [...content.items];
										[nextItems[index], nextItems[index + 1]] = [
											nextItems[index + 1],
											nextItems[index],
										];
										setFormState({
											content: {
												...content,
												items: nextItems,
											},
										});
									}}
									disabled={index >= content.items.length - 1}
								>
									下移
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() =>
										setFormState({
											content: {
												...content,
												items: content.items.filter((_, i) => i !== index),
											},
										})
									}
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${entryKey}-video-select-${index}`}>视频选择</Label>
							<select
								id={`${entryKey}-video-select-${index}`}
								value={item.streamVideoId}
								onChange={(event) => {
									const nextItems = [...content.items];
									nextItems[index] = {
										...item,
										streamVideoId: event.target.value,
									};
									setFormState({
										content: {
											...content,
											items: nextItems,
										},
									});
								}}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
							>
								<option value="">请选择视频</option>
								{readyPublishedVideos.map((video) => (
									<option key={video.id} value={video.streamVideoId}>
										{video.title || video.streamVideoId}
									</option>
								))}
							</select>
							<p className="text-xs text-muted-foreground">
								{item.streamVideoId
									? `当前：${videoLabelByStreamId.get(item.streamVideoId) ?? item.streamVideoId}`
									: "未选择视频"}
							</p>
							{readFieldIssue(`contentJson.items[${index}].streamVideoId`) ? (
								<p className="text-xs text-destructive">
									{readFieldIssue(`contentJson.items[${index}].streamVideoId`)}
								</p>
							) : null}
						</div>
					</div>
				))}
			</div>
		);
	};

	const renderSectionEditor = () => {
		if (activeEntryKey === "home.main_video") {
			const content = resolvedFormState.content as MainVideoContent;
			return (
				<div className="space-y-4 border-t border-border/70 pt-4">
					<div className="space-y-2">
						<Label htmlFor="main-video-select">核心视频（仅 ready + published）</Label>
						<select
							id="main-video-select"
							value={content.streamVideoId}
							onChange={(event) =>
								setFormState({
									content: {
										...content,
										streamVideoId: event.target.value,
									},
								})
							}
							className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
						>
							<option value="">请选择视频</option>
							{readyPublishedVideos.map((video) => (
								<option key={video.id} value={video.streamVideoId}>
									{video.title || video.streamVideoId}
								</option>
							))}
						</select>
						<p className="text-xs text-muted-foreground">
							候选数量：{readyPublishedVideos.length}（来源：/admin/videos）
						</p>
						{readFieldIssue("contentJson.streamVideoId") ? (
							<p className="text-xs text-destructive">
								{readFieldIssue("contentJson.streamVideoId")}
							</p>
						) : null}
					</div>
					{readyPublishedVideos.length === 0 ? (
						<p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
							当前没有可选视频，请先在 /admin/videos 将视频处理为 ready 且发布。
						</p>
					) : null}
				</div>
			);
		}

		if (activeEntryKey === "home.character_videos") {
			return renderVideoListEditor(
				"home.character_videos",
				"角色视频列表",
				"候选数量：仅显示 ready + published，最多 12 条。",
			);
		}

		return renderVideoListEditor(
			"home.family_story_videos",
			"家庭故事列表",
			"候选数量：仅显示 ready + published。列表不设条数上限，且不允许重复视频。",
		);
	};

	const hasAnyHistory = (sectionsQuery.data?.length ?? 0) > 0;
	const isPending = saveDraftMutation.isPending || publishMutation.isPending;

	return (
		<div className="min-h-[100dvh] px-4 py-5 md:px-6 md:py-6">
			<div className="mx-auto w-full max-w-[1400px] space-y-4">
				<header className="rounded-3xl border border-border/70 bg-[color:rgba(255,252,247,0.86)] px-4 py-4 md:px-6 md:py-5">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="space-y-1">
							<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
								Illumi Family Admin
							</p>
							<h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
								CMS 配置
							</h1>
						</div>
						<div className="flex flex-wrap gap-2">
							<Badge variant="secondary">{SECTION_EDITOR_META[activeEntryKey].moduleName}</Badge>
							<Badge variant="outline">rev {selectedSection?.latestRevisionNo ?? "-"}</Badge>
							<Badge variant={hasUnsavedChanges ? "outline" : "secondary"}>
								{hasUnsavedChanges ? "未保存" : "已保存"}
							</Badge>
							{isPending ? <Badge variant="outline">处理中...</Badge> : null}
						</div>
					</div>
				</header>

				{sectionsQuery.isLoading ? (
					<section className="rounded-2xl border border-border/70 bg-background/75 p-4">
						<div className="animate-pulse space-y-2">
							<div className="h-4 w-48 rounded bg-muted" />
							<div className="h-24 rounded-xl bg-muted/70" />
						</div>
					</section>
				) : null}

				{sectionsQuery.isError ? (
					<section className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{readErrorMessage(sectionsQuery.error)}
					</section>
				) : null}

				<div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
					<aside className="self-start rounded-2xl border border-border/70 bg-background/75 p-3">
						<p className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
							<LayoutPanelLeft className="size-4" aria-hidden="true" />
							配置模块
						</p>
						<div className="space-y-2">
							{ENTRY_KEY_OPTIONS.map((option) => {
								const active = option.value === activeEntryKey;
								return (
									<button
										key={option.value}
										type="button"
										aria-current={active ? "page" : undefined}
										onClick={() => {
											setEntryKey(option.value);
											resetMessage();
										}}
										className={[
											"w-full rounded-xl border px-3 py-2 text-left transition-[transform,border-color,background-color] duration-200 active:scale-[0.98]",
											active
												? "border-[color:var(--brand-primary)] bg-[color:rgba(166,124,82,0.14)]"
												: "border-border/70 bg-background hover:border-[color:rgba(166,124,82,0.35)]",
										].join(" ")}
									>
										<p className="text-sm font-medium text-foreground">{option.label}</p>
										<p className="mt-1 text-xs text-muted-foreground">
											{SECTION_EDITOR_META[option.value].moduleName}
										</p>
									</button>
								);
							})}
						</div>
					</aside>

					<section className="rounded-2xl border border-border/70 bg-[color:rgba(255,252,247,0.78)] px-4 py-4 md:px-6">
						{!hasAnyHistory ? (
							<div className="mb-4 rounded-xl border border-dashed border-border/80 bg-background/70 p-3 text-sm text-muted-foreground">
								当前还没有历史版本，正在创建首个草稿。
							</div>
						) : null}

						{statusMessage ? (
							<p className="mb-3 flex items-center gap-2 text-sm text-emerald-700">
								<CheckCircle2 className="size-4" aria-hidden="true" />
								{statusMessage}
							</p>
						) : null}
						{errorMessage ? (
							<p className="mb-3 flex items-center gap-2 text-sm text-destructive" role="alert">
								<AlertTriangle className="size-4" aria-hidden="true" />
								{errorMessage}
							</p>
						) : null}
						{validationIssues.length > 0 ? (
							<ul className="mb-3 space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
								{validationIssues.map((issue, index) => (
									<li key={`${issue.field}-${index}`}>
										{issue.field}：{issue.message}
									</li>
								))}
							</ul>
						) : null}

						<div className="space-y-2">
							<Label htmlFor="title">模块标题</Label>
							<Input
								id="title"
								value={resolvedFormState.title}
								onChange={(event) => setFormState({ title: event.target.value })}
								placeholder={SECTION_EDITOR_META[activeEntryKey].titlePlaceholder}
							/>
						</div>

						{renderSectionEditor()}

						<div className="mt-6 flex flex-wrap gap-2 border-t border-border/70 pt-4">
							<Button
								type="button"
								onClick={handleSaveDraft}
								disabled={saveDraftMutation.isPending}
								className="gap-2 transition-transform active:scale-[0.98]"
							>
								<Save className="size-4" aria-hidden="true" />
								{saveDraftMutation.isPending ? "保存中..." : "保存草稿"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={handlePublish}
								disabled={publishMutation.isPending || saveDraftMutation.isPending}
								className="gap-2 transition-transform active:scale-[0.98]"
							>
								<SendHorizontal className="size-4" aria-hidden="true" />
								{publishMutation.isPending ? "发布中..." : "发布"}
							</Button>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
