import type { AppLocale } from "@/i18n/types";

export interface NavigationItem {
	label: string;
	sectionId: NavigationSectionId;
}

export interface CtaLink {
	label: string;
	href: string;
}

export type NavigationSectionId =
	| "section-home-main-video"
	| "section-home-origin"
	| "section-home-character-videos"
	| "section-home-family-stories"
	| "section-home-content-matrix"
	| "section-home-business";

export interface HeroContent {
	title: string;
	subtitle: string;
	descriptionLines: string[];
	primaryCta: CtaLink;
	secondaryCta: CtaLink;
	image: { src: string; alt: string };
}

export interface PhilosophyItem {
	title: string;
	description: string;
}

export interface DailyNoteItem {
	date: string;
	title: string;
	summary: string;
	tags: string[];
}

export interface StoryItem {
	title: string;
	summary: string;
	publishDate: string;
	duration: string;
	status: "published" | "coming_soon";
	link?: string;
}

export interface ColearningMethodItem {
	title: string;
	description: string;
}

export interface AboutContent {
	name: string;
	roles: string[];
	beliefs: string[];
	methodKeywords: string[];
	closing: string;
	portrait: { src: string; alt: string };
}

export interface FooterLink {
	label: string;
	href: string;
}

export interface HomeOriginContent {
	sectionId: NavigationSectionId;
	label: string;
	title: string;
	ipIntroHeading: string;
	brandVisionHeading: string;
	ipIntro: string[];
	brandVision: string[];
}

export interface HomeFamilyStoriesConfig {
	sectionId: NavigationSectionId;
	label: string;
	title: string;
	description: string;
	streamVideoIds: string[];
}

export interface ContentMatrixItem {
	platform: string;
	qrImageSrc: string;
	qrImageAlt: string;
}

export interface HomeContentMatrixContent {
	sectionId: NavigationSectionId;
	label: string;
	title: string;
	description: string;
	items: ContentMatrixItem[];
}

export interface HomeBusinessContactContent {
	sectionId: NavigationSectionId;
	label: string;
	title: string;
	description: string;
	phone: string;
	wechat: string;
	email: string;
}

export const siteMeta = {
	brandName: "童蒙家塾",
	brandSubtitle: "三代同堂家风家学实践",
	headerCta: { label: "开始了解", sectionId: "section-home-origin" as const },
};

export const siteNavigation: NavigationItem[] = [
	{ label: "家塾起源", sectionId: "section-home-origin" },
	{ label: "角色介绍", sectionId: "section-home-character-videos" },
	{ label: "家庭故事", sectionId: "section-home-family-stories" },
	{ label: "发现更多", sectionId: "section-home-content-matrix" },
	{ label: "联系方式", sectionId: "section-home-business" },
];

export const heroContent: HeroContent = {
	title: "三代同堂家风家学传承践行者",
	subtitle: "每个家庭都能有属于自己的童蒙家塾",
	descriptionLines: [
		"以经典润心，以家风养正，以家为塾，以行践学",
		"立足三代同堂之根，传承中华家学之美",
		"让每一户寻常人家，皆可自成书香童蒙",
	],
	primaryCta: { label: "阅读理念", href: "#" },
	secondaryCta: { label: "认识小罗老师", href: "#" },
	image: {
		src: "/images/background.png",
		alt: "童蒙家塾三代同堂家庭 IP 合照，展现温暖陪伴与家学传承。",
	},
};

export const philosophyIntro =
	"以经典为根，以家庭为塾，以静定为要，以养正为宗。童蒙养正，始于家庭；家风传承，始于日常。不追浮华，不逐功利，只做扎根生命的真教育。让每一个家庭，都成为滋养孩子一生的童蒙家塾。";

export const philosophyItems: PhilosophyItem[] = [
	{
		title: "静定",
		description:
			"先安顿家长与孩子的身心，再谈方法与效率，让家庭关系有稳定根基。",
	},
	{
		title: "养正",
		description:
			"以日常小事培养品格与边界感，让孩子在温润而坚定的秩序中成长。",
	},
	{
		title: "家塾",
		description:
			"把读书、习劳、感恩、自省融入一日生活，让家庭成为持续学习的场域。",
	},
];

