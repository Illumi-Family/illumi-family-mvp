import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MarkdownRenderer } from "@/components/common/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	"1. 选择内容分块",
	"2. 编辑 Markdown 与结构化 JSON",
	"3. 上传图片并插入 markdown 片段",
	"4. 保存草稿",
	"5. 发布到 C 端",
] as const;

const readErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : "Unexpected error";

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
					<div key={`${index}-${item.title ?? "item"}`} className="rounded-xl border border-border p-3">
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
					<div key={`${index}-${item.title ?? "daily"}`} className="rounded-xl border border-border p-3">
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
					<div key={`${index}-${item.title ?? "story"}`} className="rounded-xl border border-border p-3">
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
				<div key={`${index}-${method.title ?? "method"}`} className="rounded-xl border border-border p-3">
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
				<div className="rounded-xl border border-border p-3">
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

	const activeEntryKey = useMemo(() => {
		const hasSelected = sectionsQuery.data?.some((item) => item.entryKey === entryKey);
		if (hasSelected) return entryKey;
		return sectionsQuery.data?.[0]?.entryKey ?? entryKey;
	}, [sectionsQuery.data, entryKey]);

	const selectedSection = useMemo(
		() => sectionsQuery.data?.find((item) => item.entryKey === activeEntryKey),
		[sectionsQuery.data, activeEntryKey],
	);

	const resolvedFormState = useMemo<DraftFormState>(() => {
		const existingDraft = draftByEntry[activeEntryKey];
		if (existingDraft) return existingDraft;
		return {
			title: selectedSection?.latestTitle ?? "",
			summaryMd: selectedSection?.latestSummaryMd ?? "",
			bodyMd: selectedSection?.latestBodyMd ?? "",
			contentJsonText: prettyJson(selectedSection?.latestContentJson),
		};
	}, [draftByEntry, activeEntryKey, selectedSection]);

	const contentJsonPreview = useMemo(
		() => parseContentJson(resolvedFormState.contentJsonText),
		[resolvedFormState.contentJsonText],
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
			setStatusMessage("草稿保存成功。可继续迭代后再发布。");
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
			setStatusMessage("图片上传成功，可插入 markdown 或放入 contentJson。\n");
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
			setErrorMessage("contentJson 必须是合法 JSON。请修复后再保存。\n");
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
		publishMutation.mutate({
			entryKey: activeEntryKey,
			revisionId: selectedSection?.latestRevisionId ?? undefined,
		});
	};

	const handleUploadImage = async () => {
		resetMessage();
		if (!selectedFile) {
			setErrorMessage("请先选择一张图片。\n");
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
		setStatusMessage("图片 markdown 已追加到正文。\n");
	};

	return (
		<div className="mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6">
			<Card>
				<CardHeader>
					<CardTitle>Admin CMS 编辑流程</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-5">
						{WORKFLOW_STEPS.map((step) => (
							<div key={step} className="rounded-lg border border-border bg-card px-3 py-2">
								{step}
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
				<Card>
					<CardHeader>
						<CardTitle>编辑区</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="entryKey">内容分块</Label>
								<select
									id="entryKey"
									value={activeEntryKey}
									onChange={(event) => {
										setEntryKey(event.target.value as HomeSectionEntryKey);
										setUploadedAsset(null);
										resetMessage();
									}}
									className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
								>
									{ENTRY_KEY_OPTIONS.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div className="flex items-end gap-2">
								<Badge variant="secondary">状态：{selectedSection?.status ?? "-"}</Badge>
								<Badge variant="outline">
									最新版本：{selectedSection?.latestRevisionNo ?? "-"}
								</Badge>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="title">标题</Label>
							<Input
								id="title"
								value={resolvedFormState.title}
								onChange={(event) => setFormState({ title: event.target.value })}
								placeholder="请输入标题"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="summaryMd">摘要 Markdown</Label>
							<Textarea
								id="summaryMd"
								value={resolvedFormState.summaryMd}
								onChange={(event) =>
									setFormState({ summaryMd: event.target.value })
								}
								rows={4}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="bodyMd">正文 Markdown</Label>
							<Textarea
								id="bodyMd"
								value={resolvedFormState.bodyMd}
								onChange={(event) => setFormState({ bodyMd: event.target.value })}
								rows={8}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="contentJson">结构化 JSON（contentJson）</Label>
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

						<div className="space-y-2 rounded-xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.72)] p-3">
							<p className="text-sm font-medium text-foreground">图片上传</p>
							<p className="text-xs text-muted-foreground">
								上传后可生成 markdown 图片语法，例如 <code>![封面](/api/content/assets/xxx)</code>
							</p>
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
									disabled={uploadAssetMutation.isPending}
								>
									{uploadAssetMutation.isPending ? "上传中..." : "上传图片"}
								</Button>
								<Button
									type="button"
									onClick={appendSnippetToBody}
									disabled={!uploadedAsset}
								>
									插入到正文
								</Button>
							</div>
							{uploadedAsset ? (
								<div className="rounded-lg border border-border bg-background p-2 text-xs">
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

						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								onClick={handleSaveDraft}
								disabled={saveDraftMutation.isPending}
							>
								{saveDraftMutation.isPending ? "保存中..." : "保存草稿"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={handlePublish}
								disabled={publishMutation.isPending}
							>
								{publishMutation.isPending ? "发布中..." : "发布"}
							</Button>
						</div>

						{statusMessage ? (
							<p className="text-sm text-emerald-700">{statusMessage}</p>
						) : null}
						{errorMessage ? (
							<p className="text-sm text-destructive">{errorMessage}</p>
						) : null}
						{sectionsQuery.isError ? (
							<p className="text-sm text-destructive">
								{readErrorMessage(sectionsQuery.error)}
							</p>
						) : null}
					</CardContent>
				</Card>

				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Markdown 预览</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
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
								<p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
									body.md
								</p>
								<MarkdownRenderer
									content={resolvedFormState.bodyMd}
									emptyFallback={
										<p className="text-sm text-muted-foreground">正文为空</p>
									}
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>C 端即时预览（{activeEntryKey}）</CardTitle>
						</CardHeader>
						<CardContent>
							<SectionContentPreview
								entryKey={activeEntryKey}
								content={contentJsonPreview.data}
							/>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
