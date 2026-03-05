import { Badge } from "@/components/ui/badge";

interface StoryStatusBadgeProps {
	status: "published" | "coming_soon";
}

export function StoryStatusBadge({ status }: StoryStatusBadgeProps) {
	if (status === "published") {
		return <Badge className="rounded-full bg-primary text-primary-foreground">已上线</Badge>;
	}

	return (
		<Badge
			variant="outline"
			className="rounded-full border-[color:rgba(166,124,82,0.32)] bg-[color:rgba(255,252,247,0.9)] text-muted-foreground"
		>
			筹备中
		</Badge>
	);
}
