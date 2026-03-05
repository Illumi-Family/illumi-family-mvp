export const putObject = async (
	bucket: R2Bucket,
	key: string,
	body: ReadableStream | ArrayBuffer | ArrayBufferView | string,
	contentType?: string,
) => {
	await bucket.put(key, body, {
		httpMetadata: contentType ? { contentType } : undefined,
	});
};

export const getObject = (bucket: R2Bucket, key: string) => bucket.get(key);
