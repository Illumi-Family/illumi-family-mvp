export const readCacheJson = async <T>(
	kv: KVNamespace,
	key: string,
): Promise<T | null> => {
	const raw = await kv.get(key);
	if (!raw) {
		return null;
	}

	return JSON.parse(raw) as T;
};

export const writeCacheJson = async (
	kv: KVNamespace,
	key: string,
	value: unknown,
	ttlSeconds?: number,
) => {
	await kv.put(key, JSON.stringify(value),
		ttlSeconds ? { expirationTtl: ttlSeconds } : undefined);
};

export const deleteCacheKey = async (kv: KVNamespace, key: string) => {
	await kv.delete(key);
};
