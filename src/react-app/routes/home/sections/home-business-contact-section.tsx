import type { HomeBusinessContactContent } from "@/routes/home-page.data";
import { SectionHeading } from "@/routes/home/components/section-heading";

type HomeBusinessContactSectionProps = {
	content: HomeBusinessContactContent;
};

export function HomeBusinessContactSection({ content }: HomeBusinessContactSectionProps) {
	return (
		<section id={content.sectionId} className="space-y-8 py-2">
			<SectionHeading
				label={content.label}
				title={content.title}
				description={content.description}
			/>
			<div className="grid gap-4 md:grid-cols-3">
				<article className="space-y-2 rounded-2xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.82)] px-5 py-5">
					<p className="text-xs uppercase tracking-[0.12em] text-[color:var(--brand-primary)]">
						手机 
					</p>
					<p className="text-xl font-semibold text-foreground">{content.phone}</p>
				</article>
				<article className="space-y-2 rounded-2xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.82)] px-5 py-5">
					<p className="text-xs uppercase tracking-[0.12em] text-[color:var(--brand-primary)]">
						微信
					</p>
					<p className="text-xl font-semibold text-foreground">{content.wechat}</p>
				</article>
				<article className="space-y-2 rounded-2xl border border-[color:rgba(166,124,82,0.2)] bg-[color:rgba(255,252,247,0.82)] px-5 py-5">
					<p className="text-xs uppercase tracking-[0.12em] text-[color:var(--brand-primary)]">
						邮箱
					</p>
					<a
						href={`mailto:${content.email}`}
						className="text-xl font-semibold text-foreground underline decoration-[color:rgba(166,124,82,0.45)] underline-offset-4"
					>
						{content.email}
					</a>
				</article>
			</div>
		</section>
	);
}
