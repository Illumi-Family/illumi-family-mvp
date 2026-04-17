export type UploadTaskStatus =
	| "idle"
	| "issuing_url"
	| "uploading"
	| "processing_wait"
	| "ready"
	| "failed";

export type UploadProgress = {
	status: UploadTaskStatus;
	progressPercent: number;
	errorMessage: string | null;
};

export type RunVideoUploadTaskInput = {
	taskTitle?: string;
	file: File;
	issueUploadUrl: (input: { title?: string }) => Promise<{
		videoId: string;
		uploadUrl: string;
		expiresAt: string | null;
	}>;
	cleanupDraftVideo?: (videoId: string) => Promise<unknown>;
	onProgress: (progress: UploadProgress) => void;
};

const emit = (
	onProgress: RunVideoUploadTaskInput["onProgress"],
	payload: Partial<UploadProgress>,
) => {
	onProgress({
		status: payload.status ?? "idle",
		progressPercent: payload.progressPercent ?? 0,
		errorMessage: payload.errorMessage ?? null,
	});
};

const uploadViaXhr = (
	uploadUrl: string,
	file: File,
	onProgress: (percent: number) => void,
) =>
	new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", uploadUrl);

		xhr.upload.onprogress = (event) => {
			if (!event.lengthComputable || event.total <= 0) return;
			const percent = Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)));
			onProgress(percent);
		};

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
				return;
			}
			reject(new Error(`Upload failed with status ${xhr.status}`));
		};

		xhr.onerror = () => reject(new Error("Upload request failed"));
		xhr.onabort = () => reject(new Error("Upload aborted"));

		const formData = new FormData();
		formData.append("file", file, file.name);
		xhr.send(formData);
	});

export const runVideoUploadTask = async (
	input: RunVideoUploadTaskInput,
): Promise<{ videoId: string }> => {
	emit(input.onProgress, { status: "issuing_url", progressPercent: 0, errorMessage: null });

	let issuedVideoId: string | null = null;
	try {
		const uploadMeta = await input.issueUploadUrl({
			title: input.taskTitle?.trim() || undefined,
		});
		issuedVideoId = uploadMeta.videoId;

		emit(input.onProgress, { status: "uploading", progressPercent: 0, errorMessage: null });
		await uploadViaXhr(uploadMeta.uploadUrl, input.file, (percent) => {
			emit(input.onProgress, { status: "uploading", progressPercent: percent, errorMessage: null });
		});

		emit(input.onProgress, {
			status: "processing_wait",
			progressPercent: 100,
			errorMessage: null,
		});

		return { videoId: uploadMeta.videoId };
	} catch (error) {
		if (issuedVideoId && input.cleanupDraftVideo) {
			try {
				await input.cleanupDraftVideo(issuedVideoId);
			} catch {
				// Best effort cleanup only.
			}
		}
		emit(input.onProgress, {
			status: "failed",
			progressPercent: 0,
			errorMessage: error instanceof Error ? error.message : "Unexpected upload error",
		});
		throw error;
	}
};
