import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface PaperCardProps extends HTMLAttributes<HTMLDivElement> {
	tone?: "default" | "soft";
	motionDelayMs?: number;
}

export function PaperCard({
	className,
	tone = "default",
	motionDelayMs,
	style,
	...props
}: PaperCardProps) {
	const mergedStyle: CSSProperties | undefined =
		typeof motionDelayMs === "number"
			? { ...style, animationDelay: `${motionDelayMs}ms` }
			: style;

	return (
		<div
			className={cn(
				"rounded-3xl border p-6 shadow-[0_14px_30px_rgba(76,57,37,0.08)] transition-colors duration-200 motion-enter",
				tone === "default"
					? "border-border bg-card"
					: "border-[color:rgba(166,124,82,0.22)] bg-[color:rgba(243,236,227,0.72)]",
				className,
			)}
			style={mergedStyle}
			{...props}
		/>
	);
}
