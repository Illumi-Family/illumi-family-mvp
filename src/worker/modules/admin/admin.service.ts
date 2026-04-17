import { deleteCacheKey } from "../../shared/storage/kv";
import { putObject } from "../../shared/storage/r2";
import type { AppBindings } from "../../types";
import type { AdminRepository } from "./admin.repository";
import {
	DEFAULT_CONTENT_LOCALE,
	SUPPORTED_CONTENT_LOCALES,
	type ContentLocale,
} from "../../shared/i18n/locale";
import {
	parseHomeSectionContent,
	type AdminPublishHomeSectionBody,
	type AdminUpsertHomeSectionBody,
	type CharacterVideosSectionContent,
	type HeroSloganSectionContent,
	type HomeSectionEntryKey,
	type MainVideoSectionContent,
} from "../content/content.schema";
import { ContentService } from "../content/content.service";
import { AppError } from "../../shared/http/errors";

const SHARED_HOME_SECTION_ENTRY_KEYS: ReadonlySet<HomeSectionEntryKey> = new Set([
	"home.hero_slogan",
	"home.main_video",
	"home.character_videos",
]);

const VIDEO_HOME_SECTION_ENTRY_KEYS: ReadonlySet<HomeSectionEntryKey> = new Set([
	"home.main_video",
	"home.character_videos",
]);

type ValidationIssue = {
	code: string;
	field: string;
	message: string;
	streamVideoId?: string;
	locale?: ContentLocale;
};

const slugify = (fileName: string) =>
	fileName
		.toLowerCase()
		.replace(/[^a-z0-9.-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

const decodeBase64 = (value: string): Uint8Array => {
	if (typeof atob !== "function") {
		throw new AppError("INTERNAL_SERVER_ERROR", "atob is not available", 500);
	}

	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
};

const sha256Hex = async (bytes: Uint8Array) => {
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
};

const buildAssetKey = (env: AppBindings, fileName: string) => {
	const now = new Date();
	const yyyy = now.getUTCFullYear();
	const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
	const safeName = slugify(fileName) || "asset.bin";
	return `cms/${env.APP_ENV}/${yyyy}/${mm}/${crypto.randomUUID()}-${safeName}`;
};

const normalizeStreamVideoId = (value: string) => value.trim();

const ensureRecordContentJson = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new AppError(
			"BAD_REQUEST",
			"Section content must be an object",
			400,
		);
	}
	return value as Record<string, unknown>;
};

export class AdminService {
	constructor(private readonly repository: AdminRepository) {}

	private isSharedHomeSection(entryKey: HomeSectionEntryKey) {
		return SHARED_HOME_SECTION_ENTRY_KEYS.has(entryKey);
	}

	private getMirroredLocales(entryKey: HomeSectionEntryKey, locale: ContentLocale) {
		if (this.isSharedHomeSection(entryKey)) {
			return [...SUPPORTED_CONTENT_LOCALES] as ContentLocale[];
		}
		return [locale];
	}

	private throwValidationError(
		message: string,
		summary: string,
		issues: ValidationIssue[],
	) {
		throw new AppError("BAD_REQUEST", message, 400, {
			summary,
			issues,
		});
	}

	private assertPublishRequiredFields(
		entryKey: HomeSectionEntryKey,
		contentJson: Record<string, unknown>,
		locale: ContentLocale,
	) {
		const issues: ValidationIssue[] = [];

		if (entryKey === "home.hero_slogan") {
			const content = contentJson as HeroSloganSectionContent;
			if (!content.title.trim()) {
				issues.push({
					code: "REQUIRED",
					field: "contentJson.title",
					message: "Slogan 主句不能为空",
					locale,
				});
			}
			if (!content.subtitle.trim()) {
				issues.push({
					code: "REQUIRED",
					field: "contentJson.subtitle",
					message: "Slogan 副句不能为空",
					locale,
				});
			}
		}

		if (entryKey === "home.main_video") {
			const content = contentJson as MainVideoSectionContent;
			if (!normalizeStreamVideoId(content.streamVideoId)) {
				issues.push({
					code: "REQUIRED",
					field: "contentJson.streamVideoId",
					message: "首页核心视频不能为空",
					locale,
				});
			}
		}

		if (entryKey === "home.character_videos") {
			const content = contentJson as CharacterVideosSectionContent;
			if (content.items.length < 1) {
				issues.push({
					code: "REQUIRED",
					field: "contentJson.items",
					message: "角色视频至少需要 1 条",
					locale,
				});
			}
			content.items.forEach((item, index) => {
				if (!normalizeStreamVideoId(item.streamVideoId)) {
					issues.push({
						code: "REQUIRED",
						field: `contentJson.items[${index}].streamVideoId`,
						message: "角色视频不能为空",
						locale,
					});
				}
			});
		}

		if (issues.length > 0) {
			this.throwValidationError(
				"Publish gate validation failed",
				"发布门禁校验失败",
				issues,
			);
		}
	}