export const dailyNotes: DailyNoteItem[] = [
	{
		date: "2026-03-05",
		title: "把“催促”变“共学”：晚饭后 20 分钟共读",
		summary:
			"今晚不讲大道理，只做一件小事：一起读 10 分钟经典，再各自复述一句触动的话。日常里的稳定节奏，比临时起意更能养成习惯。",
		tags: ["共读", "家庭节奏", "日常践行"],
	},
	{
		date: "2026-03-03",
		title: "情绪起伏时，先守住语气再谈规则",
		summary:
			"孩子闹情绪时，家长最先要做的是稳住自己的呼吸和语速。关系先被看见，规则才会被听见；先共情，再立界，最后再行动。",
		tags: ["情绪教养", "亲子沟通", "养正"],
	},
	{
		date: "2026-02-28",
		title: "周末家务轮值：让责任感在参与中长出来",
		summary:
			"不以结果完美为目标，而以“全家一起做”为目标。孩子参与择菜、收纳、摆桌，哪怕动作慢，也是在练习担当和合作。",
		tags: ["家庭劳动", "责任感", "三代同堂"],
	},
	{
		date: "2026-02-24",
		title: "睡前 5 分钟复盘：今天我们有没有彼此成全",
		summary:
			"每天睡前问三个问题：今天感谢谁、今天改进什么、明天先做哪件善事。日思不求多，只求真，慢慢把家风写进生活细节。",
		tags: ["自省", "感恩", "家风传承"],
	},
];

export const stories: StoryItem[] = [
	{
		title: "《一家人的晨光》：从晨读到晨劳的三代协同",
		summary:
			"记录祖辈、父母与孩子如何在清晨完成“读书-分工-互助”的节律，呈现家风在细节中的流动。",
		publishDate: "2026-02-18",
		duration: "08:24",
		status: "published",
		link: "#contact",
	},
	{
		title: "《节气饭桌课》：奶奶的二十四节气故事",
		summary:
			"以家庭饭桌为课堂，把节气、饮食与德行教育连接起来，帮助孩子在生活场景中理解传统文化。",
		publishDate: "2026-03-20",
		duration: "筹备中",
		status: "coming_soon",
	},
	{
		title: "《家书一封》：父母与孩子的双向表达练习",
		summary:
			"通过真实家书往来呈现家庭沟通的修复过程，展示“理解-边界-合作”的成长轨迹。",
		publishDate: "2026-04-10",
		duration: "筹备中",
		status: "coming_soon",
	},
];

export const colearningIntro =
	"以陪伴为灯，以共学为路，以成长为果。家长先成长，孩子自芬芳；家庭共进步，家风自绵长。";

export const colearningMethods: ColearningMethodItem[] = [
	{
		title: "共读共讲",
		description: "每周固定家庭共读，围绕一个主题做轮流复述与提问。",
	},
	{
		title: "共劳共担",
		description: "通过家务与协作任务建立责任感，让孩子在参与中练习自主。",
	},
	{
		title: "共省共进",
		description: "以周复盘记录家庭变化，用微调替代焦虑，用行动替代空谈。",
	},
];

export const colearningBenefits = [
	"降低家庭沟通摩擦，让规则与温度并行。",
	"提升孩子自主学习与生活管理能力。",
	"帮助家长形成可持续的教养方法，不被焦虑牵引。",
];

export const colearningCase = {
	title: "案例摘要｜四周家庭共学实验",
	summary:
		"一个普通四口之家，通过固定晚间共读 + 周末家庭议事 + 每日小复盘，四周后孩子的作息稳定度、表达意愿与家务参与度都明显提升。",
	cta: { label: "查看共学案例", href: "#contact" },
};

export const defaultHomeContent = {
	heroSlogan: {
		title: heroContent.title,
		subtitle: heroContent.subtitle,
	},
	featuredVideos: {
		main: {
			streamVideoId: "",
		},
		characters: {
			items: [],
		},
		familyStories: {
			items: [],
		},
	},
	philosophy: {
		intro: philosophyIntro,
		items: philosophyItems,
	},
	dailyNotes: {
		items: dailyNotes,
	},
	stories: {
		items: stories,
	},
	colearning: {
		intro: colearningIntro,
		methods: colearningMethods,
		benefits: colearningBenefits,
		caseHighlight: colearningCase,
	},
};

export const aboutContent: AboutContent = {
	name: "小罗老师",
	roles: ["三娃妈妈", "家庭教育践行者", "「童蒙家塾」家庭 IP 创始人"],
	beliefs: [
		"最好的教育不在校外，而在家中；",
		"最好的私塾不在远方，而在日常。",
	],
	methodKeywords: ["静定", "养正", "自主", "共学"],
	closing:
		"不焦虑、不内卷、不功利，只做扎根生命、温润心灵的真教育。愿与万千家庭同行：一人觉醒，一家书香，一门家学，三代传承。",
	portrait: {
		src: "/images/background.png",
		alt: "童蒙家塾主理人家庭 IP 形象。",
	},
};

