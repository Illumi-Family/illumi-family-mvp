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
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppLocale } from "@/i18n/types";
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
	homeContentQueryKeyPrefix,
} from "@/lib/query-options";

const ENTRY_KEY_OPTIONS: Array<{ value: HomeSectionEntryKey; label: string }> = [
	{ value: "home.philosophy", label: "家风家学·理念" },
	{ value: "home.daily_notes", label: "践行感悟·日思" },
	{ value: "home.stories", label: "三代同堂·故事" },
	{ value: "home.colearning", label: "家庭共学·陪伴" },
];

const LOCALE_OPTIONS: Array<{ value: AppLocale; label: string }> = [
	{ value: "zh-CN", label: "ZH" },
	{ value: "en-US", label: "EN" },
];

type PhilosophyContent = {
	intro: string;
	items: Array<{ title: string; description: string }>;
};

type DailyNotesContent = {
	items: Array<{ date: string; title: string; summary: string; tags: string[] }>;
};

type StoriesContent = {
	items: Array<{
		title: string;
		summary: string;
		publishDate: string;
		duration: string;
		status: "published" | "coming_soon";
		link?: string;
	}>;
};

type ColearningContent = {
	intro: string;
	methods: Array<{ title: string; description: string }>;
	benefits: string[];
	caseHighlight: {
		title: string;
		summary: string;
		cta: { label: string; href: string };
	};
};

type SectionContentByEntry = {
	"home.philosophy": PhilosophyContent;
	"home.daily_notes": DailyNotesContent;
	"home.stories": StoriesContent;
	"home.colearning": ColearningContent;
};

const DEFAULT_CONTENT_BY_ENTRY: SectionContentByEntry = {
	"home.philosophy": {
		intro: "请在这里描述本节导语。",
		items: [{ title: "示例条目", description: "请编辑结构化字段内容。" }],
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
				link: "",
			},
		],
	},
	"home.colearning": {
		intro: "请在这里描述共学理念。",
		methods: [{ title: "方法示例", description: "描述方法细节。" }],
		benefits: ["收益示例"],
		caseHighlight: {
			title: "案例标题",
			summary: "案例摘要",
			cta: { label: "查看更多", href: "#about" },
		},
	},
};

const SECTION_EDITOR_META: Record<
	HomeSectionEntryKey,
	{ moduleName: string; titlePlaceholder: string }
