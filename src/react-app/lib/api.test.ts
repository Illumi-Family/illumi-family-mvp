import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createAdminVideoUploadUrl,
	deleteAdminVideoDraft,
	getCurrentUser,
	getHealth,
	getHomeContent,
	importAdminVideo,
	listAdminVideos,
	listAdminHomeSections,
	listPublicVideos,
	publishAdminVideo,
	publishAdminHomeSection,
	saveAdminHomeSectionDraft,
	syncAdminVideoCatalog,
	syncAdminVideoStatus,
	unpublishAdminVideo,
	updateAdminVideo,
	updateCurrentUser,
	uploadAdminAsset,
} from "./api";

describe("react api client", () => {
	const fetchMock = vi.fn<typeof fetch>();

	beforeEach(() => {
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		fetchMock.mockReset();
		vi.unstubAllGlobals();
	});

	it("loads health payload from /api/health", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						status: "ok",
						appEnv: "dev",
						apiVersion: "v1",
						timestamp: "2026-03-04T12:00:00.000Z",
					},
					requestId: "req-1",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const result = await getHealth();

		expect(fetchMock).toHaveBeenCalledWith("/api/health", {
			headers: { Accept: "application/json" },
		});
		expect(result.status).toBe("ok");
		expect(result.appEnv).toBe("dev");
	});

	it("loads current user from /api/users/me", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						user: {
							id: "u-1",
							name: "Alice",
							email: "alice@example.com",
							createdAt: "2026-03-04T12:00:00.000Z",
							updatedAt: "2026-03-04T12:00:00.000Z",
						},
					},
					requestId: "req-2",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const user = await getCurrentUser();

		expect(fetchMock).toHaveBeenCalledWith("/api/users/me", {
			headers: {
				Accept: "application/json",
			},
		});
		expect(user.name).toBe("Alice");
	});

	it("updates current user with PATCH /api/users/me", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						user: {
							id: "u-1",
							name: "Alice Smith",
							email: "alice@example.com",
							createdAt: "2026-03-04T12:00:00.000Z",
							updatedAt: "2026-03-04T12:30:00.000Z",
						},
					},
					requestId: "req-3",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const user = await updateCurrentUser({
			name: "Alice Smith",
		});

		expect(fetchMock).toHaveBeenCalledWith("/api/users/me", {
			method: "PATCH",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name: "Alice Smith",
			}),
		});
		expect(user.name).toBe("Alice Smith");
	});

	it("throws structured error when current user is unavailable", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: false,
					error: {
						code: "CURRENT_USER_NOT_FOUND",
						message: "Current user is not available",
					},
					requestId: "req-4",
				}),
				{ status: 404, headers: { "content-type": "application/json" } },
			),
		);

		await expect(getCurrentUser()).rejects.toThrow(
			"CURRENT_USER_NOT_FOUND: Current user is not available",
		);
	});

	it("loads home cms content from /api/content/home", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						heroSlogan: {
							title: "三代同堂家风家学传承践行者",
							subtitle: "每个家庭都能有属于自己的童蒙家塾",
						},
						featuredVideos: {
							main: {
								streamVideoId: "stream-main-1",
							},
							characters: {
								items: [{ streamVideoId: "stream-char-1" }],
							},
						},
						philosophy: { intro: "理念", items: [] },
						dailyNotes: { items: [] },
						stories: { items: [] },
						colearning: {
							intro: "共学",
							methods: [],
							benefits: [],
							caseHighlight: {
								title: "案例",
								summary: "摘要",
								cta: { label: "查看", href: "#contact" },
							},
						},
						locale: "en-US",
						fallbackFrom: ["zh-CN"],
						updatedAt: "2026-03-06T00:00:00.000Z",
					},
					requestId: "req-4",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const result = await getHomeContent("en-US");
		expect(fetchMock).toHaveBeenCalledWith("/api/content/home?locale=en-US", {
			headers: { Accept: "application/json" },
		});
		expect(result.philosophy.intro).toBe("理念");
		expect(result.heroSlogan.title).toContain("三代同堂");
		expect(result.featuredVideos.main.streamVideoId).toBe("stream-main-1");
		expect(result.locale).toBe("en-US");
		expect(result.fallbackFrom).toEqual(["zh-CN"]);
	});

	it("passes locale query to admin list api", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: { sections: [] },
					requestId: "req-admin-list",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		await listAdminHomeSections("en-US");

		expect(fetchMock).toHaveBeenCalledWith("/api/admin/content/home?locale=en-US", {
			headers: { Accept: "application/json" },
		});
	});

	it("passes locale query to admin save draft api", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: { entryId: "entry-1", revisionId: "rev-1", revisionNo: 1 },
					requestId: "req-admin-save",
				}),
				{ status: 201, headers: { "content-type": "application/json" } },
			),
		);

		await saveAdminHomeSectionDraft({
			locale: "zh-CN",
			entryKey: "home.philosophy",
			title: "t",
			contentJson: {},
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/admin/content/home/home.philosophy?locale=zh-CN",
			{
				method: "PUT",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: "t",
					summaryMd: undefined,
					bodyMd: undefined,
					contentJson: {},
				}),
			},
		);
	});

	it("passes locale query to admin publish api", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: { changed: true, entryId: "entry-1", revisionId: "rev-1" },
					requestId: "req-admin-publish",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		await publishAdminHomeSection({
			locale: "en-US",
			entryKey: "home.philosophy",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/admin/content/home/home.philosophy/publish?locale=en-US",
			{
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					revisionId: undefined,
				}),
			},
		);
	});

	it("uploads admin asset with json payload", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						asset: {
							id: "asset-1",
							r2Key: "cms/dev/2026/03/asset-1-cover.webp",
							fileName: "cover.webp",
							mimeType: "image/webp",
							sizeBytes: 5,
							width: 800,
							height: 600,
							sha256: "abc",
							uploadedByAuthUserId: "auth-1",
							createdAt: "2026-03-06T00:00:00.000Z",
						},
					},
					requestId: "req-5",
				}),
				{ status: 201, headers: { "content-type": "application/json" } },
			),
		);

		const asset = await uploadAdminAsset({
			fileName: "cover.webp",
			contentType: "image/webp",
			dataBase64: "aGVsbG8=",
			width: 800,
			height: 600,
		});

		expect(fetchMock).toHaveBeenCalledWith("/api/admin/assets/upload", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				fileName: "cover.webp",
				contentType: "image/webp",
				dataBase64: "aGVsbG8=",
				width: 800,
				height: 600,
			}),
		});
		expect(asset.id).toBe("asset-1");
		expect(asset.mimeType).toBe("image/webp");
	});

	it("creates admin video upload url", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						videoId: "video-1",
						uploadUrl: "https://upload.example.com",
						expiresAt: "2026-04-16T00:00:00.000Z",
					},
					requestId: "req-video-upload-url",
				}),
				{ status: 201, headers: { "content-type": "application/json" } },
			),
		);

		const result = await createAdminVideoUploadUrl({
			title: "Family Story",
			maxDurationSeconds: 600,
		});

		expect(fetchMock).toHaveBeenCalledWith("/api/admin/videos/upload-url", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				title: "Family Story",
				maxDurationSeconds: 600,
			}),
		});
		expect(result.videoId).toBe("video-1");
	});

	it("imports existing stream video for admin", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						reused: false,
						video: {
							id: "video-imported",
							streamVideoId: "stream-1",
							processingStatus: "ready",
							publishStatus: "draft",
							title: "Imported",
							posterUrl: null,
							durationSeconds: 12,
							createdByAuthUserId: "auth-1",
							updatedByAuthUserId: "auth-1",
							createdAt: "2026-04-16T00:00:00.000Z",
							updatedAt: "2026-04-16T00:00:00.000Z",
							publishedAt: null,
						},
					},
					requestId: "req-video-import",
				}),
				{ status: 201, headers: { "content-type": "application/json" } },
			),
		);

		const result = await importAdminVideo({
			streamVideoId: "stream-1",
			title: "Imported",
		});

		expect(fetchMock).toHaveBeenCalledWith("/api/admin/videos/import", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				streamVideoId: "stream-1",
				title: "Imported",
				posterUrl: undefined,
			}),
		});
		expect(result.reused).toBe(false);
		expect(result.video.id).toBe("video-imported");
	});

	it("lists admin videos from /api/admin/videos", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						videos: [
							{
								id: "video-1",
								streamVideoId: "stream-1",
								processingStatus: "ready",
								publishStatus: "draft",
								title: "Video 1",
								posterUrl: null,
								durationSeconds: 12,
								createdByAuthUserId: "auth-1",
								updatedByAuthUserId: "auth-1",
								createdAt: "2026-04-16T00:00:00.000Z",
								updatedAt: "2026-04-16T00:00:00.000Z",
								publishedAt: null,
							},
						],
					},
					requestId: "req-admin-videos",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const videos = await listAdminVideos();

		expect(fetchMock).toHaveBeenCalledWith("/api/admin/videos", {
			headers: { Accept: "application/json" },
		});
		expect(videos[0]?.id).toBe("video-1");
	});

	it("updates admin video metadata", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						video: {
							id: "video-1",
							streamVideoId: "stream-1",
							processingStatus: "ready",
							publishStatus: "draft",
							title: "Updated title",
							posterUrl: "https://example.com/poster.jpg",
							durationSeconds: 20,
							createdByAuthUserId: "auth-1",
							updatedByAuthUserId: "auth-1",
							createdAt: "2026-04-16T00:00:00.000Z",
							updatedAt: "2026-04-16T00:00:00.000Z",
							publishedAt: null,
						},
					},
					requestId: "req-video-update",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const video = await updateAdminVideo({
			videoId: "video-1",
			title: "Updated title",
			posterUrl: "https://example.com/poster.jpg",
		});

		expect(fetchMock).toHaveBeenCalledWith("/api/admin/videos/video-1", {
			method: "PATCH",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				title: "Updated title",
				posterUrl: "https://example.com/poster.jpg",
			}),
		});
		expect(video.title).toBe("Updated title");
	});

	it("publishes, unpublishes and syncs admin video status", async () => {
		fetchMock
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						success: true,
						data: { changed: true, video: null },
						requestId: "req-video-publish",
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				),
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						success: true,
						data: { changed: true, video: null },
						requestId: "req-video-unpublish",
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				),
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						success: true,
						data: {
							video: {
								id: "video-1",
								streamVideoId: "stream-1",
								processingStatus: "ready",
								publishStatus: "draft",
								title: "Video 1",
								posterUrl: null,
								durationSeconds: 12,
								createdByAuthUserId: "auth-1",
								updatedByAuthUserId: "auth-1",
								createdAt: "2026-04-16T00:00:00.000Z",
								updatedAt: "2026-04-16T00:00:00.000Z",
								publishedAt: null,
							},
						},
						requestId: "req-video-sync",
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				),
			);

		const publishResult = await publishAdminVideo("video-1");
		const unpublishResult = await unpublishAdminVideo("video-1");
		const syncedVideo = await syncAdminVideoStatus("video-1");

		expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/admin/videos/video-1/publish", {
			method: "POST",
			headers: { Accept: "application/json" },
		});
		expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/admin/videos/video-1/unpublish", {
			method: "POST",
			headers: { Accept: "application/json" },
		});
		expect(fetchMock).toHaveBeenNthCalledWith(
			3,
			"/api/admin/videos/video-1/sync-status",
			{
				method: "POST",
				headers: { Accept: "application/json" },
			},
		);
		expect(publishResult.changed).toBe(true);
		expect(unpublishResult.changed).toBe(true);
		expect(syncedVideo.id).toBe("video-1");
	});

	it("deletes admin draft video", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						deleted: true,
						videoId: "video-1",
						remoteDeleted: true,
					},
					requestId: "req-video-delete",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const result = await deleteAdminVideoDraft("video-1");

		expect(fetchMock).toHaveBeenCalledWith("/api/admin/videos/video-1", {
			method: "DELETE",
			headers: { Accept: "application/json" },
		});
		expect(result.deleted).toBe(true);
		expect(result.remoteDeleted).toBe(true);
	});

	it("syncs admin video catalog from /api/admin/videos/sync-catalog", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						created: 3,
						updated: 5,
						downgraded: 1,
						failed: 0,
						partial: false,
						totalRemote: 9,
						processedRemote: 9,
					},
					requestId: "req-video-sync-catalog",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const summary = await syncAdminVideoCatalog();

		expect(fetchMock).toHaveBeenCalledWith("/api/admin/videos/sync-catalog", {
			method: "POST",
			headers: { Accept: "application/json" },
		});
		expect(summary.created).toBe(3);
		expect(summary.downgraded).toBe(1);
	});

	it("lists public videos from /api/content/videos", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						videos: [
							{
								id: "video-1",
								streamVideoId: "stream-1",
								title: "Video 1",
								posterUrl: null,
								durationSeconds: 12,
								publishedAt: "2026-04-16T00:00:00.000Z",
							},
						],
					},
					requestId: "req-public-videos",
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const videos = await listPublicVideos();

		expect(fetchMock).toHaveBeenCalledWith("/api/content/videos", {
			headers: { Accept: "application/json" },
		});
		expect(videos[0]?.streamVideoId).toBe("stream-1");
	});
});
