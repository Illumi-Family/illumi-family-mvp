import type { LucideIcon } from "lucide-react";
import {
	ArrowRight,
	BookOpenCheck,
	CalendarCheck2,
	FileText,
	GraduationCap,
	HeartHandshake,
	LibraryBig,
	ScrollText,
	ShieldCheck,
	Sparkles,
	UsersRound,
	Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	actionCards,
	columns,
	latestContentCards,
	legacyVideoItems,
	siteNavigation,
	siteStats,
	trustItems,
	type HomeIconKey,
} from "@/routes/home-page.data";

const iconMap: Record<HomeIconKey, LucideIcon> = {
	"book-open": BookOpenCheck,
	sparkles: Sparkles,
	"heart-handshake": HeartHandshake,
	"graduation-cap": GraduationCap,
	"scroll-text": ScrollText,
	video: Video,
	shield: ShieldCheck,
	calendar: CalendarCheck2,
	users: UsersRound,
	"file-text": FileText,
};

interface SectionHeadingProps {
	label: string;
	title: string;
	description: string;
	id?: string;
}

function SectionHeading({ label, title, description, id }: SectionHeadingProps) {
	return (
		<div className="space-y-3">
			<Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
				{label}
			</Badge>
			<h2 id={id} className="font-brand text-2xl text-[#2a2118] md:text-3xl">
				{title}
			</h2>
			<p className="max-w-3xl text-sm leading-relaxed text-[#5e4f41] md:text-base">
				{description}
			</p>
		</div>
	);
}

