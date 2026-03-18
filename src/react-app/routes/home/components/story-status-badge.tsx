import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

interface StoryStatusBadgeProps {
	status: "published" | "coming_soon";
}

export function StoryStatusBadge({ status }: StoryStatusBadgeProps) {
	const { t } = useTranslation("home");

	if (status === "published") {
		return (
			<Badge className="rounded-full bg-primary text-primary-foreground">
				{t("stories.status.published")}
			</Badge>
		);
	}

	return (
		<Badge
			variant="outline"
			className="rounded-full border-[color:rgba(166,124,82,0.32)] bg-[color:rgba(255,252,247,0.9)] text-muted-foreground"
		>
			{t("stories.status.comingSoon")}
		</Badge>
	);
}
