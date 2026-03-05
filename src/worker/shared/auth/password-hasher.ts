const HASH_ALGORITHM = "PBKDF2";
const HASH_DIGEST = "SHA-256";
const HASH_ITERATIONS = 12_000;
const SALT_BYTES = 16;
const DERIVED_BITS = 256;
const HASH_PREFIX = "pbkdf2";

const encodeBase64Url = (input: Uint8Array) =>
	btoa(String.fromCharCode(...input))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");

const decodeBase64Url = (input: string) => {
	const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
	const padded = normalized + "===".slice((normalized.length + 3) % 4);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
};

const textEncoder = new TextEncoder();

const deriveHash = async (
	password: string,
	salt: Uint8Array,
	iterations: number,
) => {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		textEncoder.encode(password),
		{ name: HASH_ALGORITHM },
		false,
		["deriveBits"],
	);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: HASH_ALGORITHM,
			hash: HASH_DIGEST,
			salt,
			iterations,
		},
		keyMaterial,
		DERIVED_BITS,
	);

	return new Uint8Array(derivedBits);
};

const timingSafeEqual = (left: Uint8Array, right: Uint8Array) => {
	if (left.length !== right.length) return false;
	let mismatch = 0;
	for (let index = 0; index < left.length; index += 1) {
		mismatch |= left[index] ^ right[index];
	}
	return mismatch === 0;
};

export const hashPassword = async (password: string) => {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const hash = await deriveHash(password, salt, HASH_ITERATIONS);
	return `${HASH_PREFIX}$${HASH_ITERATIONS}$${encodeBase64Url(
		salt,
	)}$${encodeBase64Url(hash)}`;
};

export const verifyPassword = async (input: {
	hash: string;
	password: string;
}) => {
	const [prefix, iterationsText, saltText, digestText] = input.hash.split("$");
	if (
		prefix !== HASH_PREFIX ||
		!iterationsText ||
		!saltText ||
		!digestText
	) {
		return false;
	}

	const iterations = Number(iterationsText);
	if (!Number.isInteger(iterations) || iterations <= 0) {
		return false;
	}

	const salt = decodeBase64Url(saltText);
	const expected = decodeBase64Url(digestText);
	const actual = await deriveHash(input.password, salt, iterations);
	return timingSafeEqual(actual, expected);
};