	private async assertConfiguredVideosReadyAndPublished(input: {
		entryKey: HomeSectionEntryKey;
		contentJson: Record<string, unknown>;
		locale: ContentLocale;
		mode: "save" | "publish";
	}) {
		if (!VIDEO_HOME_SECTION_ENTRY_KEYS.has(input.entryKey)) {
			return;
		}

		const refs: Array<{ field: string; streamVideoId: string }> = [];
		if (input.entryKey === "home.main_video") {
			const content = input.contentJson as MainVideoSectionContent;
			const streamVideoId = normalizeStreamVideoId(content.streamVideoId);
			if (streamVideoId) {
				refs.push({
					field: "contentJson.streamVideoId",
					streamVideoId,
				});
			}
		}

		if (input.entryKey === "home.character_videos") {
			const content = input.contentJson as CharacterVideosSectionContent;
			content.items.forEach((item, index) => {
				const streamVideoId = normalizeStreamVideoId(item.streamVideoId);
				if (!streamVideoId) return;
				refs.push({
					field: `contentJson.items[${index}].streamVideoId`,
					streamVideoId,
				});
			});
		}

		if (refs.length === 0) {
			return;
		}

		const states = await this.repository.listVideoPublishStatesByStreamVideoIds(
			refs.map((item) => item.streamVideoId),
		);
		const stateById = new Map(states.map((item) => [item.streamVideoId, item]));
		const issues: ValidationIssue[] = [];

		for (const ref of refs) {
			const state = stateById.get(ref.streamVideoId);
			if (!state) {
				issues.push({
					code: "VIDEO_NOT_FOUND",
					field: ref.field,
					streamVideoId: ref.streamVideoId,
					message: `视频 ${ref.streamVideoId} 不存在，请先在 /admin/videos 中导入并发布`,
					locale: input.locale,
				});
				continue;
			}

			if (
				state.processingStatus !== "ready" ||
				state.publishStatus !== "published"
			) {
				issues.push({
					code: "VIDEO_NOT_READY_OR_PUBLISHED",
					field: ref.field,
					streamVideoId: ref.streamVideoId,
					message: `视频 ${ref.streamVideoId} 需为 ready + published（当前 ${state.processingStatus} + ${state.publishStatus}）`,
					locale: input.locale,
				});
			}
		}

		if (issues.length > 0) {
			this.throwValidationError(
				"Selected videos must be ready and published",
				input.mode === "publish" ? "发布门禁校验失败" : "草稿保存校验失败",
				issues,
			);
		}
	}

	private assertPublishFailure(
		reason: "ENTRY_NOT_FOUND" | "REVISION_NOT_FOUND",
		locale: ContentLocale,
	): never {
		if (reason === "ENTRY_NOT_FOUND") {
			throw new AppError(
				"NOT_FOUND",
				`Entry not found for locale ${locale}`,
				404,
				{ locale },
			);
		}
		throw new AppError(
			"NOT_FOUND",
			`Revision not found for locale ${locale}`,
			404,
			{ locale },
		);
	}

	getMe(input: { authUserId: string }) {
		return {
			authUserId: input.authUserId,
		};
	}

	listHomeSections(locale: ContentLocale) {
		return this.repository.listHomeSections(locale);
	}

	async saveHomeSectionDraft(input: {
		entryKey: HomeSectionEntryKey;
		locale: ContentLocale;
		body: AdminUpsertHomeSectionBody;
		authUserId: string;
	}) {
		const parsedContentJson = ensureRecordContentJson(
			parseHomeSectionContent(input.entryKey, input.body.contentJson),
		);
		await this.assertConfiguredVideosReadyAndPublished({
			entryKey: input.entryKey,
			contentJson: parsedContentJson,
			locale: input.locale,
			mode: "save",
		});

		const bodyWithParsedContent = {
			...input.body,
			contentJson: parsedContentJson,
		};

		if (!this.isSharedHomeSection(input.entryKey)) {
			return this.repository.createHomeSectionDraft({
				...input,
				body: bodyWithParsedContent,
			});
		}

		const mirrored = await this.repository.createHomeSectionDrafts({
			entryKey: input.entryKey,
			locales: this.getMirroredLocales(input.entryKey, input.locale),
			body: bodyWithParsedContent,
			authUserId: input.authUserId,
		});
		const activeLocaleResult =
			mirrored.find((item) => item.locale === input.locale) ?? mirrored[0];
		if (!activeLocaleResult) {
			throw new AppError(
				"INTERNAL_SERVER_ERROR",
				"Failed to persist mirrored home section draft",
				500,
			);
		}

		return {
			entryId: activeLocaleResult.entryId,
			revisionId: activeLocaleResult.revisionId,
			revisionNo: activeLocaleResult.revisionNo,
		};
	}

