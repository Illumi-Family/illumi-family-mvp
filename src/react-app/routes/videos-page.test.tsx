import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { VideosPage } from "./videos-page";

describe("videos page", () => {
	it("renders page heading", () => {
		const queryClient = new QueryClient();
		const html = renderToString(
			<QueryClientProvider client={queryClient}>
				<VideosPage />
			</QueryClientProvider>,
		);

		expect(html).toContain("Family Videos");
	});
});