> = {
	"home.philosophy": {
		moduleName: "理念模块",
		titlePlaceholder: "例如：家的秩序与温度",
	},
	"home.daily_notes": {
		moduleName: "日思模块",
		titlePlaceholder: "例如：今天的陪伴小结",
	},
	"home.stories": {
		moduleName: "故事模块",
		titlePlaceholder: "例如：周末共读时刻",
	},
	"home.colearning": {
		moduleName: "共学模块",
		titlePlaceholder: "例如：亲子共学方法",
	},
};

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

	if (entryKey === "home.philosophy") {
		const items = Array.isArray(raw.items)
			? raw.items.map((item) => {
				const row = (item ?? {}) as Record<string, unknown>;
				return {
					title: ensureString(row.title, ""),
					description: ensureString(row.description, ""),
				};
			})
			: [];
		return {
			intro: ensureString(raw.intro, ""),
			items: items.length > 0 ? items : DEFAULT_CONTENT_BY_ENTRY["home.philosophy"].items,
		} as SectionContentByEntry[K];
	}

	if (entryKey === "home.daily_notes") {
		const items = Array.isArray(raw.items)
			? raw.items.map((item) => {
				const row = (item ?? {}) as Record<string, unknown>;
				const tags = Array.isArray(row.tags)
					? row.tags.map((tag) => ensureString(tag)).filter(Boolean)
					: [];
				return {
					date: ensureString(row.date, ""),
					title: ensureString(row.title, ""),
					summary: ensureString(row.summary, ""),
					tags,
				};
			})
			: [];
		return {
			items: items.length > 0 ? items : DEFAULT_CONTENT_BY_ENTRY["home.daily_notes"].items,
		} as SectionContentByEntry[K];
	}

	if (entryKey === "home.stories") {
		const items = Array.isArray(raw.items)
			? raw.items.map((item) => {
				const row = (item ?? {}) as Record<string, unknown>;
				const status =
					row.status === "published" || row.status === "coming_soon"
						? row.status
						: "coming_soon";
				return {
					title: ensureString(row.title, ""),
					summary: ensureString(row.summary, ""),
					publishDate: ensureString(row.publishDate, ""),
					duration: ensureString(row.duration, ""),
					status,
					link: ensureString(row.link, ""),
				};
			})
			: [];
		return {
			items: items.length > 0 ? items : DEFAULT_CONTENT_BY_ENTRY["home.stories"].items,
		} as SectionContentByEntry[K];
	}

	const methods = Array.isArray(raw.methods)
		? raw.methods.map((item) => {
				const row = (item ?? {}) as Record<string, unknown>;
				return {
					title: ensureString(row.title, ""),
					description: ensureString(row.description, ""),
				};
		  })
		: [];
	const benefits = Array.isArray(raw.benefits)
		? raw.benefits.map((item) => ensureString(item)).filter(Boolean)
		: [];
	const caseHighlightRaw = (raw.caseHighlight ?? {}) as Record<string, unknown>;
	const ctaRaw = (caseHighlightRaw.cta ?? {}) as Record<string, unknown>;
	return {
		intro: ensureString(raw.intro, ""),
		methods:
			methods.length > 0 ? methods : DEFAULT_CONTENT_BY_ENTRY["home.colearning"].methods,
		benefits:
			benefits.length > 0 ? benefits : DEFAULT_CONTENT_BY_ENTRY["home.colearning"].benefits,
		caseHighlight: {
			title: ensureString(
				caseHighlightRaw.title,
				DEFAULT_CONTENT_BY_ENTRY["home.colearning"].caseHighlight.title,
			),
			summary: ensureString(
				caseHighlightRaw.summary,
				DEFAULT_CONTENT_BY_ENTRY["home.colearning"].caseHighlight.summary,
			),
			cta: {
				label: ensureString(
					ctaRaw.label,
					DEFAULT_CONTENT_BY_ENTRY["home.colearning"].caseHighlight.cta.label,
				),
				href: ensureString(
					ctaRaw.href,
					DEFAULT_CONTENT_BY_ENTRY["home.colearning"].caseHighlight.cta.href,
				),
			},
		},
	} as SectionContentByEntry[K];
};

type DraftFormState = {
	title: string;
	summaryMd: string;
	bodyMd: string;
	content: SectionContentByEntry[HomeSectionEntryKey];
};

const buildDraftKey = (locale: AppLocale, entryKey: HomeSectionEntryKey) =>
	`${locale}:${entryKey}`;

