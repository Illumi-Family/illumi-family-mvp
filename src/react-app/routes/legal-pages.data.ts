import type { AppLocale } from "@/i18n/types";

export type LegalPageKey = "privacy" | "minorProtection" | "copyright";

export interface LegalPageSection {
	heading: string;
	body: string;
}

export interface LegalPageContent {
	title: string;
	summary: string;
	version: string;
	effectiveDate: string;
	lastUpdated: string;
	reviewNotice: string;
	contactEmail: string;
	backToHomeLabel: string;
	sections: LegalPageSection[];
}

type LocalizedLegalPages = Record<LegalPageKey, LegalPageContent>;

const zhPages: LocalizedLegalPages = {
	privacy: {
		title: "隐私政策",
		summary:
			"我们依据《个人信息保护法》及相关法律法规，在合法、正当、必要、诚信原则下处理个人信息。",
		version: "v1.0",
		effectiveDate: "2026-05-01",
		lastUpdated: "2026-05-01",
		reviewNotice: "正式发布版本。",
		contactEmail: "contact@illumi-family.com",
		backToHomeLabel: "返回首页",
		sections: [
			{
				heading: "1. 处理依据与基本原则",
				body: "我们依据《个人信息保护法》及相关法律法规处理个人信息，并遵循合法、正当、必要、诚信、公开透明原则。",
			},
			{
				heading: "2. 我们收集的信息",
				body: "我们可能收集您主动提供的信息（如联系邮箱、合作咨询内容）、访问设备与日志信息（如浏览器类型、访问时间、页面路径）、以及您在同意后提供的互动反馈信息。",
			},
			{
				heading: "3. 我们如何使用信息",
				body: "用于页面展示优化、内容服务改进、咨询沟通回复、以及安全风控与异常排查。",
			},
			{
				heading: "4. Cookie 与类似技术",
				body: "我们可能使用 Cookie 或本地存储提升站点体验；您可通过浏览器设置管理或清除相关数据。",
			},
			{
				heading: "5. 信息共享与第三方服务",
				body: "除法律法规要求或经您授权外，我们不会向无关第三方出售个人信息。若使用第三方基础服务（如内容分发、托管与安全服务），将要求其履行相应的数据保护义务。",
			},
			{
				heading: "6. 信息存储与保护",
				body: "我们采取合理的技术和管理措施保护信息安全，并在达到目的后按最短必要期限保存数据。",
			},
			{
				heading: "7. 您的权利",
				body: "您可申请访问、更正、删除相关个人信息，或撤回已授权同意。可通过本政策提供的联系方式与我们联系。",
			},
			{
				heading: "8. 未成年人信息保护",
				body: "对于不满十四周岁未成年人的个人信息处理，我们将遵循相关法律要求并在必要时取得监护人同意。",
			},
			{
				heading: "9. 政策更新与通知",
				body: "本政策更新后将以页面更新时间提示。重大变更将通过显著方式说明。",
			},
		],
	},
	minorProtection: {
		title: "未成年人保护说明",
		summary:
			"我们依据《未成年人网络保护条例》坚持“最有利于未成年人”原则，致力于营造健康、积极、适龄的网络内容环境。",
		version: "v1.0",
		effectiveDate: "2026-05-01",
		lastUpdated: "2026-05-01",
		reviewNotice: "正式发布版本。",
		contactEmail: "contact@illumi-family.com",
		backToHomeLabel: "返回首页",
		sections: [
			{
				heading: "1. 适用范围",
				body: "本说明适用于访问和使用本站内容的未成年人及其监护人。",
			},
			{
				heading: "2. 内容发布原则",
				body: "我们优先提供家庭教育、传统文化与正向成长内容，避免传播不适宜未成年人身心发展的信息。",
			},
			{
				heading: "3. 互动与评论安全",
				body: "若开放互动功能，我们将建立不良信息处理机制，对侮辱、欺凌、诱导等内容进行处置。",
			},
			{
				heading: "4. 未成年人个人信息保护",
				body: "我们尽量减少未成年人信息收集；涉及不满十四周岁的信息处理时，将遵循监护人同意等法定要求。",
			},
			{
				heading: "5. 监护人协同机制",
				body: "监护人可通过邮箱联系平台，申请查询、删除相关信息或反馈内容风险问题。",
			},
			{
				heading: "6. 健康使用倡议",
				body: "建议未成年人在监护人指导下合理安排上网时间，平衡学习、休息与运动。",
			},
			{
				heading: "7. 举报与应急",
				body: "发现涉及未成年人风险内容，请发送至 contact@illumi-family.com，并提供链接、问题说明、联系方式等信息，我们将尽快核查处理。",
			},
		],
	},
	copyright: {
		title: "版权声明",
		summary:
			"本站内容受《著作权法》及相关法律保护。未经授权，不得擅自复制、传播或用于商业用途。",
		version: "v1.0",
		effectiveDate: "2026-05-01",
		lastUpdated: "2026-05-01",
		reviewNotice: "正式发布版本。",
		contactEmail: "contact@illumi-family.com",
		backToHomeLabel: "返回首页",
		sections: [
			{
				heading: "1. 权利归属",
				body: "本站原创文字、图片、音视频、角色形象与排版设计等内容，著作权归童蒙家塾或相关权利人所有。",
			},
			{
				heading: "2. 授权使用规则",
				body: "非商业转载需保留完整来源与版权标识；商业使用须提前取得书面授权。",
			},
			{
				heading: "3. 第三方素材说明",
				body: "若页面含第三方授权素材，我们将在可行范围内标注来源或授权说明；相应权利归原权利人所有。",
			},
			{
				heading: "4. 侵权投诉通道",
				body: "权利人可发送投诉材料至 contact@illumi-family.com，至少包含权属证明、侵权链接、身份证明与联系方式。",
			},
			{
				heading: "5. 处理流程",
				body: "我们在核实后将采取删除、断链或限制传播等必要措施；对重复侵权行为保留进一步处理权利。",
			},
			{
				heading: "6. 免责声明",
				body: "用户上传或外链内容由提供方承担相应责任；平台在法律允许范围内履行合理注意义务。",
			},
		],
	},
};