export function HomePage() {
	return (
		<div id="home" className="relative isolate min-h-screen overflow-x-clip">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(238,205,162,0.55),transparent_45%),radial-gradient(circle_at_90%_8%,rgba(246,224,193,0.7),transparent_38%),linear-gradient(180deg,#f8f3ec_0%,#fefbf7_55%,#fffdf9_100%)]"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(transparent_95%,rgba(137,112,84,0.08)_96%,transparent_100%)] bg-[size:100%_28px]"
			/>

			<header className="sticky top-3 z-30 px-3 md:px-6">
				<div className="mx-auto mt-2 flex w-full max-w-7xl items-center justify-between rounded-2xl border border-[#d9c8b4] bg-[#fffaf2]/85 px-4 py-3 shadow-[0_14px_38px_rgba(87,62,36,0.13)] backdrop-blur-md">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-[#f2dfca] text-[#71462a]">
							<LibraryBig className="size-5" aria-hidden="true" />
						</div>
						<div>
							<p className="font-brand text-base text-[#2a2118] md:text-lg">童蒙家塾</p>
							<p className="text-xs text-[#7a6755]">家庭教育内容源站（MVP）</p>
						</div>
					</div>

					<nav className="hidden items-center gap-1 lg:flex" aria-label="主导航">
						{siteNavigation.map((item) => (
							<a
								key={item.href}
								href={item.href}
								className="cursor-pointer rounded-full px-3 py-2 text-sm text-[#5b4a3b] transition-colors duration-200 hover:bg-[#efe1d0] hover:text-[#2b2118] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f6d4f]"
							>
								{item.label}
							</a>
						))}
					</nav>

					<Button
						type="button"
						className="rounded-full bg-[#8f5b39] px-5 text-[#fff8f2] hover:bg-[#7f4f30]"
					>
						加入企微
					</Button>
				</div>
				<nav
					className="mx-auto mt-2 flex w-full max-w-7xl gap-2 overflow-x-auto rounded-xl border border-[#dbc9b6] bg-[#fffaf2]/88 px-3 py-2 lg:hidden"
					aria-label="移动端快捷导航"
				>
					{siteNavigation.map((item) => (
						<a
							key={`mobile-${item.href}`}
							href={item.href}
							className="cursor-pointer whitespace-nowrap rounded-full bg-[#f3e5d5] px-3 py-1.5 text-xs text-[#5a4737] transition-colors duration-200 hover:bg-[#ead5bd] hover:text-[#2b2118]"
						>
							{item.label}
						</a>
					))}
				</nav>
			</header>

			<main
				id="main-content"
				className="mx-auto w-full max-w-7xl space-y-20 px-4 pb-24 pt-8 md:px-8"
			>
				<section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
					<div className="space-y-6 motion-enter" style={{ animationDelay: "80ms" }}>
						<Badge className="rounded-full bg-[#f0d5b3] px-3 py-1 text-[#5e3b24]">
							孩子自学系统 × 家庭教育操作系统
						</Badge>
						<div className="space-y-4">
							<h1 className="font-brand text-4xl leading-tight text-[#231a11] md:text-6xl">
								把家庭教育经验，沉淀成可执行的方法系统
							</h1>
							<p className="max-w-2xl text-base leading-relaxed text-[#5f4f42] md:text-lg">
								我们聚焦幼儿园至小学家庭，提供温和、正向、可执行的教育内容，
								让家长在真实生活中，用更短路径找到可落地方案。
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<Button
								type="button"
								className="rounded-full bg-[#8f5b39] px-6 text-[#fff9f3] hover:bg-[#7c4e31]"
							>
								领取资料包
								<ArrowRight aria-hidden="true" />
							</Button>
							<Button
								type="button"
								variant="outline"
								className="rounded-full border-[#cdb79f] bg-[#fffaf4] px-6 text-[#4f3d2f] hover:bg-[#f3e6d8]"
							>
								预约咨询
							</Button>
						</div>

						<p className="text-xs text-[#846f5a]">
							说明：页面内联系方式与留资流程为演示数据，后续可直接替换为真实配置。
						</p>

						<div className="grid gap-3 sm:grid-cols-3">
							{siteStats.map((item, index) => (
								<Card
									key={item.label}
									className="motion-enter border-[#dbc8b4] bg-[#fffaf5] shadow-[0_8px_24px_rgba(110,82,55,0.08)]"
									style={{ animationDelay: `${180 + index * 80}ms` }}
								>
									<CardHeader className="space-y-1 p-4">
										<p className="text-xs text-[#7d6a57]">{item.label}</p>
										<p className="font-brand text-2xl text-[#2c2218]">{item.value}</p>
									</CardHeader>
									<CardContent className="p-4 pt-0">
										<p className="text-xs leading-relaxed text-[#6a5846]">
											{item.description}
										</p>
									</CardContent>
								</Card>
							))}
						</div>
					</div>

					<div
						className="relative overflow-hidden rounded-[2rem] border border-[#d6c0a9] bg-[linear-gradient(145deg,#fff8ef_0%,#f8e8d7_100%)] p-6 shadow-[0_20px_52px_rgba(94,69,45,0.2)] motion-enter md:p-8"
						style={{ animationDelay: "140ms" }}
					>
						<div className="absolute -right-10 -top-10 size-28 rounded-full bg-[#f3cfa0]/70 blur-2xl" />
						<div className="absolute -bottom-12 left-6 size-32 rounded-full bg-[#eed9c1]/80 blur-2xl" />
						<div className="relative space-y-5">
							<p className="text-xs uppercase tracking-[0.2em] text-[#81644a]">
								MVP 信息架构
							</p>
							<h3 className="font-brand text-3xl leading-tight text-[#2f2217]">
								图文优先，视频补充
							</h3>
								<p className="text-sm leading-relaxed text-[#5f4f3f]">
									首页聚合栏目入口、最新内容与转化路径，保证“浏览内容 -&gt; 建立信任
									-&gt; 留资/加企微”的闭环可见。
								</p>
							<div className="space-y-3 rounded-2xl border border-[#cfb69e] bg-[#fffdf9]/75 p-4">
								{["栏目页", "内容详情", "旧视频号归档", "案例库空态", "法律声明"].map(
									(item) => (
										<div
											key={item}
											className="flex items-center justify-between rounded-lg border border-[#ead8c6] bg-[#fffaf4] px-3 py-2 text-sm text-[#503d2f]"
										>
											<span>{item}</span>
											<ArrowRight className="size-4 text-[#8d6b4f]" aria-hidden="true" />
										</div>
									),
								)}
							</div>
						</div>
					</div>
				</section>

				<section id="columns" className="space-y-8">
					<SectionHeading
						label="栏目入口"
						title="围绕家庭场景组织内容，而不是堆叠技巧"
						description="MVP 阶段以五大栏目承载内容沉淀，优先图文卡片体验，保留后续画廊/瀑布流拓展空间。"
					/>
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{columns.map((item, index) => {
							const Icon = iconMap[item.icon];
							return (
								<Card
									key={item.title}
									className="motion-enter border-[#d8c5af] bg-[#fffaf4] shadow-[0_10px_30px_rgba(109,81,53,0.08)] transition-colors duration-200 hover:border-[#bf9f82] hover:bg-[#fff7ee]"
									style={{ animationDelay: `${120 + index * 70}ms` }}
								>
									<CardHeader className="space-y-3">
										<div className="flex items-center gap-2">
											<div className="rounded-lg bg-[#f1e0cb] p-2 text-[#734e32]">
												<Icon className="size-4" aria-hidden="true" />
											</div>
											<CardTitle className="font-brand text-xl text-[#2d2218]">
												{item.title}
											</CardTitle>
										</div>
										<p className="text-sm leading-relaxed text-[#625142]">
											{item.description}
										</p>
									</CardHeader>
									<CardContent className="space-y-3 pt-0">
										<div className="flex flex-wrap gap-2">
											{item.tags.map((tag) => (
												<Badge
													key={tag}
													variant="outline"
													className="border-[#d4bea4] bg-[#fffaf4] text-[#725d4a]"
												>
													{tag}
												</Badge>
											))}
										</div>
										<Button
											type="button"
											variant="ghost"
											className="cursor-pointer px-0 text-[#744f35] hover:bg-transparent hover:text-[#5d3c24]"
										>
											进入栏目
											<ArrowRight aria-hidden="true" />
										</Button>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</section>

				<section id="latest" className="space-y-8">
					<SectionHeading
						label="最新内容"
						title="每篇内容都按“摘要 + 要点 + 场景”组织"
						description="与后续内容详情模板语义一致：标题、摘要、要点、标签、固定底部 CTA。当前为演示数据。"
					/>
					<div className="grid gap-4 lg:grid-cols-2">
						{latestContentCards.map((item, index) => (
							<Card
								key={item.title}
								className="motion-enter border-[#d8c5af] bg-[#fffdf8] shadow-[0_10px_34px_rgba(95,74,51,0.08)]"
								style={{ animationDelay: `${120 + index * 70}ms` }}
							>
								<CardHeader className="space-y-4">
									<div className="flex flex-wrap gap-2">
										<Badge variant="secondary" className="bg-[#f2ddc4] text-[#6a472f]">
											{item.column}
										</Badge>
										<Badge
											variant="outline"
											className="border-[#d3b99e] bg-[#fffaf5] text-[#705845]"
										>
											{item.ageGroup}
										</Badge>
									</div>
									<CardTitle className="font-brand text-2xl leading-snug text-[#2a2118]">
										{item.title}
									</CardTitle>
									<p className="text-sm leading-relaxed text-[#5f4e3f]">{item.summary}</p>
								</CardHeader>
								<CardContent className="space-y-4 pt-0">
									<ul className="space-y-2 text-sm text-[#5d4d3f]">
										{item.keyPoints.map((point) => (
											<li key={point} className="flex items-start gap-2">
												<span
													className="mt-[6px] size-1.5 rounded-full bg-[#9a7150]"
													aria-hidden="true"
												/>
												<span>{point}</span>
											</li>
										))}
									</ul>
									<div className="flex items-center justify-between text-xs text-[#7a6756]">
										<span>场景：{item.scene}</span>
										<time dateTime={item.publishedAt}>{item.publishedAt}</time>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</section>

				<section id="archive" className="space-y-8">
					<SectionHeading
						label="旧视频号内容"
						title="历史内容独立归档，不打断图文主内容流"
						description="MVP 阶段先手动录入标题、简介、发布日期和外链状态，并预留后续导入自动化空间。"
					/>
					<div className="grid gap-4 md:grid-cols-3">
						{legacyVideoItems.map((item, index) => (
							<Card
								key={item.title}
								className="motion-enter border-[#d8c5af] bg-[#fffaf4]"
								style={{ animationDelay: `${120 + index * 80}ms` }}
							>
								<CardHeader className="space-y-3">
									<div className="flex items-center justify-between gap-2">
										<div className="rounded-full bg-[#f2deca] p-2 text-[#714a30]">
											<Video className="size-4" aria-hidden="true" />
										</div>
										<Badge
											variant={item.status === "linked" ? "default" : "outline"}
											className={
												item.status === "linked"
													? "bg-[#8d5b3a] text-[#fff8f1]"
													: "border-[#d4bea4] bg-[#fffaf4] text-[#735f4c]"
											}
										>
											{item.status === "linked" ? "已关联" : "即将补充"}
										</Badge>
									</div>
									<CardTitle className="font-brand text-xl leading-snug text-[#2a2118]">
										{item.title}
									</CardTitle>
									<p className="text-sm text-[#5f4f42]">{item.summary}</p>
								</CardHeader>
								<CardContent className="flex items-center justify-between pt-0 text-xs text-[#7a6756]">
									<time dateTime={item.publishDate}>{item.publishDate}</time>
									<Button
										type="button"
										variant="ghost"
										className="cursor-pointer px-0 text-[#734d32] hover:bg-transparent hover:text-[#5e3a23]"
									>
										查看归档
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				</section>

				<section id="about" className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
					<Card className="border-[#d8c5af] bg-[#fffdf8] shadow-[0_10px_30px_rgba(105,78,50,0.09)]">
						<CardHeader className="space-y-3">
							<SectionHeading
								label="关于我们"
								title="真实家庭案例 + 方法论 + 可执行清单"
								description="品牌策略坚持“温和、正向、可执行”，不羞辱、不贴标签、不神化孩子。"
							/>
						</CardHeader>
						<CardContent className="grid gap-3 sm:grid-cols-3">
							{trustItems.map((item) => {
								const Icon = iconMap[item.icon];
								return (
									<div
										key={item.title}
										className="rounded-2xl border border-[#dbc6b0] bg-[#fff8f0] p-4"
									>
										<div className="mb-3 inline-flex rounded-lg bg-[#efdbc3] p-2 text-[#6c4931]">
											<Icon className="size-4" aria-hidden="true" />
										</div>
										<h3 className="font-medium text-[#2f251b]">{item.title}</h3>
										<p className="mt-2 text-sm leading-relaxed text-[#5e4e40]">
											{item.description}
										</p>
									</div>
								);
							})}
						</CardContent>
					</Card>

					<Card id="contact" className="border-[#d8c5af] bg-[#fffaf3]">
						<CardHeader className="space-y-3">
							<CardTitle className="font-brand text-3xl text-[#2c2218]">
								三条核心转化路径
							</CardTitle>
							<p className="text-sm leading-relaxed text-[#5f4f40]">
								内容浏览 -&gt; 信任建立 -&gt; 留资/加企微 -&gt; 后续服务转化。下列入口为演示占位。
							</p>
						</CardHeader>
						<CardContent className="space-y-3">
							{actionCards.map((item) => {
								const Icon = iconMap[item.icon];
								return (
									<div
										key={item.title}
										className="rounded-xl border border-[#d9c5af] bg-[#fffdf9] p-4 transition-colors duration-200 hover:border-[#be9d80] hover:bg-[#fff8f0]"
									>
										<div className="mb-2 flex items-center gap-2">
											<div className="rounded-lg bg-[#f0dcc4] p-2 text-[#734d32]">
												<Icon className="size-4" aria-hidden="true" />
											</div>
											<h3 className="font-medium text-[#2e241b]">{item.title}</h3>
										</div>
										<p className="text-sm text-[#5f4f41]">{item.description}</p>
										<div className="mt-3 flex items-center justify-between gap-3">
											<p className="text-xs text-[#826f5d]">{item.note}</p>
											<Button
												type="button"
												variant="outline"
												className="cursor-pointer rounded-full border-[#cfb79e] bg-[#fffaf4] text-[#5e412c] hover:bg-[#f4e4d3]"
											>
												{item.actionLabel}
											</Button>
										</div>
									</div>
								);
							})}
						</CardContent>
					</Card>
				</section>

				<section id="legal" className="space-y-6 rounded-[1.75rem] border border-[#d8c5af] bg-[#fffaf4] p-6">
					<SectionHeading
						label="法律与合规"
						title="MVP 默认展示合规基线"
						description="正式版本需补齐完整隐私政策、未成年人保护条款、版权声明与侵权处理流程。"
					/>
					<div className="grid gap-3 md:grid-cols-2">
						{[
							"未成年人保护原则：不披露可识别隐私，不发布敏感生活轨迹。",
							"隐私政策：留资用途、保存范围、撤回机制需完整披露。",
							"内容版权声明：外部素材授权状态与侵权处理入口需可见。",
							"案例使用须知：授权 + 匿名化 + 风险提示，缺一不可。",
						].map((item) => (
							<div
								key={item}
								className="rounded-xl border border-[#dbc7b1] bg-[#fffdf9] p-4 text-sm leading-relaxed text-[#5c4d3f]"
							>
								{item}
							</div>
						))}
					</div>
				</section>
			</main>

			<footer className="border-t border-[#d7c2aa] bg-[#f8f1e7] px-4 py-8 md:px-8">
				<div className="mx-auto flex w-full max-w-7xl flex-col gap-4 text-sm text-[#665444] md:flex-row md:items-end md:justify-between">
					<div>
						<p className="font-brand text-xl text-[#2b2118]">童蒙家塾</p>
						<p className="mt-1 text-xs text-[#7d6a57]">
							【待补充】公司主体全称 / 备案信息 / 官方联系方式
						</p>
					</div>
					<p className="text-xs text-[#7d6a57]">
						© 2026 Tongmeng Family School. All rights reserved.
					</p>
				</div>
			</footer>
		</div>
	);
}
