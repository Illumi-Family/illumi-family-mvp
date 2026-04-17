import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type VideoRowMoreMenuProps = {
	disabled: boolean;
	canDeleteDraft: boolean;
	onEdit: () => void;
	onSyncStatus: () => void;
	onDeleteDraft: () => void;
};

export function VideoRowMoreMenu(props: VideoRowMoreMenuProps) {
	const { disabled, canDeleteDraft, onEdit, onSyncStatus, onDeleteDraft } = props;
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const firstItemRef = useRef<HTMLButtonElement | null>(null);

	const closeMenu = () => {
		setOpen(false);
		triggerRef.current?.focus();
	};

	useEffect(() => {
		if (!open) return;
		firstItemRef.current?.focus();
	}, [open]);

	useEffect(() => {
		if (!open) return;

		const handleDocumentPointerDown = (event: MouseEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (menuRef.current?.contains(target)) return;
			if (triggerRef.current?.contains(target)) return;
			closeMenu();
		};

		const handleDocumentKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			event.preventDefault();
			closeMenu();
		};

		document.addEventListener("mousedown", handleDocumentPointerDown);
		document.addEventListener("keydown", handleDocumentKeyDown);

		return () => {
			document.removeEventListener("mousedown", handleDocumentPointerDown);
			document.removeEventListener("keydown", handleDocumentKeyDown);
		};
	}, [open]);

	const handleMenuAction = (action: () => void) => {
		action();
		closeMenu();
	};

	return (
		<div className="relative">
			<Button
				ref={triggerRef}
				type="button"
				variant="ghost"
				size="sm"
				disabled={disabled}
				aria-haspopup="menu"
				aria-expanded={open}
				onClick={() => setOpen((prev) => !prev)}
			>
				更多
			</Button>

			{open ? (
				<div
					ref={menuRef}
					role="menu"
					className="absolute right-0 top-full z-20 mt-2 w-36 rounded-lg border border-border bg-background p-1 shadow-lg"
				>
					<button
						ref={firstItemRef}
						type="button"
						role="menuitem"
						className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
						onClick={() => handleMenuAction(onEdit)}
					>
						编辑信息
					</button>
					<button
						type="button"
						role="menuitem"
						className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
						onClick={() => handleMenuAction(onSyncStatus)}
					>
						同步状态
					</button>
					<button
						type="button"
						role="menuitem"
						disabled={!canDeleteDraft}
						className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
						onClick={() => handleMenuAction(onDeleteDraft)}
					>
						删除草稿
					</button>
				</div>
			) : null}
		</div>
	);
}
