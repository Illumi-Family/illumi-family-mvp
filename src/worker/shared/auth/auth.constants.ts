export const AUTH_BASE_PATH = "/api/auth";
export const CREDENTIAL_PROVIDER_ID = "credential";

export const APP_IDENTITY_PROVIDER = {
	EMAIL: "email",
	GOOGLE: "google",
	PHONE: "phone",
	WECHAT: "wechat",
} as const;

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const toAppProvider = (providerId: string) => {
	if (providerId === CREDENTIAL_PROVIDER_ID) return APP_IDENTITY_PROVIDER.EMAIL;
	if (providerId === APP_IDENTITY_PROVIDER.GOOGLE)
		return APP_IDENTITY_PROVIDER.GOOGLE;
	return providerId;
};
