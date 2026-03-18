import { useTranslation } from "react-i18next";
import { useAppI18n } from "./context";

type LanguageSwitcherProps = {
	className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
	const { t } = useTranslation("common");
	const { locale, switchLocale } = useAppI18n();

	return (
		<div className={className}>
			{/* <span className="text-xs text-muted-foreground">{t("languageSwitcher.label")}</span> */}
			<div className="inline-flex rounded-full border border-input bg-background p-0.5">
				<button
					type="button"
					onClick={() => switchLocale("zh-CN")}
					aria-pressed={locale === "zh-CN"}
					className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
						locale === "zh-CN"
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					{t("languageSwitcher.zh")}
				</button>
				<button
					type="button"
					onClick={() => switchLocale("en-US")}
					aria-pressed={locale === "en-US"}
					className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
						locale === "en-US"
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					{t("languageSwitcher.en")}
				</button>
			</div>
		</div>
	);
}
