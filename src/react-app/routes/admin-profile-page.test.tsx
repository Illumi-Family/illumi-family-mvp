import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppI18nContext } from "@/i18n/context";
import { AdminProfilePage } from "./admin-profile-page";

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

describe("admin profile page", () => {
	it("renders profile settings shell", () => {
		const queryClient = new QueryClient();
		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<AppI18nContext.Provider
					value={{
						locale: "zh-CN",
						lang: "zh",
						switchLocale: () => {},
					}}
				>
					<AdminProfilePage />
				</AppI18nContext.Provider>
			</QueryClientProvider>,
		);

		expect(html).toContain("个人资料设置");
		expect(html).toContain("账号会在注册并完成邮箱验证后自动创建");
		expect(html).toContain("当前用户");
		expect(html).toContain("正在加载当前资料");
	});
});
