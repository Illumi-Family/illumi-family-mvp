import { afterEach, describe, expect, it, vi } from "vitest";
import { runVideoUploadTask } from "./video-upload-task";

type FakeProgressEvent = {
	lengthComputable: boolean;
	loaded: number;
	total: number;
};

class FakeXMLHttpRequest {
	static responseStatus = 200;
	static progressEvents: FakeProgressEvent[] = [];
	static shouldError = false;

	upload: { onprogress: ((event: FakeProgressEvent) => void) | null } = {
		onprogress: null,
	};
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	onabort: (() => void) | null = null;
	status = 0;

	open() {
		return undefined;
	}

	send() {
		for (const event of FakeXMLHttpRequest.progressEvents) {
			this.upload.onprogress?.(event);
		}

		if (FakeXMLHttpRequest.shouldError) {
			this.onerror?.();
			return;
		}

		this.status = FakeXMLHttpRequest.responseStatus;
		this.onload?.();
	}
}

describe("video-upload-task", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		FakeXMLHttpRequest.responseStatus = 200;
		FakeXMLHttpRequest.progressEvents = [];
		FakeXMLHttpRequest.shouldError = false;
	});

	it("emits issuing/uploading/processing states with progress", async () => {
		vi.stubGlobal("XMLHttpRequest", FakeXMLHttpRequest as unknown as typeof XMLHttpRequest);
		FakeXMLHttpRequest.progressEvents = [
			{ lengthComputable: true, loaded: 50, total: 100 },
			{ lengthComputable: true, loaded: 100, total: 100 },
		];

		const progresses: Array<{ status: string; progressPercent: number; errorMessage: string | null }> = [];
		const result = await runVideoUploadTask({
			taskTitle: "Family",
			file: new File(["video"], "sample.mp4", { type: "video/mp4" }),
			issueUploadUrl: async () => ({
				videoId: "video-1",
				uploadUrl: "https://upload.example.com",
				expiresAt: null,
			}),
			onProgress: (event) => progresses.push(event),
		});

		expect(result.videoId).toBe("video-1");
		expect(progresses.map((item) => item.status)).toContain("issuing_url");
		expect(progresses.map((item) => item.status)).toContain("uploading");
		expect(progresses.at(-1)?.status).toBe("processing_wait");
		expect(progresses.some((item) => item.progressPercent === 100)).toBe(true);
	});

	it("cleans up draft and emits failed when upload fails", async () => {
		vi.stubGlobal("XMLHttpRequest", FakeXMLHttpRequest as unknown as typeof XMLHttpRequest);
		FakeXMLHttpRequest.responseStatus = 500;
		const cleanupDraftVideo = vi.fn();
		const progresses: Array<{ status: string; progressPercent: number; errorMessage: string | null }> = [];

		await expect(
			runVideoUploadTask({
				file: new File(["video"], "sample.mp4", { type: "video/mp4" }),
				issueUploadUrl: async () => ({
					videoId: "video-err",
					uploadUrl: "https://upload.example.com",
					expiresAt: null,
				}),
				cleanupDraftVideo,
				onProgress: (event) => progresses.push(event),
			}),
		).rejects.toThrow("Upload failed with status 500");

		expect(cleanupDraftVideo).toHaveBeenCalledWith("video-err");
		expect(progresses.at(-1)?.status).toBe("failed");
		expect(progresses.at(-1)?.errorMessage).toContain("500");
	});
});
