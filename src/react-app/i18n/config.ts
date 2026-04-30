import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enAdmin from "./messages/en-US/admin.json";
import enAuth from "./messages/en-US/auth.json";
import enCommon from "./messages/en-US/common.json";
import enHome from "./messages/en-US/home.json";
import enUsers from "./messages/en-US/users.json";
import zhAdmin from "./messages/zh-CN/admin.json";
import zhAuth from "./messages/zh-CN/auth.json";
import zhCommon from "./messages/zh-CN/common.json";
import zhHome from "./messages/zh-CN/home.json";
import zhUsers from "./messages/zh-CN/users.json";
import { DEFAULT_LOCALE } from "./detector";

const resources = {
	"zh-CN": {
		common: zhCommon,
		home: zhHome,
		auth: zhAuth,
		users: zhUsers,
		admin: zhAdmin,
	},
	"en-US": {
		common: enCommon,
		home: enHome,
		auth: enAuth,
		users: enUsers,
		admin: enAdmin,
	},
} as const;

void i18n.use(initReactI18next).init({
	resources,
	lng: DEFAULT_LOCALE,
	fallbackLng: DEFAULT_LOCALE,
	defaultNS: "common",
	interpolation: {
		escapeValue: false,
	},
});

export { resources };
export default i18n;
