import { useEffect } from "react";
import { Stream } from "@cloudflare/stream-react";

type VideoPlayerModalProps = {
	open: boolean;
	onClose: () => void;
	streamVideoId: string | null;
};

export function VideoPlayerModal(props: VideoPlayerModalProps) {
	const { open, onClose, streamVideoId } = props;

	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [open, onClose]);

	if (!open) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
			onClick={onClose}
		>
			<div
				role="dialog"
				aria-modal="true"
				className="relative overflow-hidden rounded-xl bg-black shadow-2xl"
				style={{
					width: "min(80vw, calc(80dvh * 16 / 9))",
					aspectRatio: "16 / 9",
					maxWidth: "80vw",
					maxHeight: "80dvh",
				}}
				onClick={(event) => event.stopPropagation()}
			>
				{streamVideoId ? (
					<Stream
						src={streamVideoId}
						controls
						autoplay
						responsive={false}
						width="100%"
						height="100%"
						className="h-full w-full"
					/>
				) : null}
			</div>
		</div>
	);
}
