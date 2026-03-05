export type HomeIconKey =
	| "book-open"
	| "sparkles"
	| "heart-handshake"
	| "graduation-cap"
	| "scroll-text"
	| "video"
	| "shield"
	| "calendar"
	| "users"
	| "file-text";

export interface NavigationItem {
	label: string;
	href: string;
}

export interface SiteStat {
	label: string;
	value: string;
	description: string;
}

export interface ColumnItem {
	title: string;
	description: string;
	tags: string[];
	icon: HomeIconKey;
}

export interface ContentCardItem {
	title: string;
	summary: string;
	keyPoints: string[];
	column: string;
	ageGroup: string;
	scene: string;
	publishedAt: string;
}

export interface LegacyVideoItem {
	title: string;
	summary: string;
	publishDate: string;
	status: "linked" | "placeholder";
}

export interface TrustItem {
	title: string;
	description: string;
	icon: HomeIconKey;
}

export interface ActionCard {
	title: string;
	description: string;
	actionLabel: string;
	note: string;
	icon: HomeIconKey;
}

export const siteNavigation: NavigationItem[] = [
	{ label: "首页", href: "#home" },
	{ label: "栏目", href: "#columns" },
	{ label: "最新内容", href: "#latest" },
	{ label: "旧视频号", href: "#archive" },
	{ label: "关于我们", href: "#about" },
	{ label: "合作联系", href: "#contact" },
	{ label: "法律声明", href: "#legal" },
];

export const siteStats: SiteStat[] = [
	{ label: "累计内容", value: "186+", description: "图文/视频主题条目（示例数据）" },
	{ label: "服务家庭", value: "1,240+", description: "家庭教育咨询触达（示例数据）" },
	{ label: "方法清单", value: "42", description: "可执行清单模板（示例数据）" },
];

export const columns: ColumnItem[] = [
	{
		title: "主理人理念",
		description: "从真实家庭实践出发，讲清教育底层逻辑与边界。",
		tags: ["价值观", "长期主义", "亲子关系"],
		icon: "sparkles",
	},
	{
		title: "每日分享",
		description: "短小、可立即执行的家庭教育微行动与提醒。",
		tags: ["今日可做", "家庭习惯", "轻任务"],
		icon: "book-open",
	},
	{
		title: "家庭故事",
		description: "真实案例拆解，强调方法复制，不强调天赋神话。",
		tags: ["真实案例", "反思记录", "家长视角"],
		icon: "heart-handshake",
	},
	{
		title: "教育方法",
		description: "把抽象理念拆成步骤、清单和家庭协同流程。",
		tags: ["步骤化", "可复用", "操作系统"],
		icon: "graduation-cap",
	},
	{
		title: "传统文化小课",
		description: "用儿童友好方式连接经典与当代生活。",
		tags: ["启蒙", "经典阅读", "生活化"],
		icon: "scroll-text",
	},
];

export const latestContentCards: ContentCardItem[] = [
	{
		title: "孩子总是拖延写作业？先从“十分钟启动法”开始",
		summary:
			"通过环境重置、计时器和任务切片，帮助孩子从“抗拒”转到“可开始”。",
		keyPoints: ["先启动再优化", "任务切小块", "家长只给结构不夺权"],
		column: "教育方法",
		ageGroup: "小学 1-4 年级",
		scene: "放学后作业时段",
		publishedAt: "2026-03-03",
	},
	{
		title: "当亲子冲突升级时：三句降温话术模板",
		summary:
			"将“对抗”转为“协同”，避免羞辱与贴标签，保持关系安全感。",
		keyPoints: ["先共情", "再边界", "最后共创下一步"],
		column: "每日分享",
		ageGroup: "幼儿园-小学",
		scene: "情绪冲突",
		publishedAt: "2026-03-01",
	},
	{
		title: "家庭晨间流程卡：让孩子从催促模式走向自主管理",
		summary:
			"把起床、洗漱、早餐、出门拆成可视化流程，逐周降低家长介入。",
		keyPoints: ["可视化流程", "一周一小步", "复盘优先于责备"],
		column: "家庭故事",
		ageGroup: "幼儿园大班-小学",
		scene: "晨间流程",
		publishedAt: "2026-02-28",
	},
	{
		title: "传统文化小课：用“家风故事”建立孩子的规则感",
		summary:
			"以家庭故事代替说教，帮助孩子理解规则背后的意义与情感连接。",
		keyPoints: ["故事先行", "规则有温度", "鼓励表达与复述"],
		column: "传统文化小课",
		ageGroup: "小学全年级",
		scene: "晚间亲子共读",
		publishedAt: "2026-02-26",
	},
];

export const legacyVideoItems: LegacyVideoItem[] = [
	{
		title: "习惯培养不是打卡：先建立家庭节奏",
		summary: "来源：微信视频号历史内容，现提供归档入口。",
		publishDate: "2025-12-18",
		status: "linked",
	},
	{
		title: "如何和孩子讨论“输赢”而不伤害自尊",
		summary: "来源：微信视频号历史内容，链接整理中。",
		publishDate: "2025-11-05",
		status: "placeholder",
	},
	{
		title: "亲子陪伴中的边界感：爱与规则并不冲突",
		summary: "来源：微信视频号历史内容，现提供归档入口。",
		publishDate: "2025-09-23",
		status: "linked",
	},
];

export const trustItems: TrustItem[] = [
	{
		title: "前台 IP，后台公司",
		description: "保持真实教育理念，同时推进品牌化与合规化建设。",
		icon: "users",
	},
	{
		title: "未成年人隐私保护",
		description: "案例默认匿名化，敏感信息不展示，授权状态全程可追踪。",
		icon: "shield",
	},
	{
		title: "内容结构化沉淀",
		description: "图文主导、视频补充，支持后续多平台分发与自动化流程。",
		icon: "file-text",
	},
];

export const actionCards: ActionCard[] = [
	{
		title: "领取资料包",
		description: "获取《家庭教育一周行动清单》与执行模板。",
		actionLabel: "立即领取",
		note: "【待补充】表单工具与领取流程",
		icon: "book-open",
	},
	{
		title: "预约咨询",
		description: "提交家庭情况，预约 1v1 初步沟通。",
		actionLabel: "申请预约",
		note: "【待补充】服务类型与排期机制",
		icon: "calendar",
	},
	{
		title: "商务合作",
		description: "机构合作、媒体合作、联名活动等合作入口。",
		actionLabel: "联系合作",
		note: "【待补充】SLA 与联系人机制",
		icon: "heart-handshake",
	},
];