export const footerContent = {
	sloganLine1: "自家即是家塾，日常即是教育。",
	sloganLine2: "童蒙养正，家风传世。",
	copyright: "© 2026 童蒙家塾 Illumi Family. All rights reserved.",
	contactEmail: "contact@illumi-family.com",
	links: [
		{ label: "隐私政策", href: "/legal/privacy" },
		{ label: "未成年人保护", href: "/legal/minor-protection" },
		{ label: "版权声明", href: "/legal/copyright" },
	] satisfies FooterLink[],
};

export const homeOriginContent: HomeOriginContent = {
	sectionId: "section-home-origin",
	label: "家塾起源",
	title: "IP 介绍与品牌愿景",
	ipIntroHeading: "IP 介绍",
	brandVisionHeading: "品牌愿景",
	ipIntro: [
		"童蒙家塾，起源于真实存在的传统文化传承之家，是以三代同堂的真实生活为原型，诞生的国风原创家庭 IP。",
		"本 IP 所有故事皆取材于家庭的日常点滴，全然源自真实的实生活轨迹。",
		"我们以家为塾、以学润心，承袭中华千年家风文脉，践行传统童蒙教养与东方生活哲思，并以原创系列动画为载体，温柔记录一家人修身立品、诗书传家、家学浸润、家风延续的日常片段。",
		"以经典润心、以家风养正、以家学启智、以践行立身。",
		"在烟火日常中沉淀底蕴，在朝夕相伴里传承美德，用治愈的动画影像，呈现当代中国式家庭的温润底色与家风家学传承之美。",
	],
	brandVision: [
		"童蒙家塾的家庭成员，浸润于传统文化的滋养之中，受益于优良家风与醇厚家学的影响。",
		"在长辈榜样带动与家庭成员共同学习之下，我们努力践行修身立德、和睦齐家之道。",
		"我们以家庭动画传递东方家道，承东方圣贤智慧，循「修身、齐家、治国、平天下」的理想，",
		"愿通过我们的微薄之力，推动中华家风浸润社会、促进优秀文化温润人心，一起守护孩童正向成长，",
		"促进社会和谐、家庭和美，共赴世宁人和的美好愿景。",
	],
};

export const homeFamilyStoriesConfig: HomeFamilyStoriesConfig = {
	sectionId: "section-home-family-stories",
	label: "家庭故事",
	title: "以家庭动画，记录真实成长轨迹",
	description: "展示形式与角色介绍保持一致，当前采用首页配置维护视频顺序。",
	streamVideoIds: [],
};

export const homeContentMatrixContent: HomeContentMatrixContent = {
	sectionId: "section-home-content-matrix",
	label: "发现更多",
	title: "多平台内容矩阵",
	description: "本期仅展示平台二维码，不提供点击跳转。",
	items: [
		{
			platform: "小红书",
			qrImageSrc: "/images/social/xhs.jpg",
			qrImageAlt: "童蒙家塾小红书二维码",
		},
		{
			platform: "B 站",
			qrImageSrc: "/images/social/bilibili.jpg",
			qrImageAlt: "童蒙家塾B站二维码",
		},
		{
			platform: "抖音",
			qrImageSrc: "/images/social/douyin.jpg",
			qrImageAlt: "童蒙家塾抖音二维码",
		},
		{
			platform: "微信视频号",
			qrImageSrc: "/images/social/wechat.jpg",
			qrImageAlt: "童蒙家塾微信视频号二维码",
		},
	],
};

export const homeBusinessContactContent: HomeBusinessContactContent = {
	sectionId: "section-home-business",
	label: "联系方式",
	title: "商务合作与联络方式",
	description: "欢迎品牌合作、内容合作与活动邀约。",
	phone: "13570380204",
	wechat: "13570380204",
	email: "contact@illumi-family.com",
};

const siteMetaEn = {
	brandName: "Illumi Family",
	brandSubtitle: "Three-generation family culture in practice",
	headerCta: { label: "Start Exploring", sectionId: "section-home-origin" as const },
};

const siteNavigationEn: NavigationItem[] = [
	{ label: "Origin", sectionId: "section-home-origin" },
	{ label: "Characters", sectionId: "section-home-character-videos" },
	{ label: "Family Stories", sectionId: "section-home-family-stories" },
	{ label: "Channels", sectionId: "section-home-content-matrix" },
	{ label: "Business", sectionId: "section-home-business" },
];