export function AdminPage() {
	const queryClient = useQueryClient();
	const [locale, setLocale] = useState<AppLocale>("zh-CN");
	const sectionsQuery = useQuery(adminHomeSectionsQueryOptions(locale));
	const [entryKey, setEntryKey] = useState<HomeSectionEntryKey>("home.philosophy");
	const [draftByEntry, setDraftByEntry] = useState<Record<string, DraftFormState>>({});
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const activeEntryKey = useMemo(() => {
		const hasSelected = sectionsQuery.data?.some((item) => item.entryKey === entryKey);
		if (hasSelected || !sectionsQuery.data?.length) return entryKey;
		return sectionsQuery.data[0]?.entryKey ?? entryKey;
	}, [sectionsQuery.data, entryKey]);

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
			title: selectedSection?.latestTitle ?? "",
			summaryMd: selectedSection?.latestSummaryMd ?? "",
			bodyMd: selectedSection?.latestBodyMd ?? "",
			content: normalizeContentForEntry(activeEntryKey, selectedSection?.latestContentJson),
		}),
		[selectedSection, activeEntryKey],
	);

	const resolvedFormState = useMemo<DraftFormState>(() => {
		const existingDraft = draftByEntry[buildDraftKey(locale, activeEntryKey)];
		if (existingDraft) return existingDraft;
		return baselineFormState;
	}, [draftByEntry, locale, activeEntryKey, baselineFormState]);

	const hasUnsavedChanges = useMemo(
		() =>
			resolvedFormState.title !== baselineFormState.title ||
			JSON.stringify(resolvedFormState.content) !==
				JSON.stringify(baselineFormState.content),
		[resolvedFormState, baselineFormState],
	);

	const setFormState = (partial: Partial<DraftFormState>) => {
		setDraftByEntry((prev) => ({
			...prev,
			[buildDraftKey(locale, activeEntryKey)]: {
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
		onSuccess: async (_data, variables) => {
			setStatusMessage("草稿已保存");
			setErrorMessage(null);
			await queryClient.invalidateQueries({
				queryKey: adminHomeSectionsQueryKey(variables.locale),
			});
		},
		onError: (error) => {
			setStatusMessage(null);
			setErrorMessage(readErrorMessage(error));
		},
	});

	const publishMutation = useMutation({
		mutationFn: publishAdminHomeSection,
		onSuccess: async (_data, variables) => {
			setStatusMessage("发布成功");
			setErrorMessage(null);
			await queryClient.invalidateQueries({
				queryKey: adminHomeSectionsQueryKey(variables.locale),
			});
			await queryClient.invalidateQueries({ queryKey: homeContentQueryKeyPrefix });
		},
		onError: (error) => {
			setStatusMessage(null);
			setErrorMessage(readErrorMessage(error));
		},
	});

	const uploadAssetMutation = useMutation({
		mutationFn: (payload: UploadAdminAssetInput) => uploadAdminAsset(payload),
	});

	const handleUploadImage = async (file: File) => {
		const payload: UploadAdminAssetInput = {
			fileName: file.name,
			contentType: file.type || "application/octet-stream",
			dataBase64: toBase64(await file.arrayBuffer()),
		};
		try {
			const asset = await uploadAssetMutation.mutateAsync(payload);
			const assetUrl = `/api/content/assets/${asset.id}`;
			setStatusMessage("图片上传成功");
			setErrorMessage(null);
			return {
				assetId: asset.id,
				assetUrl,
				markdownSnippet: `![${asset.fileName}](${assetUrl})`,
			};
		} catch (error) {
			setStatusMessage(null);
			setErrorMessage(readErrorMessage(error));
			throw error;
		}
	};

	const handleSaveDraft = () => {
		resetMessage();
		if (!resolvedFormState.title.trim()) {
			setErrorMessage("标题不能为空");
			return;
		}
		saveDraftMutation.mutate({
			locale,
			entryKey: activeEntryKey,
			title: resolvedFormState.title,
			summaryMd: resolvedFormState.summaryMd || undefined,
			bodyMd: resolvedFormState.bodyMd || undefined,
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
			locale,
			entryKey: activeEntryKey,
			revisionId: selectedSection.latestRevisionId,
		});
	};

	const renderSectionEditor = () => {
		if (activeEntryKey === "home.philosophy") {
			const content = resolvedFormState.content as PhilosophyContent;
			return (
				<div className="space-y-4">
					<MarkdownEditor
						id="philosophy-intro"
						label="导语"
						value={content.intro}
						onChange={(value) => setFormState({ content: { ...content, intro: value } })}
						rows={5}
						onUploadImage={handleUploadImage}
					/>
					<div className="space-y-3 border-t border-border/70 pt-4">
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium text-foreground">理念条目</p>
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									setFormState({
										content: {
											...content,
											items: [...content.items, { title: "", description: "" }],
										},
									})
								}
							>
								<Plus className="mr-1 size-4" />新增条目
							</Button>
						</div>
						{content.items.map((item, index) => (
							<div key={`philosophy-item-${index}`} className="space-y-3 rounded-xl border border-border/70 p-3">
								<div className="flex items-center justify-between gap-2">
									<Label htmlFor={`philosophy-item-title-${index}`}>条目标题 {index + 1}</Label>
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
										disabled={content.items.length <= 1}
									>
										<Trash2 className="size-4" />
									</Button>
								</div>
								<Input
									id={`philosophy-item-title-${index}`}
									value={item.title}
									onChange={(event) => {
										const nextItems = [...content.items];
										nextItems[index] = { ...item, title: event.target.value };
										setFormState({ content: { ...content, items: nextItems } });
									}}
									placeholder="输入条目标题"
								/>
								<MarkdownEditor
									id={`philosophy-item-desc-${index}`}
									label="条目内容"
									value={item.description}
									onChange={(value) => {
										const nextItems = [...content.items];
										nextItems[index] = { ...item, description: value };
										setFormState({ content: { ...content, items: nextItems } });
									}}
									rows={4}
									onUploadImage={handleUploadImage}
								/>
							</div>
						))}
					</div>
				</div>
			);
		}

		if (activeEntryKey === "home.daily_notes") {
			const content = resolvedFormState.content as DailyNotesContent;
			return (
				<div className="space-y-3 border-t border-border/70 pt-4">
					<div className="flex items-center justify-between">
						<p className="text-sm font-medium text-foreground">日思条目</p>
						<Button
							type="button"
							variant="outline"
							onClick={() =>
								setFormState({
									content: {
										...content,
										items: [
											...content.items,
											{ date: "", title: "", summary: "", tags: [] },
										],
									},
								})
							}
						>
							<Plus className="mr-1 size-4" />新增条目
						</Button>
					</div>
					{content.items.map((item, index) => (
						<div key={`daily-item-${index}`} className="space-y-3 rounded-xl border border-border/70 p-3">
							<div className="flex items-center justify-between gap-2">
								<p className="text-sm font-medium text-foreground">条目 {index + 1}</p>
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
									disabled={content.items.length <= 1}
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
							<div className="grid gap-3 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor={`daily-date-${index}`}>日期</Label>
									<Input
										id={`daily-date-${index}`}
										value={item.date}
										onChange={(event) => {
											const nextItems = [...content.items];
											nextItems[index] = { ...item, date: event.target.value };
											setFormState({ content: { ...content, items: nextItems } });
										}}
										placeholder="YYYY-MM-DD"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`daily-title-${index}`}>标题</Label>
									<Input
										id={`daily-title-${index}`}
										value={item.title}
										onChange={(event) => {
											const nextItems = [...content.items];
											nextItems[index] = { ...item, title: event.target.value };
											setFormState({ content: { ...content, items: nextItems } });
										}}
										placeholder="输入标题"
									/>
								</div>
							</div>
							<MarkdownEditor
								id={`daily-summary-${index}`}
								label="内容"
								value={item.summary}
								onChange={(value) => {
									const nextItems = [...content.items];
									nextItems[index] = { ...item, summary: value };
									setFormState({ content: { ...content, items: nextItems } });
								}}
								rows={5}
								onUploadImage={handleUploadImage}
							/>
							<div className="space-y-2">
								<Label htmlFor={`daily-tags-${index}`}>标签（逗号分隔）</Label>
								<Input
									id={`daily-tags-${index}`}
									value={item.tags.join(", ")}
									onChange={(event) => {
										const tags = event.target.value
											.split(",")
											.map((tag) => tag.trim())
											.filter(Boolean);
										const nextItems = [...content.items];
										nextItems[index] = { ...item, tags };
										setFormState({ content: { ...content, items: nextItems } });
									}}
									placeholder="成长, 陪伴"
								/>
							</div>
						</div>
					))}
				</div>
			);
		}

		if (activeEntryKey === "home.stories") {
			const content = resolvedFormState.content as StoriesContent;
			return (
				<div className="space-y-3 border-t border-border/70 pt-4">
					<div className="flex items-center justify-between">
						<p className="text-sm font-medium text-foreground">故事条目</p>
						<Button
							type="button"
							variant="outline"
							onClick={() =>
								setFormState({
									content: {
										...content,
										items: [
											...content.items,
											{
												title: "",
												summary: "",
												publishDate: "",
												duration: "",
												status: "coming_soon",
												link: "",
											},
										],
									},
								})
							}
						>
							<Plus className="mr-1 size-4" />新增条目
						</Button>
					</div>
					{content.items.map((item, index) => (
						<div key={`story-item-${index}`} className="space-y-3 rounded-xl border border-border/70 p-3">
							<div className="flex items-center justify-between gap-2">
								<p className="text-sm font-medium text-foreground">条目 {index + 1}</p>
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
									disabled={content.items.length <= 1}
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
							<div className="grid gap-3 md:grid-cols-2">
								<div className="space-y-2 md:col-span-2">
									<Label htmlFor={`story-title-${index}`}>标题</Label>
									<Input
										id={`story-title-${index}`}
										value={item.title}
										onChange={(event) => {
											const nextItems = [...content.items];
											nextItems[index] = { ...item, title: event.target.value };
											setFormState({ content: { ...content, items: nextItems } });
										}}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`story-date-${index}`}>发布日期</Label>
									<Input
										id={`story-date-${index}`}
										value={item.publishDate}
										onChange={(event) => {
											const nextItems = [...content.items];
											nextItems[index] = { ...item, publishDate: event.target.value };
											setFormState({ content: { ...content, items: nextItems } });
										}}
										placeholder="YYYY-MM-DD"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`story-duration-${index}`}>时长</Label>
									<Input
										id={`story-duration-${index}`}
										value={item.duration}
										onChange={(event) => {
											const nextItems = [...content.items];
											nextItems[index] = { ...item, duration: event.target.value };
											setFormState({ content: { ...content, items: nextItems } });
										}}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`story-status-${index}`}>状态</Label>
									<select
										id={`story-status-${index}`}
										value={item.status}
										onChange={(event) => {
											const nextItems = [...content.items];
											nextItems[index] = {
												...item,
												status: event.target.value as "published" | "coming_soon",
											};
											setFormState({ content: { ...content, items: nextItems } });
										}}
										className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
									>
										<option value="published">published</option>
										<option value="coming_soon">coming_soon</option>
									</select>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`story-link-${index}`}>链接（可选）</Label>
									<Input
										id={`story-link-${index}`}
										value={item.link ?? ""}
										onChange={(event) => {
											const nextItems = [...content.items];
											nextItems[index] = { ...item, link: event.target.value };
											setFormState({ content: { ...content, items: nextItems } });
										}}
										placeholder="https://..."
									/>
								</div>
							</div>
							<MarkdownEditor
								id={`story-summary-${index}`}
								label="故事摘要"
								value={item.summary}
								onChange={(value) => {
									const nextItems = [...content.items];
									nextItems[index] = { ...item, summary: value };
									setFormState({ content: { ...content, items: nextItems } });
								}}
								rows={5}
								onUploadImage={handleUploadImage}
							/>
						</div>
					))}
				</div>
			);
		}

		const content = resolvedFormState.content as ColearningContent;
		return (
			<div className="space-y-4">
				<MarkdownEditor
					id="colearning-intro"
					label="导语"
					value={content.intro}
					onChange={(value) => setFormState({ content: { ...content, intro: value } })}
					rows={5}
					onUploadImage={handleUploadImage}
				/>

				<div className="space-y-3 border-t border-border/70 pt-4">
					<div className="flex items-center justify-between">
						<p className="text-sm font-medium text-foreground">共学方法</p>
						<Button
							type="button"
							variant="outline"
							onClick={() =>
								setFormState({
									content: {
										...content,
										methods: [...content.methods, { title: "", description: "" }],
									},
								})
							}
						>
							<Plus className="mr-1 size-4" />新增方法
						</Button>
					</div>
					{content.methods.map((method, index) => (
						<div key={`method-${index}`} className="space-y-3 rounded-xl border border-border/70 p-3">
							<div className="flex items-center justify-between gap-2">
								<Label htmlFor={`method-title-${index}`}>方法标题 {index + 1}</Label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() =>
										setFormState({
											content: {
												...content,
												methods: content.methods.filter((_, i) => i !== index),
											},
										})
									}
									disabled={content.methods.length <= 1}
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
							<Input
								id={`method-title-${index}`}
								value={method.title}
								onChange={(event) => {
									const nextMethods = [...content.methods];
									nextMethods[index] = { ...method, title: event.target.value };
									setFormState({ content: { ...content, methods: nextMethods } });
								}}
							/>
							<MarkdownEditor
								id={`method-desc-${index}`}
								label="方法描述"
								value={method.description}
								onChange={(value) => {
									const nextMethods = [...content.methods];
									nextMethods[index] = { ...method, description: value };
									setFormState({ content: { ...content, methods: nextMethods } });
								}}
								rows={4}
								onUploadImage={handleUploadImage}
							/>
						</div>
					))}
				</div>

				<div className="space-y-3 border-t border-border/70 pt-4">
					<div className="flex items-center justify-between">
						<p className="text-sm font-medium text-foreground">收益点</p>
						<Button
							type="button"
							variant="outline"
							onClick={() =>
								setFormState({ content: { ...content, benefits: [...content.benefits, ""] } })
							}
						>
							<Plus className="mr-1 size-4" />新增收益点
						</Button>
					</div>
					{content.benefits.map((benefit, index) => (
						<div key={`benefit-${index}`} className="flex items-center gap-2">
							<Input
								value={benefit}
								onChange={(event) => {
									const nextBenefits = [...content.benefits];
									nextBenefits[index] = event.target.value;
									setFormState({ content: { ...content, benefits: nextBenefits } });
								}}
								placeholder="输入收益点"
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() =>
									setFormState({
										content: {
											...content,
											benefits: content.benefits.filter((_, i) => i !== index),
										},
									})
								}
								disabled={content.benefits.length <= 1}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
					))}
				</div>

				<div className="space-y-3 border-t border-border/70 pt-4">
					<p className="text-sm font-medium text-foreground">案例亮点</p>
					<div className="space-y-2">
						<Label htmlFor="case-title">案例标题</Label>
						<Input
							id="case-title"
							value={content.caseHighlight.title}
							onChange={(event) =>
								setFormState({
									content: {
										...content,
										caseHighlight: {
											...content.caseHighlight,
											title: event.target.value,
										},
									},
								})
							}
						/>
					</div>
					<MarkdownEditor
						id="case-summary"
						label="案例摘要"
						value={content.caseHighlight.summary}
						onChange={(value) =>
							setFormState({
								content: {
									...content,
									caseHighlight: {
										...content.caseHighlight,
										summary: value,
									},
								},
							})
						}
						rows={4}
						onUploadImage={handleUploadImage}
					/>
					<div className="grid gap-3 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="case-cta-label">CTA 文案</Label>
							<Input
								id="case-cta-label"
								value={content.caseHighlight.cta.label}
								onChange={(event) =>
									setFormState({
										content: {
											...content,
											caseHighlight: {
												...content.caseHighlight,
												cta: {
													...content.caseHighlight.cta,
													label: event.target.value,
												},
											},
										},
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="case-cta-href">CTA 链接</Label>
							<Input
								id="case-cta-href"
								value={content.caseHighlight.cta.href}
								onChange={(event) =>
									setFormState({
										content: {
											...content,
											caseHighlight: {
												...content.caseHighlight,
												cta: {
													...content.caseHighlight.cta,
													href: event.target.value,
												},
											},
										},
									})
								}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const hasAnyHistory = (sectionsQuery.data?.length ?? 0) > 0;
	const isPending =
		saveDraftMutation.isPending ||
		publishMutation.isPending ||
		uploadAssetMutation.isPending;

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
								内容编辑台
							</h1>
						</div>
						<div className="flex flex-wrap gap-2">
							<div className="inline-flex items-center rounded-full border border-border/70 bg-background/70 p-1">
								{LOCALE_OPTIONS.map((option) => {
									const active = option.value === locale;
									return (
										<button
											key={option.value}
											type="button"
											aria-pressed={active}
											onClick={() => {
												if (option.value === locale) return;
												setLocale(option.value);
												resetMessage();
											}}
											className={[
												"rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
												active
													? "bg-primary text-primary-foreground"
													: "text-muted-foreground hover:text-foreground",
											].join(" ")}
										>
											{option.label}
										</button>
									);
								})}
							</div>
							<Badge variant="secondary">{SECTION_EDITOR_META[activeEntryKey].moduleName}</Badge>
							<Badge variant="outline">{locale}</Badge>
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
							内容模块
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
