const MOBILE_MEDIA_QUERY = "(max-width: 1023px)";

const normalizeUrl = (raw: string) => {
	try {
		const parsed = new URL(raw);
		parsed.hash = "";
		return parsed.toString();
	} catch {
		return raw;
	}
};

export const isMobileViewport = () => {
	if (typeof window === "undefined") return false;
	if (typeof window.matchMedia !== "function") return false;
	return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
};

export const resolveCanonicalShareUrl = () => {
	if (typeof window === "undefined") return "";
	return normalizeUrl(window.location.href);
};

const fallbackCopy = async (text: string) => {
	if (typeof document === "undefined") return false;
	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.setAttribute("readonly", "true");
	textarea.style.position = "fixed";
	textarea.style.opacity = "0";
	textarea.style.pointerEvents = "none";
	document.body.appendChild(textarea);
	textarea.select();
	textarea.setSelectionRange(0, textarea.value.length);
	let copied = false;
	try {
		copied = document.execCommand("copy");
	} catch {
		copied = false;
	}
	document.body.removeChild(textarea);
	return copied;
};

export const copyTextToClipboard = async (text: string) => {
	if (!text) return false;
	try {
		if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {
		return fallbackCopy(text);
	}
	return fallbackCopy(text);
};
