import { Stream } from "@cloudflare/stream-react";

type VideoInlinePreviewProps = {
	streamVideoId: string;
	posterUrl: string | null;
	title: string;
	active: boolean;
};

export function VideoInlinePreview(props: VideoInlinePreviewProps) {
	const { streamVideoId, posterUrl, title, active } = props;

	if (!active) {
		if (posterUrl) {
			return (
				<div className="overflow-hidden rounded-xl border border-border bg-muted">
					<img
						src={posterUrl}
						alt={title || "视频封面"}
						className="aspect-video w-full object-cover"
					/>
				</div>
			);
		}

		return (
			<div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
				暂无封面，点击“快速预览”查看视频
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-black">
			<Stream
				src={streamVideoId}
				controls={false}
				muted
				autoplay
				className="aspect-video w-full"
			/>
		</div>
	);
}
