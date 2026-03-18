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
	type HomeSectionEntryKey,
} from "../content/content.schema";
import { ContentService } from "../content/content.service";
import { AppError } from "../../shared/http/errors";

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

export class AdminService {
	constructor(private readonly repository: AdminRepository) {}

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
		parseHomeSectionContent(input.entryKey, input.body.contentJson);
		return this.repository.createHomeSectionDraft(input);
	}

	async publishHomeSection(
		env: AppBindings,
		input: {
			entryKey: HomeSectionEntryKey;
			locale: ContentLocale;
			body: AdminPublishHomeSectionBody;
		},
	) {
		const result = await this.repository.publishHomeSection({
			entryKey: input.entryKey,
			locale: input.locale,
			revisionId: input.body.revisionId,
		});
		if (!result.changed) {
			if (result.reason === "ENTRY_NOT_FOUND") {
				throw new AppError("NOT_FOUND", "Entry not found", 404);
			}
			throw new AppError("NOT_FOUND", "Revision not found", 404);
		}

		const cacheLocales: ContentLocale[] =
			input.locale === DEFAULT_CONTENT_LOCALE
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