const heroContentEn: HeroContent = {
	title: "A three-generation practitioner of family values and learning",
	subtitle: "Every family can build its own Illumi Family",
	descriptionLines: [
		"Root hearts in classics, nurture character through family culture.",
		"Stand on the foundation of three generations living together,",
		"and let ordinary homes become places of lifelong learning.",
	],
	primaryCta: { label: "Read the origin", href: "#" },
	secondaryCta: { label: "Contact us", href: "#" },
	image: {
		src: "/images/background.png",
		alt: "Family portrait showing warm companionship and cultural inheritance.",
	},
};

const defaultHomeContentEn = {
	heroSlogan: {
		title: heroContentEn.title,
		subtitle: heroContentEn.subtitle,
	},
	featuredVideos: {
		main: {
			streamVideoId: "",
		},
		characters: {
			items: [],
		},
		familyStories: {
			items: [],
		},
	},
	philosophy: {
		intro:
			"Classics as roots, family as school, calmness as method, integrity as purpose. True education grows in daily family life.",
		items: [
			{
				title: "Calmness",
				description:
					"Stabilize parents and children before discussing methods or efficiency.",
			},
			{
				title: "Character",
				description:
					"Build boundaries and virtues through daily habits with warmth and consistency.",
			},
			{
				title: "Family School",
				description:
					"Integrate reading, responsibility, gratitude, and reflection into everyday life.",
			},
		],
	},
	dailyNotes: {
		items: [
			{
				date: "2026-03-05",
				title: "From urging to co-learning: 20 minutes after dinner",
				summary:
					"Read classics together for ten minutes, then each person shares one key takeaway.",
				tags: ["Co-reading", "Family rhythm", "Daily practice"],
			},
			{
				date: "2026-03-03",
				title: "When emotions rise, stabilize tone before rules",
				summary:
					"Connection comes first, then rules can be heard. Empathize, set boundaries, then act.",
				tags: ["Emotional coaching", "Parent-child communication", "Character"],
			},
			{
				date: "2026-02-28",
				title: "Weekend chores rotation grows responsibility",
				summary:
					"Focus on participation over perfection so children learn responsibility and cooperation.",
				tags: ["Family labor", "Responsibility", "Three generations"],
			},
			{
				date: "2026-02-24",
				title: "5-minute bedtime review for mutual growth",
				summary:
					"Ask three questions: gratitude, improvement, and tomorrow's first good deed.",
				tags: ["Reflection", "Gratitude", "Family values"],
			},
		],
	},
	stories: {
		items: [
			{
				title: "\"Morning Light of a Family\": reading and chores in sync",
				summary:
					"A story of grandparents, parents, and children building a steady morning rhythm.",
				publishDate: "2026-02-18",
				duration: "08:24",
				status: "published" as const,
				link: "#contact",
			},
			{
				title: "\"Solar-Term Table Class\": grandma's seasonal stories",
				summary:
					"Connect seasonal traditions, food, and moral education at the family table.",
				publishDate: "2026-03-20",
				duration: "In preparation",
				status: "coming_soon" as const,
			},
			{
				title: "\"A Letter Home\": two-way expression between parents and children",
				summary:
					"Real letters showing how understanding, boundaries, and collaboration are rebuilt.",
				publishDate: "2026-04-10",
				duration: "In preparation",
				status: "coming_soon" as const,
			},
		],
	},
	colearning: {
		intro:
			"Companionship lights the way, co-learning builds the path, growth becomes the result.",
		methods: [
			{
				title: "Read and explain together",
				description: "Weekly co-reading with rotating retell and questions.",
			},
			{
				title: "Work and share responsibility",
				description: "Use household tasks to build ownership and autonomy.",
			},
			{
				title: "Reflect and improve",
				description: "Track changes weekly and replace anxiety with small actions.",
			},
		],
		benefits: [
			"Reduce communication friction while keeping warmth and boundaries.",
			"Improve children's self-management in learning and life.",
			"Help parents build sustainable education methods.",
		],
		caseHighlight: {
			title: "Case Summary | 4-week family co-learning experiment",
			summary:
				"With fixed evening reading, weekend family meetings, and daily mini reviews, one family saw clear progress in routines and participation.",
			cta: { label: "View case", href: "#contact" },
		},
	},
};

