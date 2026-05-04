import { useState } from "react";
import { Share2 } from "lucide-react";
import { WechatShareSheet } from "@/components/share/wechat-share-sheet";
import { Button } from "@/components/ui/button";
import { copyTextToClipboard, resolveCanonicalShareUrl } from "@/lib/share";

export function MobileShareFab() {
	const [sheetOpen, setSheetOpen] = useState(false);
	const [copyResultMessage, setCopyResultMessage] = useState<string | null>(null);

	const handleCopyLink = async () => {
		const shareUrl = resolveCanonicalShareUrl();
		if (!shareUrl) {
			setCopyResultMessage("当前页面链接获取失败，请稍后重试。");
			return;
		}
		const copied = await copyTextToClipboard(shareUrl);
		setCopyResultMessage(copied ? "链接已复制，可直接粘贴到微信。" : "复制失败，请手动复制地址栏链接。");
	};

	return (
		<>
			<Button
				type="button"
				size="sm"
				className="fixed bottom-5 right-4 z-[65] h-12 w-12 rounded-full shadow-lg lg:hidden"
				aria-label="打开微信分享"
				onClick={() => {
					setCopyResultMessage(null);
					setSheetOpen(true);
				}}
			>
				<Share2 className="h-5 w-5" aria-hidden="true" />
			</Button>
			<WechatShareSheet
				open={sheetOpen}
				copyResultMessage={copyResultMessage}
				onClose={() => setSheetOpen(false)}
				onCopyLink={() => void handleCopyLink()}
			/>
		</>
	);
}
