import type { AppLocale } from "@/i18n/types";

export interface NavigationItem {
	label: string;
	href: string;
}

export interface CtaLink {
	label: string;
	href: string;
}

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

export const siteMeta = {
	brandName: "童蒙家塾",
	brandSubtitle: "三代同堂家风家学实践",
	headerCta: { label: "开始了解", href: "#philosophy" },
};

export const siteNavigation: NavigationItem[] = [
	{ label: "家风家学·理念", href: "#philosophy" },
	{ label: "践行感悟·日思", href: "#daily" },
	{ label: "三代同堂·故事", href: "#stories" },
	{ label: "家庭共学·陪伴", href: "#colearning" },
	{ label: "知我", href: "#about" },
	// { label: "联系", href: "#contact" },
];

export const heroContent: HeroContent = {
	title: "三代同堂家风家学传承践行者",
	subtitle: "每个家庭都能有属于自己的童蒙家塾",
	descriptionLines: [
		"以经典润心，以家风养正，以家为塾，以行践学。",
		"立足三代同堂之根，传承中华家学之美，",
		"让每一户寻常人家，皆可自成书香童蒙。",
	],
	primaryCta: { label: "阅读理念", href: "#philosophy" },
	secondaryCta: { label: "认识小罗老师", href: "#about" },
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
	copyright: "© 2026 童蒙家塾 Tongmeng Family School. All rights reserved.",
	contactEmail: "contact@illumi-family.com",
	links: [
		{ label: "隐私政策（待补充）", href: "#" },
		{ label: "未成年人保护（待补充）", href: "#" },
		{ label: "版权声明（待补充）", href: "#" },
	] satisfies FooterLink[],
};

const siteMetaEn = {
	brandName: "Tongmeng Family School",
	brandSubtitle: "Three-generation family culture in practice",
	headerCta: { label: "Start Exploring", href: "#philosophy" },
};

const siteNavigationEn: NavigationItem[] = [
	{ label: "Philosophy", href: "#philosophy" },
	{ label: "Daily Notes", href: "#daily" },
	{ label: "Stories", href: "#stories" },
	{ label: "Co-learning", href: "#colearning" },
	{ label: "About", href: "#about" },
];

const heroContentEn: HeroContent = {
	title: "A three-generation practitioner of family values and learning",
	subtitle: "Every family can build its own Tongmeng Family School",
	descriptionLines: [
		"Root hearts in classics, nurture character through family culture.",
		"Stand on the foundation of three generations living together,",
		"and let ordinary homes become places of lifelong learning.",
	],
	primaryCta: { label: "Read the philosophy", href: "#philosophy" },
	secondaryCta: { label: "Meet Teacher Luo", href: "#about" },
	image: {
		src: "/images/background.png",
		alt: "Family portrait showing warm companionship and cultural inheritance.",
	},
};

const defaultHomeContentEn = {
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
	roles: ["Mother of three", "Family education practitioner", "Founder of Tongmeng Family School"],
	beliefs: [
		"The best education happens at home;",
		"The best private school is in everyday life.",
	],
	methodKeywords: ["Calmness", "Character", "Autonomy", "Co-learning"],
	closing:
		"Reject anxiety and utilitarian pressure. Practice education rooted in life, with warmth and depth.",
	portrait: {
		src: "/images/background.png",
		alt: "Family IP portrait of Tongmeng Family School.",
	},
};

const footerContentEn = {
	sloganLine1: "Your home is a school, your daily life is education.",
	sloganLine2: "Nurture character early, pass family values forward.",
	copyright: "© 2026 Tongmeng Family School. All rights reserved.",
	contactEmail: "contact@illumi-family.com",
	links: [
		{ label: "Privacy Policy (TBD)", href: "#" },
		{ label: "Minor Protection (TBD)", href: "#" },
		{ label: "Copyright Notice (TBD)", href: "#" },
	] satisfies FooterLink[],
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
		};
	}
	return {
		siteMeta,
		siteNavigation,
		heroContent,
		defaultHomeContent,
		aboutContent,
		footerContent,
	};
};
