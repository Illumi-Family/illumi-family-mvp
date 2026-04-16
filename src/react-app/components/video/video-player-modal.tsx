import { useState } from "react";
import { Stream } from "@cloudflare/stream-react";
import { Button } from "@/components/ui/button";

type VideoPlayerModalProps = {
	open: boolean;
	onClose: () => void;
	streamVideoId: string | null;
	title?: string;
};

export function VideoPlayerModal(props: VideoPlayerModalProps) {
	const { open, onClose, streamVideoId, title } = props;
	const [playbackError, setPlaybackError] = useState<string | null>(null);
	const handleClose = () => {
		setPlaybackError(null);
		onClose();
	};

	if (!open || !streamVideoId) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
			<div className="w-full max-w-4xl rounded-2xl bg-background p-4 shadow-2xl">
				<div className="mb-3 flex items-center justify-between gap-3">
					<div>
						<p className="text-sm text-muted-foreground">Public Video Player</p>
						<h2 className="text-lg font-semibold text-foreground">
							{title || "Untitled video"}
						</h2>
					</div>
					<Button type="button" variant="outline" size="sm" onClick={handleClose}>
						Close
					</Button>
				</div>
				<div className="overflow-hidden rounded-xl border border-border bg-black">
					<Stream
						src={streamVideoId}
						controls
						className="aspect-video w-full"
						onError={() => setPlaybackError("Failed to load video stream")}
					/>
				</div>
				{playbackError ? (
					<p className="mt-3 text-sm text-destructive">{playbackError}</p>
				) : null}
			</div>
		</div>
	);
}