	async publishHomeSection(
		env: AppBindings,
		input: {
			entryKey: HomeSectionEntryKey;
			locale: ContentLocale;
			body: AdminPublishHomeSectionBody;
		},
	) {
		const publishTargets = this.getMirroredLocales(input.entryKey, input.locale).map(
			(locale) => ({
				entryKey: input.entryKey,
				locale,
				revisionId: locale === input.locale ? input.body.revisionId : undefined,
			}),
		);

		const resolvedTargets: Array<{
			locale: ContentLocale;
			entryId: string;
			revisionId: string;
			contentJson: Record<string, unknown>;
		}> = [];
		for (const target of publishTargets) {
			const revision = await this.repository.getHomeSectionRevisionContent(target);
			if (!revision.found) {
				if (revision.reason === "REVISION_CONTENT_INVALID") {
					throw new AppError(
						"BAD_REQUEST",
						`Revision content is invalid for locale ${target.locale}`,
						400,
						{ locale: target.locale },
					);
				}
				this.assertPublishFailure(revision.reason, target.locale);
			}

			const parsedContentJson = ensureRecordContentJson(
				parseHomeSectionContent(input.entryKey, revision.contentJson),
			);
			this.assertPublishRequiredFields(
				input.entryKey,
				parsedContentJson,
				target.locale,
			);
			await this.assertConfiguredVideosReadyAndPublished({
				entryKey: input.entryKey,
				contentJson: parsedContentJson,
				locale: target.locale,
				mode: "publish",
			});
			resolvedTargets.push({
				locale: target.locale,
				entryId: revision.entryId,
				revisionId: revision.revisionId,
				contentJson: parsedContentJson,
			});
		}

		let result: { changed: true; entryId: string; revisionId: string };
		if (resolvedTargets.length === 1) {
			const single = resolvedTargets[0];
			const published = await this.repository.publishHomeSection({
				entryKey: input.entryKey,
				locale: single.locale,
				revisionId: single.revisionId,
			});
			if (!published.changed) {
				this.assertPublishFailure(published.reason, single.locale);
			}
			result = published;
		} else {
			const published = await this.repository.publishHomeSections({
				entries: resolvedTargets.map((item) => ({
					entryKey: input.entryKey,
					locale: item.locale,
					revisionId: item.revisionId,
				})),
			});
			if (!published.changed) {
				this.assertPublishFailure(published.reason, published.locale);
			}

			const activeLocaleResult =
				published.results.find((item) => item.locale === input.locale) ??
				published.results[0];
			if (!activeLocaleResult) {
				throw new AppError(
					"INTERNAL_SERVER_ERROR",
					"Failed to publish mirrored home section",
					500,
				);
			}
			result = {
				changed: true,
				entryId: activeLocaleResult.entryId,
				revisionId: activeLocaleResult.revisionId,
			};
		}

		const cacheLocales: ContentLocale[] = this.isSharedHomeSection(input.entryKey)
			? [...SUPPORTED_CONTENT_LOCALES]
			: input.locale === DEFAULT_CONTENT_LOCALE
				? [...SUPPORTED_CONTENT_LOCALES]
				: [input.locale];
		for (const locale of cacheLocales) {
			await deleteCacheKey(env.CACHE, ContentService.getCacheKey(locale));
		}

		return result;
	}

	async uploadAsset(
		env: AppBindings,
		input: {
			fileName: string;
			contentType: string;
			dataBase64: string;
			width?: number;
			height?: number;
			authUserId: string;
		},
	) {
		if (!input.contentType.startsWith("image/")) {
			throw new AppError(
				"UNSUPPORTED_MEDIA_TYPE",
				"Asset must be image content type",
				415,
			);
		}

		const bytes = decodeBase64(input.dataBase64);
		if (bytes.byteLength === 0) {
			throw new AppError("BAD_REQUEST", "Asset payload is empty", 400);
		}
		if (bytes.byteLength > 10 * 1024 * 1024) {
			throw new AppError("BAD_REQUEST", "Asset payload too large", 400);
		}

		const r2Key = buildAssetKey(env, input.fileName);
		await putObject(env.FILES, r2Key, bytes, input.contentType);

		const sha256 = await sha256Hex(bytes);
		return this.repository.createAsset({
			r2Key,
			fileName: input.fileName,
			mimeType: input.contentType,
			sizeBytes: bytes.byteLength,
			width: input.width,
			height: input.height,
			sha256,
			uploadedByAuthUserId: input.authUserId,
		});
	}
}
