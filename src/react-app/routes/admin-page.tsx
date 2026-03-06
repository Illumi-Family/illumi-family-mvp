import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	CheckCircle2,
	ImageUp,
	LayoutPanelLeft,
	RefreshCw,
	Save,
	SendHorizontal,
} from "lucide-react";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { MarkdownRenderer } from "@/components/common/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	type HomeSectionEntryKey,
	type UploadAdminAssetInput,
	publishAdminHomeSection,
	saveAdminHomeSectionDraft,
	uploadAdminAsset,
} from "@/lib/api";
import { getMarkdownPolicyIssues } from "@/lib/markdown-editor";
import {
	adminHomeSectionsQueryKey,
	adminHomeSectionsQueryOptions,
	homeContentQueryKey,
} from "@/lib/query-options";

const ENTRY_KEY_OPTIONS: Array<{ value: HomeSectionEntryKey; label: string }> = [
	{ value: "home.philosophy", label: "家风家学·理念" },
	{ value: "home.daily_notes", label: "践行感悟·日思" },
	{ value: "home.stories", label: "三代同堂·故事" },
	{ value: "home.colearning", label: "家庭共学·陪伴" },
];

const WORKFLOW_STEPS = [
	"选择内容分块",
	"编辑可见 Markdown",
	"上传并插入图片",
	"保存草稿",
	"发布并刷新 C 端缓存",
] as const;

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

const DEFAULT_CONTENT_JSON_BY_ENTRY: Record<HomeSectionEntryKey, Record<string, unknown>> = {
	"home.philosophy": {
		intro: "请在这里描述本节导语。",
		items: [
			{
				title: "示例条目",
				description: "请编辑结构化字段内容。",
			},
		],
	},
	"home.daily_notes": {
		items: [
			{
				date: "2026-03-06",
				title: "示例日思",
				summary: "记录今天的实践反思。",
				tags: ["示例"],
			},
		],
	},
	"home.stories": {
		items: [
			{
				title: "示例故事",
				summary: "描述故事亮点。",
				publishDate: "2026-03-06",
				duration: "2m",
				status: "coming_soon",
			},
		],
	},
	"home.colearning": {
		intro: "请在这里描述共学理念。",
		methods: [
			{
				title: "方法示例",
				description: "描述方法细节。",
			},
		],
		benefits: ["收益示例"],
		caseHighlight: {
			title: "案例标题",
			summary: "案例摘要",
			cta: {
				label: "查看更多",
				href: "#about",
			},
		},
	},
};

const prettyJson = (value: unknown) => JSON.stringify(value ?? {}, null, 2);

type DraftFormState = {
	title: string;
	summaryMd: string;
	bodyMd: string;
	contentJsonText: string;
};

type UploadedAssetInfo = {
	assetId: string;
	assetUrl: string;
	markdownSnippet: string;
};

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

const parseContentJson = (text: string) => {
	try {
		return {
			data: JSON.parse(text) as Record<string, unknown>,
			error: null,
		};
	} catch {
		return {
			data: null,
			error: "contentJson 不是合法 JSON，预览已禁用。",
		};
	}
};

