import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type MarkdownRendererProps = {
	content: string;
	className?: string;
	emptyFallback?: ReactNode;
};

const IMAGE_ONLY_REGEX = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const INLINE_REGEX = /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;

const renderInline = (text: string) => {
	const nodes: ReactNode[] = [];
	let cursor = 0;
	let index = 0;

	for (const match of text.matchAll(INLINE_REGEX)) {
		const full = match[0];
		const start = match.index ?? 0;
		if (start > cursor) {
			nodes.push(
				<Fragment key={`text-${index}`}>{text.slice(cursor, start)}</Fragment>,
			);
			index += 1;
		}

		const [, imageAlt, imageSrc, linkText, linkHref, boldText] = match;
		if (imageSrc) {
			nodes.push(
				<img
					key={`img-${index}`}
					src={imageSrc}
					alt={imageAlt || "markdown image"}
					loading="lazy"
					className="my-2 max-h-80 w-auto rounded-xl border border-[color:rgba(166,124,82,0.22)] bg-[color:rgba(255,252,247,0.75)]"
				/>,
			);
		} else if (linkHref && linkText) {
			const isExternal = /^https?:\/\//.test(linkHref);
			nodes.push(
				<a
					key={`link-${index}`}
					href={linkHref}
					target={isExternal ? "_blank" : undefined}
					rel={isExternal ? "noreferrer" : undefined}
					className="underline decoration-[color:rgba(166,124,82,0.55)] underline-offset-2 transition-colors hover:text-foreground"
				>
					{linkText}
				</a>,
			);
		} else if (boldText) {
			nodes.push(
				<strong key={`strong-${index}`} className="font-semibold text-foreground">
					{boldText}
				</strong>,
			);
		}

		cursor = start + full.length;
		index += 1;
	}

	if (cursor < text.length) {
		nodes.push(<Fragment key={`tail-${index}`}>{text.slice(cursor)}</Fragment>);
	}

	if (nodes.length === 0) {
		return text;
	}
	return nodes;
};

const isBulletLine = (line: string) => /^[-*]\s+/.test(line);

export function MarkdownRenderer({
	content,
	className,
	emptyFallback = null,
}: MarkdownRendererProps) {
	const trimmed = content.trim();
	if (!trimmed) return <>{emptyFallback}</>;

	const lines = trimmed.split(/\r?\n/);
	const blocks: ReactNode[] = [];
	let i = 0;

	while (i < lines.length) {
		const rawLine = lines[i] ?? "";
		const line = rawLine.trim();
		if (!line) {
			i += 1;
			continue;
		}

		const imageOnly = line.match(IMAGE_ONLY_REGEX);
		if (imageOnly) {
			const alt = imageOnly[1] || "markdown image";
			const src = imageOnly[2];
			blocks.push(
				<figure key={`figure-${i}`} className="my-2">
					<img
						src={src}
						alt={alt}
						loading="lazy"
						className="max-h-[24rem] w-full rounded-2xl border border-[color:rgba(166,124,82,0.24)] object-contain bg-[color:rgba(255,252,247,0.78)]"
					/>
				</figure>,
			);
			i += 1;
			continue;
		}

		if (line.startsWith("### ")) {
			blocks.push(
				<h3 key={`h3-${i}`} className="text-base font-semibold text-foreground">
					{renderInline(line.slice(4))}
				</h3>,
			);
			i += 1;
			continue;
		}

		if (line.startsWith("## ")) {
			blocks.push(
				<h2 key={`h2-${i}`} className="text-lg font-semibold text-foreground">
					{renderInline(line.slice(3))}
				</h2>,
			);
			i += 1;
			continue;
		}

		if (line.startsWith("# ")) {
			blocks.push(
				<h1 key={`h1-${i}`} className="text-xl font-semibold text-foreground">
					{renderInline(line.slice(2))}
				</h1>,
			);
			i += 1;
			continue;
		}

		if (isBulletLine(line)) {
			const items: string[] = [];
			while (i < lines.length && isBulletLine((lines[i] ?? "").trim())) {
				items.push((lines[i] ?? "").trim().replace(/^[-*]\s+/, ""));
				i += 1;
			}
			blocks.push(
				<ul key={`ul-${i}`} className="list-disc space-y-1 pl-5">
					{items.map((item, itemIndex) => (
						<li key={`${itemIndex}-${item}`} className="text-inherit">
							{renderInline(item)}
						</li>
					))}
				</ul>,
			);
			continue;
		}

		const paragraphLines: string[] = [line];
		i += 1;
		while (i < lines.length) {
			const next = (lines[i] ?? "").trim();
			if (!next || next.startsWith("#") || isBulletLine(next)) break;
			paragraphLines.push(next);
			i += 1;
		}

		blocks.push(
			<p key={`p-${i}`} className="text-inherit">
				{renderInline(paragraphLines.join(" "))}
			</p>,
		);
	}

	return (
		<div
			className={cn(
				"space-y-2 text-sm leading-relaxed text-muted-foreground md:text-base",
				className,
			)}
		>
			{blocks}
		</div>
	);
}