const aboutContentEn: AboutContent = {
	name: "Teacher Xiao Luo",
	roles: ["Mother of three", "Family education practitioner", "Founder of Illumi Family"],
	beliefs: [
		"The best education happens at home;",
		"The best private school is in everyday life.",
	],
	methodKeywords: ["Calmness", "Character", "Autonomy", "Co-learning"],
	closing:
		"Reject anxiety and utilitarian pressure. Practice education rooted in life, with warmth and depth.",
	portrait: {
		src: "/images/background.png",
		alt: "Family IP portrait of Illumi Family.",
	},
};

const footerContentEn = {
	sloganLine1: "Your home is a school, your daily life is education.",
	sloganLine2: "Nurture character early, pass family values forward.",
	copyright: "© 2026 Illumi Family. All rights reserved.",
	contactEmail: "contact@illumi-family.com",
	links: [
		{ label: "Privacy Policy", href: "/legal/privacy" },
		{ label: "Minor Protection", href: "/legal/minor-protection" },
		{ label: "Copyright Notice", href: "/legal/copyright" },
	] satisfies FooterLink[],
};

const homeOriginContentEn: HomeOriginContent = {
	sectionId: "section-home-origin",
	label: "Origin",
	title: "IP Introduction and Brand Vision",
	ipIntroHeading: "IP Introduction",
	brandVisionHeading: "Brand Vision",
	ipIntro: [
		"Illumi Family originates from a real family rooted in traditional cultural inheritance, inspired by the real life of three generations living together.",
		"All stories in this IP come from everyday family moments and real-life trajectories.",
		"We take family as school and learning as nourishment, carrying forward Chinese family values through original animation narratives.",
		"Root hearts in classics, nurture character through family values, enlighten with family learning, and stand with practice.",
		"Through warm and healing animation, we present the gentle essence of contemporary Chinese family culture.",
	],
	brandVision: [
		"Our family members grow in the nourishment of traditional culture and benefit from fine family values and learning.",
		"Guided by elders and co-learning among family members, we practice self-cultivation, virtue, and family harmony.",
		"Through family animation, we carry Eastern wisdom and the ideal of cultivation, family order, governance, and harmony.",
		"We hope our modest effort can help family values nourish society and support healthy child growth.",
		"We aspire to social harmony and happy families.",
	],
};

const homeFamilyStoriesConfigEn: HomeFamilyStoriesConfig = {
	sectionId: "section-home-family-stories",
	label: "Family Stories",
	title: "Family Animations from Real Life",
	description: "Uses the same card layout as character videos, with order from homepage config.",
	streamVideoIds: [],
};

const homeContentMatrixContentEn: HomeContentMatrixContent = {
	sectionId: "section-home-content-matrix",
	label: "Content Matrix",
	title: "Multi-Platform Channels",
	description: "This phase shows QR codes only, without click-through links.",
	items: [
		{
			platform: "Xiaohongshu",
			qrImageSrc: "/images/social/xhs.jpg",
			qrImageAlt: "Illumi Family Xiaohongshu QR code",
		},
		{
			platform: "Bilibili",
			qrImageSrc: "/images/social/bilibili.jpg",
			qrImageAlt: "Illumi Family Bilibili QR code",
		},
		{
			platform: "Douyin",
			qrImageSrc: "/images/social/douyin.jpg",
			qrImageAlt: "Illumi Family Douyin QR code",
		},
		{
			platform: "WeChat Channels",
			qrImageSrc: "/images/social/wechat.jpg",
			qrImageAlt: "Illumi Family WeChat Channels QR code",
		},
	],
};

const homeBusinessContactContentEn: HomeBusinessContactContent = {
	sectionId: "section-home-business",
	label: "Business",
	title: "Business Contact",
	description: "For brand collaboration, content partnership, and event invitations.",
	phone: "13570380204",
	wechat: "13570380204",
	email: "contact@illumi-family.com",
};

export const getHomePageData = (locale: AppLocale) => {
	if (locale === "en-US") {
		return {
			siteMeta: siteMetaEn,
			siteNavigation: siteNavigationEn,
			heroContent: heroContentEn,
			defaultHomeContent: defaultHomeContentEn,
			aboutContent: aboutContentEn,
			footerContent: footerContentEn,
			homeOriginContent: homeOriginContentEn,
			homeFamilyStoriesConfig: homeFamilyStoriesConfigEn,
			homeContentMatrixContent: homeContentMatrixContentEn,
			homeBusinessContactContent: homeBusinessContactContentEn,
		};
	}
	return {
		siteMeta,
		siteNavigation,
		heroContent,
		defaultHomeContent,
		aboutContent,
		footerContent,
		homeOriginContent,
		homeFamilyStoriesConfig,
		homeContentMatrixContent,
		homeBusinessContactContent,
	};
};
