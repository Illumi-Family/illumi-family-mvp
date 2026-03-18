import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { HeroContent } from "@/routes/home-page.data";
import { Badge } from "@/components/ui/badge";

interface HeroSectionProps {
	content: HeroContent;
}

export function HeroSection({ content }: HeroSectionProps) {
	const { t } = useTranslation("home");

	return (
		<section
			id="hero"
			aria-label={content.image.alt}
			className="relative overflow-hidden rounded-[2rem] border border-[color:rgba(166,124,82,0.24)]"
		>
			<img
				src={content.image.src}
				alt=""
				aria-hidden="true"
				loading="eager"
				className="absolute inset-0 h-full w-full object-cover object-center"
			/>
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-[linear-gradient(100deg,rgba(34,23,14,0.72)_0%,rgba(34,23,14,0.55)_42%,rgba(34,23,14,0.22)_100%)]"
			/>
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,243,234,0.06)_0%,rgba(34,23,14,0.32)_100%)]"
			/>

			<div className="relative z-10 flex items-end p-5 md:p-8 lg:p-12">
				<div className="max-w-3xl space-y-6 motion-enter" style={{ animationDelay: "60ms" }}>
					<Badge className="w-fit rounded-full bg-[color:rgba(248,245,240,0.22)] px-3 py-1 text-[color:#fff8ef]">
						{t("hero.badge")}
					</Badge>
					<div className="space-y-4">
						<h1 className="font-brand text-4xl leading-tight text-[#fff8ef] md:text-6xl">
							{content.title}
						</h1>
						<p className="font-brand text-xl leading-relaxed text-[#f4dcb9] md:text-2xl">
							{content.subtitle}
						</p>
					</div>
					<div className="space-y-1 text-base leading-relaxed text-[#f8ece0]">
						{content.descriptionLines.map((line) => (
							<p key={line}>{line}</p>
						))}
					</div>
					<div className="flex flex-wrap items-center gap-3 pt-1">
						<a
							href={content.primaryCta.href}
							className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#fff8ef] px-6 text-sm font-medium text-[#4a3422] transition-colors duration-200 hover:bg-[#f3dfc4]"
						>
							{content.primaryCta.label}
							<ArrowRight aria-hidden="true" className="size-4" />
						</a>
						<a
							href={content.secondaryCta.href}
							className="inline-flex h-10 items-center justify-center rounded-full border border-[color:rgba(255,248,239,0.7)] bg-[color:rgba(44,32,23,0.26)] px-6 text-sm font-medium text-[#fff8ef] transition-colors duration-200 hover:bg-[color:rgba(44,32,23,0.42)]"
						>
							{content.secondaryCta.label}
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}
