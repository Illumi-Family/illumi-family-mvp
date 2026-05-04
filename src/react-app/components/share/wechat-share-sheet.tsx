import { Button } from "@/components/ui/button";

type WechatShareSheetProps = {
	open: boolean;
	copyResultMessage: string | null;
	onClose: () => void;
	onCopyLink: () => void;
};

export function WechatShareSheet({
	open,
	copyResultMessage,
	onClose,
	onCopyLink,
}: WechatShareSheetProps) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[70] lg:hidden">
			<button
				type="button"
				aria-label="关闭分享引导"
				className="absolute inset-0 bg-black/45"
				onClick={onClose}
			/>
			<section
				role="dialog"
				aria-modal="true"
				aria-label="微信分享引导"
				className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-[color:rgba(166,124,82,0.24)] bg-[color:rgba(255,252,247,0.98)] px-5 pb-6 pt-5 shadow-2xl"
			>
				<p className="text-sm font-medium text-foreground">微信分享</p>
				<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
					点击微信右上角“···”，选择“发送给朋友”或“分享到朋友圈”。
				</p>
				<div className="mt-4 grid grid-cols-2 gap-3">
					<Button type="button" variant="outline" onClick={onClose}>
						我知道了
					</Button>
					<Button type="button" onClick={onCopyLink}>
						复制链接
					</Button>
				</div>
				{copyResultMessage ? (
					<p className="mt-3 text-xs text-muted-foreground">{copyResultMessage}</p>
				) : null}
			</section>
		</div>
	);
}
