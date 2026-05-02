import { Badge } from "@/components/ui/badge";

interface SectionHeadingProps {
	id?: string;
	label: string;
	title: string;
	description: string;
}

export function SectionHeading({ id, label, title, description }: SectionHeadingProps) {
	return (
		<div className="space-y-3">
			{/* <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs text-secondary-foreground">
				{label}
			</Badge> */}
			<h2 id={id} className="font-brand text-3xl leading-tight text-foreground md:text-4xl">
				{label}
			</h2>
			{/* <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
				{description}
			</p> */}
		</div>
	);
}