function SectionContentPreview({
	entryKey,
	content,
}: {
	entryKey: HomeSectionEntryKey;
	content: Record<string, unknown> | null;
}) {
	if (!content) {
		return (
			<p className="text-sm text-muted-foreground">
				当前内容无法预览，请先修复 JSON。
			</p>
		);
	}

	if (entryKey === "home.philosophy") {
		const intro = typeof content.intro === "string" ? content.intro : "";
		const items = Array.isArray(content.items)
			? (content.items as Array<{ title?: string; description?: string }>)
			: [];
		return (
			<div className="space-y-3">
				<MarkdownRenderer content={intro} />
				{items.map((item, index) => (
					<div
						key={`${index}-${item.title ?? "item"}`}
						className="rounded-xl border border-border/70 p-3"
					>
						<p className="font-medium text-foreground">{item.title ?? "未命名条目"}</p>
						<MarkdownRenderer content={item.description ?? ""} className="mt-2" />
					</div>
				))}
			</div>
		);
	}

	if (entryKey === "home.daily_notes") {
		const items = Array.isArray(content.items)
			? (content.items as Array<{
					date?: string;
					title?: string;
					summary?: string;
					tags?: string[];
			  }>)
			: [];
		return (
			<div className="space-y-3">
				{items.map((item, index) => (
					<div
						key={`${index}-${item.title ?? "daily"}`}
						className="rounded-xl border border-border/70 p-3"
					>
						<p className="text-xs uppercase tracking-[0.12em] text-[color:var(--brand-primary)]">
							{item.date ?? "-"}
						</p>
						<p className="mt-1 font-medium text-foreground">{item.title ?? "未命名日思"}</p>
						<MarkdownRenderer content={item.summary ?? ""} className="mt-2" />
						<div className="mt-2 flex flex-wrap gap-1">
							{(item.tags ?? []).map((tag) => (
								<Badge key={tag} variant="outline" className="rounded-full text-xs">
									{tag}
								</Badge>
							))}
						</div>
					</div>
				))}
			</div>
		);
	}

	if (entryKey === "home.stories") {
		const items = Array.isArray(content.items)
			? (content.items as Array<{
					title?: string;
					summary?: string;
					publishDate?: string;
					duration?: string;
					status?: string;
					link?: string;
			  }>)
			: [];
		return (
			<div className="space-y-3">
				{items.map((item, index) => (
					<div
						key={`${index}-${item.title ?? "story"}`}
						className="rounded-xl border border-border/70 p-3"
					>
						<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
							<span>{item.publishDate ?? "-"}</span>
							<Badge variant="secondary">{item.status ?? "unknown"}</Badge>
						</div>
						<p className="mt-2 font-medium text-foreground">{item.title ?? "未命名故事"}</p>
						<MarkdownRenderer content={item.summary ?? ""} className="mt-2" />
						<p className="mt-2 text-xs text-muted-foreground">时长/进度：{item.duration ?? "-"}</p>
						{item.link ? (
							<p className="mt-1 text-xs text-[color:var(--brand-primary)]">{item.link}</p>
						) : null}
					</div>
				))}
			</div>
		);
	}

	const intro = typeof content.intro === "string" ? content.intro : "";
	const methods = Array.isArray(content.methods)
		? (content.methods as Array<{ title?: string; description?: string }>)
		: [];
	const benefits = Array.isArray(content.benefits)
		? (content.benefits as string[])
		: [];
	const caseHighlight =
		typeof content.caseHighlight === "object" && content.caseHighlight
			? (content.caseHighlight as {
					title?: string;
					summary?: string;
					cta?: { label?: string; href?: string };
			  })
			: null;

	return (
		<div className="space-y-3">
			<MarkdownRenderer content={intro} />
			{methods.map((method, index) => (
				<div
					key={`${index}-${method.title ?? "method"}`}
					className="rounded-xl border border-border/70 p-3"
				>
					<p className="font-medium text-foreground">{method.title ?? "未命名方法"}</p>
					<MarkdownRenderer content={method.description ?? ""} className="mt-2" />
				</div>
			))}
			{benefits.length > 0 ? (
				<ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
					{benefits.map((benefit) => (
						<li key={benefit}>
							<MarkdownRenderer content={benefit} className="space-y-0" />
						</li>
					))}
				</ul>
			) : null}
			{caseHighlight ? (
				<div className="rounded-xl border border-border/70 p-3">
					<p className="font-medium text-foreground">{caseHighlight.title ?? "案例"}</p>
					<MarkdownRenderer content={caseHighlight.summary ?? ""} className="mt-2" />
					<p className="mt-2 text-xs text-[color:var(--brand-primary)]">
						{caseHighlight.cta?.label ?? ""} {caseHighlight.cta?.href ?? ""}
					</p>
				</div>
			) : null}
		</div>
	);
}