const enPages: LocalizedLegalPages = {
	privacy: {
		title: "Privacy Policy",
		summary:
			"We process personal information in accordance with applicable laws and regulations, following lawfulness, fairness, necessity, and good faith.",
		version: "v1.0",
		effectiveDate: "2026-05-01",
		lastUpdated: "2026-05-01",
		reviewNotice: "Official release version.",
		contactEmail: "contact@illumi-family.com",
		backToHomeLabel: "Back to Home",
		sections: [
			{
				heading: "1. Legal Basis and Principles",
				body: "We process personal information in accordance with applicable laws and regulations and follow the principles of lawfulness, fairness, necessity, good faith, and transparency.",
			},
			{
				heading: "2. Information We Collect",
				body: "We may collect information you provide directly (such as contact email and business inquiry details), browsing and device logs, and feedback information submitted with consent.",
			},
			{
				heading: "3. How We Use Information",
				body: "We use data to improve site experience, optimize content services, respond to inquiries, and support security and risk controls.",
			},
			{
				heading: "4. Cookies and Similar Technologies",
				body: "We may use cookies or local storage to improve user experience. You can manage or clear related data through browser settings.",
			},
			{
				heading: "5. Sharing and Third-Party Services",
				body: "Unless required by law or authorized by you, we do not sell personal information to unrelated third parties. Third-party infrastructure providers are required to fulfill applicable data protection obligations.",
			},
			{
				heading: "6. Data Retention and Security",
				body: "We apply reasonable technical and organizational measures to protect data and keep information only for the minimum period required to fulfill legitimate purposes.",
			},
			{
				heading: "7. Your Rights",
				body: "You may request access, correction, or deletion of relevant personal information, or withdraw previously granted consent through our contact channel.",
			},
			{
				heading: "8. Children's Data",
				body: "For personal information processing involving children under 14, we follow applicable legal requirements and obtain guardian consent when required.",
			},
			{
				heading: "9. Policy Updates",
				body: "Policy updates will be reflected by the page update date. Significant changes will be highlighted in a prominent manner.",
			},
		],
	},
	minorProtection: {
		title: "Minor Protection Statement",
		summary:
			"We follow the principle of acting in the best interests of minors and strive to provide a safe and age-appropriate content environment.",
		version: "v1.0",
		effectiveDate: "2026-05-01",
		lastUpdated: "2026-05-01",
		reviewNotice: "Official release version.",
		contactEmail: "contact@illumi-family.com",
		backToHomeLabel: "Back to Home",
		sections: [
			{
				heading: "1. Scope",
				body: "This statement applies to minors and their guardians who access and use site content.",
			},
			{
				heading: "2. Content Standards",
				body: "We prioritize family education, traditional culture, and positive growth content, and avoid distributing information that may harm minors' physical or mental development.",
			},
			{
				heading: "3. Interaction Safety",
				body: "When interactive features are enabled, we maintain moderation mechanisms to handle bullying, abuse, inducement, and other harmful content.",
			},
			{
				heading: "4. Children's Information Protection",
				body: "We minimize data collection from minors. For children under 14, we follow legal requirements including guardian consent where applicable.",
			},
			{
				heading: "5. Guardian Collaboration",
				body: "Guardians may contact us by email to request data inquiries, deletion requests, or report content risks.",
			},
			{
				heading: "6. Healthy Use Guidance",
				body: "We encourage minors to use online services under guardian guidance and maintain a healthy balance between study, rest, and exercise.",
			},
			{
				heading: "7. Reporting and Emergency Contact",
				body: "If you identify content that may pose risks to minors, contact contact@illumi-family.com and provide links, issue details, and contact information for prompt review.",
			},
		],
	},
	copyright: {
		title: "Copyright Notice",
		summary:
			"Content on this site is protected by copyright and related laws. Unauthorized copying, distribution, or commercial use is prohibited.",
		version: "v1.0",
		effectiveDate: "2026-05-01",
		lastUpdated: "2026-05-01",
		reviewNotice: "Official release version.",
		contactEmail: "contact@illumi-family.com",
		backToHomeLabel: "Back to Home",
		sections: [
			{
				heading: "1. Ownership",
				body: "Original text, images, audio/video, character designs, and layout assets on this site are owned by Illumi Family or the relevant rights holders.",
			},
			{
				heading: "2. Usage and License",
				body: "Non-commercial reposting must preserve full attribution and copyright notices. Commercial usage requires prior written authorization.",
			},
			{
				heading: "3. Third-Party Materials",
				body: "When third-party licensed assets are included, we provide source or license notes where reasonably possible. Rights remain with original rights holders.",
			},
			{
				heading: "4. Infringement Reporting",
				body: "Rights holders may submit claims to contact@illumi-family.com with proof of ownership, infringing links, and contact details.",
			},
			{
				heading: "5. Handling Process",
				body: "After verification, we may remove, de-link, or restrict distribution as necessary. We reserve the right to take further action against repeated infringement.",
			},
			{
				heading: "6. Disclaimer",
				body: "User-uploaded or externally linked content remains the responsibility of its provider. The platform fulfills reasonable duty of care within legal boundaries.",
			},
		],
	},
};

const LEGAL_PAGES_BY_LOCALE: Record<AppLocale, LocalizedLegalPages> = {
	"zh-CN": zhPages,
	"en-US": enPages,
};

export const getLegalPageContent = (
	locale: AppLocale,
	pageKey: LegalPageKey,
): LegalPageContent => {
	const pages = LEGAL_PAGES_BY_LOCALE[locale] ?? zhPages;
	return pages[pageKey];
};
