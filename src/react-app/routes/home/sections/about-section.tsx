import type { AboutContent } from "@/routes/home-page.data";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/common/markdown-renderer";
import { PaperCard } from "@/routes/home/components/paper-card";
import { SectionHeading } from "@/routes/home/components/section-heading";

interface AboutSectionProps {
	content: AboutContent;
}

export function AboutSection({ content }: AboutSectionProps) {
	return (
		<section id="about" className="space-y-8 py-2">
			<SectionHeading
				label="知我"
				title="以家为塾，让教育回到日常"
				description="我是小罗老师，一名三娃妈妈，也是「童蒙家塾」家庭 IP 创始人。"
			/>
			<div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
				<PaperCard motionDelayMs={100} className="space-y-4">
					<h3 className="font-brand text-2xl text-foreground">{content.name}</h3>
					<ul className="space-y-2 text-sm leading-relaxed text-muted-foreground md:text-base">
						{content.roles.map((role) => (
							<li key={role}>{role}</li>
						))}
					</ul>
					<div className="space-y-2 rounded-2xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.78)] p-4">
						<p className="text-sm font-medium text-foreground">我相信：</p>
						{content.beliefs.map((belief) => (
							<MarkdownRenderer
								key={belief}
								content={belief}
								className="text-sm leading-relaxed text-muted-foreground md:text-base"
							/>
						))}
					</div>
					<div className="flex flex-wrap gap-2">
						{content.methodKeywords.map((item) => (
							<Badge
								key={item}
								className="rounded-full bg-[color:rgba(166,124,82,0.14)] text-[color:var(--brand-primary)]"
							>
								{item}
							</Badge>
						))}
					</div>
					<MarkdownRenderer
						content={content.closing}
						className="text-sm leading-relaxed text-muted-foreground md:text-base"
					/>
				</PaperCard>

				<PaperCard motionDelayMs={180} className="flex flex-col gap-4 p-3 md:p-4">
					<div className="overflow-hidden rounded-2xl border border-[color:rgba(166,124,82,0.2)]">
						<img
							src={content.portrait.src}
							alt={content.portrait.alt}
							loading="lazy"
							className="aspect-[4/5] w-full object-cover object-center"
						/>
					</div>
					<div
						id="contact"
						className="rounded-2xl border border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.82)] p-4"
					>
						<p className="font-medium text-foreground">联系与合作</p>
						<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
							欢迎进行家庭共学交流、内容合作与讲座邀请，当前邮箱为占位信息。
						</p>
						<a
							href="mailto:contact@illumi-family.com"
							className="mt-3 inline-flex h-9 items-center justify-center rounded-full border border-input px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-[color:rgba(243,236,227,0.65)]"
						>
							contact@illumi-family.com
						</a>
					</div>
				</PaperCard>
			</div>
		</section>
	);
}