export function AdminPage() {
	const queryClient = useQueryClient();
	const sectionsQuery = useQuery(adminHomeSectionsQueryOptions());
	const [entryKey, setEntryKey] = useState<HomeSectionEntryKey>("home.philosophy");
	const [draftByEntry, setDraftByEntry] = useState<
		Partial<Record<HomeSectionEntryKey, DraftFormState>>
	>({});
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadedAsset, setUploadedAsset] = useState<UploadedAssetInfo | null>(null);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showContentJson, setShowContentJson] = useState(false);

	const activeEntryKey = useMemo(() => {
		const hasSelected = sectionsQuery.data?.some((item) => item.entryKey === entryKey);
		if (hasSelected || !sectionsQuery.data?.length) return entryKey;
		return sectionsQuery.data[0]?.entryKey ?? entryKey;
	}, [sectionsQuery.data, entryKey]);

	const sectionMap = useMemo(
		() =>
			new Map(
				(sectionsQuery.data ?? []).map((section) => [
					section.entryKey,
					section,
				]),
			),
		[sectionsQuery.data],
	);

	const selectedSection = useMemo(
		() => sectionMap.get(activeEntryKey),
		[sectionMap, activeEntryKey],
	);

	const resolvedFormState = useMemo<DraftFormState>(() => {
		const existingDraft = draftByEntry[activeEntryKey];
		if (existingDraft) return existingDraft;
		return {
			title: selectedSection?.latestTitle ?? "",
			summaryMd: selectedSection?.latestSummaryMd ?? "",
			bodyMd: selectedSection?.latestBodyMd ?? "",
			contentJsonText: prettyJson(
				selectedSection?.latestContentJson ??
					DEFAULT_CONTENT_JSON_BY_ENTRY[activeEntryKey],
			),
		};
	}, [draftByEntry, activeEntryKey, selectedSection]);

	const contentJsonPreview = useMemo(
		() => parseContentJson(resolvedFormState.contentJsonText),
		[resolvedFormState.contentJsonText],
	);

	const summaryPolicyIssues = useMemo(
		() => getMarkdownPolicyIssues(resolvedFormState.summaryMd),
		[resolvedFormState.summaryMd],
	);
	const bodyPolicyIssues = useMemo(
		() => getMarkdownPolicyIssues(resolvedFormState.bodyMd),
		[resolvedFormState.bodyMd],
	);

	const setFormState = (partial: Partial<DraftFormState>) => {
		setDraftByEntry((prev) => ({
			...prev,
			[activeEntryKey]: {
				...resolvedFormState,
				...partial,
			},
		}));
	};

	const resetMessage = () => {
		setStatusMessage(null);
		setErrorMessage(null);
	};

	const saveDraftMutation = useMutation({
		mutationFn: saveAdminHomeSectionDraft,
		onSuccess: async () => {
			setStatusMessage("草稿保存成功，可继续迭代后再发布。");
			setErrorMessage(null);
			await queryClient.invalidateQueries({
				queryKey: adminHomeSectionsQueryKey,
			});
		},
		onError: (error) => {
			setStatusMessage(null);
			setErrorMessage(readErrorMessage(error));
		},
	});

	const publishMutation = useMutation({
		mutationFn: publishAdminHomeSection,
		onSuccess: async () => {
			setStatusMessage("发布成功，C 端将读取最新已发布内容。");
			setErrorMessage(null);
			await queryClient.invalidateQueries({
				queryKey: adminHomeSectionsQueryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: homeContentQueryKey,
			});
		},
		onError: (error) => {
			setStatusMessage(null);
			setErrorMessage(readErrorMessage(error));
		},
	});

	const uploadAssetMutation = useMutation({
		mutationFn: (payload: UploadAdminAssetInput) => uploadAdminAsset(payload),
		onSuccess: (asset) => {
			const assetUrl = `/api/content/assets/${asset.id}`;
			const markdownSnippet = `![${asset.fileName}](${assetUrl})`;
			setUploadedAsset({
				assetId: asset.id,
				assetUrl,
				markdownSnippet,
			});
			setStatusMessage("图片上传成功，可插入正文并即时预览。");
			setErrorMessage(null);
		},
		onError: (error) => {
			setStatusMessage(null);
			setErrorMessage(readErrorMessage(error));
		},
	});

	const handleSaveDraft = () => {
		resetMessage();

		let contentJson: Record<string, unknown>;
		try {
			contentJson = JSON.parse(resolvedFormState.contentJsonText) as Record<
				string,
				unknown
			>;
		} catch {
			setErrorMessage("contentJson 必须是合法 JSON。请修复后再保存。");
			return;
		}

		if (summaryPolicyIssues.length > 0 || bodyPolicyIssues.length > 0) {
			const issueTexts: string[] = [];
			if (summaryPolicyIssues.length > 0) {
				issueTexts.push(`摘要：${summaryPolicyIssues.join("、")}`);
			}
			if (bodyPolicyIssues.length > 0) {
				issueTexts.push(`正文：${bodyPolicyIssues.join("、")}`);
			}
			setErrorMessage(
				`Markdown 包含当前白名单外语法，保存已阻止。${issueTexts.join("；")}`,
			);
			return;
		}

		saveDraftMutation.mutate({
			entryKey: activeEntryKey,
			title: resolvedFormState.title,
			summaryMd: resolvedFormState.summaryMd || undefined,
			bodyMd: resolvedFormState.bodyMd || undefined,
			contentJson,
		});
	};

	const handlePublish = () => {
		resetMessage();
		const revision = selectedSection?.latestRevisionNo ?? "-";
		const shouldPublish = window.confirm(
			`即将发布分块 ${activeEntryKey}（版本 ${revision}）。\n影响范围：C 端首页对应模块会立即读取新内容。`,
		);
		if (!shouldPublish) return;

		publishMutation.mutate({
			entryKey: activeEntryKey,
			revisionId: selectedSection?.latestRevisionId ?? undefined,
		});
	};

	const handleUploadImage = async () => {
		resetMessage();
		if (!selectedFile) {
			setErrorMessage("请先选择一张图片。");
			return;
		}

		const fileBuffer = await selectedFile.arrayBuffer();
		const payload: UploadAdminAssetInput = {
			fileName: selectedFile.name,
			contentType: selectedFile.type || "application/octet-stream",
			dataBase64: toBase64(fileBuffer),
		};
		uploadAssetMutation.mutate(payload);
	};

	const appendSnippetToBody = () => {
		if (!uploadedAsset) return;
		const nextBody = resolvedFormState.bodyMd
			? `${resolvedFormState.bodyMd}\n\n${uploadedAsset.markdownSnippet}`
			: uploadedAsset.markdownSnippet;
		setFormState({ bodyMd: nextBody });
		setStatusMessage("图片 Markdown 已追加到正文。可继续微调位置。");
	};

	const hasAnyHistory = (sectionsQuery.data?.length ?? 0) > 0;
	const isBusy =
		saveDraftMutation.isPending ||
		publishMutation.isPending ||
		uploadAssetMutation.isPending;

	return (
		<div className="min-h-[100dvh] px-4 py-4 md:px-6 md:py-6">
			<div className="mx-auto w-full max-w-[1440px] space-y-4">
				<header className="rounded-2xl border border-border/70 bg-[color:rgba(255,252,247,0.8)] px-4 py-4 md:px-6">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="space-y-1">
							<p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
								Illumi Family Admin CMS
							</p>
							<h1 className="text-2xl font-semibold text-foreground">内容编辑工作台</h1>
							<p className="text-sm text-muted-foreground">
								左侧管理分块，中间编辑，右侧预览与发布。
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Badge variant="secondary">状态：{selectedSection?.status ?? "draft"}</Badge>
							<Badge variant="outline">
								版本：{selectedSection?.latestRevisionNo ?? "新建"}
							</Badge>
							{isBusy ? <Badge variant="outline">处理中...</Badge> : null}
						</div>
					</div>
				</header>

				{sectionsQuery.isLoading ? (
					<section className="rounded-2xl border border-border/70 bg-background/75 px-4 py-3 text-sm text-muted-foreground">
						<div className="flex items-center gap-2">
							<RefreshCw className="size-4 animate-spin" aria-hidden="true" />
							<span>正在加载 Admin 内容分块...</span>
						</div>
					</section>
				) : null}

				{sectionsQuery.isError ? (
					<section className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<p>{readErrorMessage(sectionsQuery.error)}</p>
							<Button
								type="button"
								variant="outline"
								onClick={() => sectionsQuery.refetch()}
							>
								重试加载
							</Button>
						</div>
					</section>
				) : null}

				<div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_360px]">
					<aside className="space-y-4 xl:sticky xl:top-4 self-start">
						<section className="rounded-2xl border border-border/70 bg-background/75 p-3">
							<p className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
								<LayoutPanelLeft className="size-4" aria-hidden="true" />
								内容分块
							</p>
							<div className="space-y-2">
								{ENTRY_KEY_OPTIONS.map((option) => {
									const item = sectionMap.get(option.value);
									const active = option.value === activeEntryKey;
									return (
										<button
											key={option.value}
											type="button"
											onClick={() => {
												setEntryKey(option.value);
												setUploadedAsset(null);
												resetMessage();
											}}
											className={[
												"w-full rounded-xl border px-3 py-2 text-left transition-all active:scale-[0.98]",
												active
													? "border-[color:var(--brand-primary)] bg-[color:rgba(166,124,82,0.14)]"
													: "border-border/70 bg-background hover:border-[color:rgba(166,124,82,0.35)]",
											].join(" ")}
										>
											<p className="text-sm font-medium text-foreground">{option.label}</p>
											<p className="mt-1 text-xs text-muted-foreground">
												{item?.status ?? "尚未保存"} · rev {item?.latestRevisionNo ?? "-"}
											</p>
										</button>
									);
								})}
							</div>
						</section>

						<section className="rounded-2xl border border-border/70 bg-background/70 p-3">
							<p className="mb-2 text-sm font-medium text-foreground">编辑流程</p>
							<ul className="space-y-2 text-xs text-muted-foreground">
								{WORKFLOW_STEPS.map((step, index) => (
									<li key={step} className="flex gap-2 rounded-md border border-border/60 px-2 py-1">
										<span className="text-[color:var(--brand-primary)]">{index + 1}.</span>
										<span>{step}</span>
									</li>
								))}
							</ul>
						</section>
					</aside>

					<section className="rounded-2xl border border-border/70 bg-[color:rgba(255,252,247,0.75)] px-4 py-4 md:px-6">
						{!hasAnyHistory ? (
							<div className="mb-4 rounded-xl border border-dashed border-border/80 bg-background/70 p-3 text-sm text-muted-foreground">
								当前还没有历史版本，正在编辑 {activeEntryKey} 的首个草稿。
							</div>
						) : null}

						<div className="space-y-2">
							<Label htmlFor="title">标题</Label>
							<Input
								id="title"
								value={resolvedFormState.title}
								onChange={(event) => setFormState({ title: event.target.value })}
								placeholder="请输入标题"
							/>
						</div>

						<MarkdownEditor
							id="summary-md"
							label="摘要 Markdown"
							value={resolvedFormState.summaryMd}
							onChange={(value) => setFormState({ summaryMd: value })}
							rows={6}
							placeholder="输入摘要内容..."
							description="支持：标题、加粗、列表、链接、图片。"
							emptyPreviewLabel="摘要为空"
						/>
						{summaryPolicyIssues.length > 0 ? (
							<p className="mt-2 text-xs text-destructive" role="alert">
								摘要存在白名单外语法：{summaryPolicyIssues.join("、")}
							</p>
						) : null}

						<MarkdownEditor
							id="body-md"
							label="正文 Markdown"
							value={resolvedFormState.bodyMd}
							onChange={(value) => setFormState({ bodyMd: value })}
							rows={10}
							placeholder="输入正文内容..."
							description="可在上传图片后一键插入 `![alt](url)`。"
							emptyPreviewLabel="正文为空"
						/>
						{bodyPolicyIssues.length > 0 ? (
							<p className="mt-2 text-xs text-destructive" role="alert">
								正文存在白名单外语法：{bodyPolicyIssues.join("、")}
							</p>
						) : null}

						<section className="mt-4 rounded-2xl border border-border/70 bg-background/75 p-3">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="text-sm font-medium text-foreground">图片上传与嵌入</p>
								<p className="text-xs text-muted-foreground">
									上传成功后两步完成插入：上传 -&gt; 插入正文
								</p>
							</div>
							<div className="mt-3 grid gap-3">
								<Input
									type="file"
									accept="image/*"
									onChange={(event) => {
										setSelectedFile(event.target.files?.[0] ?? null);
										resetMessage();
									}}
								/>
								<div className="flex flex-wrap gap-2">
									<Button
										type="button"
										variant="outline"
										onClick={handleUploadImage}
										disabled={uploadAssetMutation.isPending || !selectedFile}
										className="gap-2 transition-transform active:scale-[0.98]"
									>
										<ImageUp className="size-4" aria-hidden="true" />
										{uploadAssetMutation.isPending
											? "上传中..."
											: uploadAssetMutation.isError
												? "重试上传"
												: "上传图片"}
									</Button>
									<Button
										type="button"
										onClick={appendSnippetToBody}
										disabled={!uploadedAsset}
										className="transition-transform active:scale-[0.98]"
									>
										插入正文
									</Button>
								</div>
								{uploadedAsset ? (
									<div className="rounded-lg border border-border/70 bg-background p-2 text-xs">
										<p>
											asset: <code>{uploadedAsset.assetId}</code>
										</p>
										<p>
											url: <code>{uploadedAsset.assetUrl}</code>
										</p>
										<p>
											markdown: <code>{uploadedAsset.markdownSnippet}</code>
										</p>
									</div>
								) : null}
							</div>
						</section>

						<section className="mt-4 border-t border-border/70 pt-4">
							<button
								type="button"
								onClick={() => setShowContentJson((prev) => !prev)}
								className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
							>
								{showContentJson ? "收起" : "展开"}结构化 JSON（contentJson）
							</button>
							{showContentJson ? (
								<div className="mt-3 space-y-2">
									<Textarea
										id="contentJson"
										value={resolvedFormState.contentJsonText}
										onChange={(event) =>
											setFormState({ contentJsonText: event.target.value })
										}
										rows={14}
										className="font-mono text-xs"
									/>
									{contentJsonPreview.error ? (
										<p className="text-xs text-destructive">{contentJsonPreview.error}</p>
									) : null}
								</div>
							) : null}
						</section>
					</section>

					<aside className="space-y-4 xl:sticky xl:top-4 self-start">
						<section className="rounded-2xl border border-border/70 bg-background/75 p-4">
							<p className="text-sm font-medium text-foreground">发布控制区</p>
							<p className="mt-2 text-xs text-muted-foreground">
								发布前会确认影响范围和当前版本，草稿与发布保持分离。
							</p>
							<div className="mt-3 space-y-2 text-xs text-muted-foreground">
								<p>entryKey: {activeEntryKey}</p>
								<p>latest revision: {selectedSection?.latestRevisionNo ?? "新建"}</p>
								<p>published revision: {selectedSection?.publishedRevisionId ?? "尚未发布"}</p>
							</div>
							<div className="mt-4 flex flex-wrap gap-2">
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
									disabled={publishMutation.isPending}
									className="gap-2 transition-transform active:scale-[0.98]"
								>
									<SendHorizontal className="size-4" aria-hidden="true" />
									{publishMutation.isPending ? "发布中..." : "发布"}
								</Button>
							</div>
						</section>

						<section
							className="rounded-2xl border border-border/70 bg-background/75 p-4"
							aria-live="polite"
						>
							<p className="text-sm font-medium text-foreground">操作反馈</p>
							{statusMessage ? (
								<p className="mt-2 flex items-start gap-2 text-sm text-emerald-700">
									<CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
									<span>{statusMessage}</span>
								</p>
							) : (
								<p className="mt-2 text-sm text-muted-foreground">暂无新反馈。</p>
							)}
							{errorMessage ? (
								<p
									className="mt-2 flex items-start gap-2 text-sm text-destructive"
									role="alert"
									aria-live="assertive"
								>
									<AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
									<span>{errorMessage}</span>
								</p>
							) : null}
						</section>

						<section className="rounded-2xl border border-border/70 bg-background/75 p-4">
							<p className="text-sm font-medium text-foreground">Markdown 汇总预览</p>
							<div className="mt-3 space-y-3">
								<div>
									<p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
										summary.md
									</p>
									<MarkdownRenderer
										content={resolvedFormState.summaryMd}
										emptyFallback={
											<p className="text-sm text-muted-foreground">摘要为空</p>
										}
									/>
								</div>
								<div>
									<p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
										body.md
									</p>
									<MarkdownRenderer
										content={resolvedFormState.bodyMd}
										emptyFallback={
											<p className="text-sm text-muted-foreground">正文为空</p>
										}
									/>
								</div>
							</div>
						</section>

						<section className="rounded-2xl border border-border/70 bg-background/75 p-4">
							<p className="text-sm font-medium text-foreground">
								C 端即时预览（{activeEntryKey}）
							</p>
							<div className="mt-3">
								<SectionContentPreview
									entryKey={activeEntryKey}
									content={contentJsonPreview.data}
								/>
							</div>
						</section>
					</aside>
				</div>
			</div>
		</div>
	);
}
