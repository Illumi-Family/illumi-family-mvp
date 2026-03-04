import { FormEvent, useState } from "react";
import { Switch } from "@base-ui/react/switch";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function App() {
	const [name, setName] = useState("unknown");
	const [displayName, setDisplayName] = useState("Illumi Family");
	const [email, setEmail] = useState("hello@illumi.family");
	const [bio, setBio] = useState("Building family-first products at the edge.");
	const [tagInput, setTagInput] = useState("");
	const [tags, setTags] = useState(["MVP", "Cloudflare", "shadcn"]);
	const [notificationEnabled, setNotificationEnabled] = useState(false);
	const [savedAt, setSavedAt] = useState<string | null>(null);

	const addTag = () => {
		const value = tagInput.trim();
		if (!value) return;
		setTags((current) =>
			current.includes(value) ? current : [...current, value].slice(-8),
		);
		setTagInput("");
	};

	const removeTag = (value: string) => {
		setTags((current) => current.filter((item) => item !== value));
	};

	const saveProfile = (event: FormEvent) => {
		event.preventDefault();
		setSavedAt(new Date().toLocaleTimeString());
	};

	const fetchName = async () => {
		try {
			const res = await fetch("/api/");
			const data = (await res.json()) as { name: string };
			setName(data.name);
		} catch {
			setName("request-failed");
		}
	};

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
			<header className="space-y-2">
				<p className="text-sm text-muted-foreground">
					Cloudflare Worker + React + Hono
				</p>
				<h1 className="text-3xl font-semibold tracking-tight">
					shadcn Playground
				</h1>
				<p className="text-sm text-muted-foreground">
					这页演示了 `Button / Card / Input / Label / Textarea / Badge` 的组合用法。
				</p>
			</header>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Profile Editor</CardTitle>
						<CardDescription>
							试试输入、标签、开关与 API 按钮，看看 shadcn 组件是否工作正常。
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="space-y-4" onSubmit={saveProfile}>
							<div className="space-y-2">
								<Label htmlFor="display-name">Display name</Label>
								<Input
									id="display-name"
									value={displayName}
									onChange={(event) => setDisplayName(event.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(event) => setEmail(event.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="bio">Bio</Label>
								<Textarea
									id="bio"
									value={bio}
									onChange={(event) => setBio(event.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="tag-input">Add tag</Label>
								<div className="flex gap-2">
									<Input
										id="tag-input"
										value={tagInput}
										onChange={(event) => setTagInput(event.target.value)}
										placeholder="例如：family"
									/>
									<Button type="button" variant="outline" onClick={addTag}>
										Add
									</Button>
								</div>
							</div>
							<div className="flex flex-wrap gap-2">
								{tags.map((tag) => (
									<button
										key={tag}
										type="button"
										onClick={() => removeTag(tag)}
										className="cursor-pointer"
										aria-label={`remove tag ${tag}`}
									>
										<Badge variant="secondary">{tag}</Badge>
									</button>
								))}
							</div>
							<div className="flex flex-wrap gap-2">
								<Button type="submit">Save profile</Button>
								<Button type="button" variant="secondary" onClick={fetchName}>
									Fetch /api name
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Live Preview</CardTitle>
						<CardDescription>右侧实时展示你刚刚输入的状态。</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-xs text-muted-foreground">API Name</p>
							<p className="text-sm font-medium">{name}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Display name</p>
							<p className="text-sm font-medium">{displayName}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Email</p>
							<p className="text-sm font-medium">{email}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Bio</p>
							<p className="text-sm">{bio}</p>
						</div>
						<div className="space-y-2">
							<p className="text-xs text-muted-foreground">Notifications</p>
							<div className="flex items-center gap-3">
								<Switch.Root
									checked={notificationEnabled}
									onCheckedChange={setNotificationEnabled}
									className={cn(
										"inline-flex h-6 w-11 items-center rounded-full border transition-colors",
										notificationEnabled
											? "border-primary bg-primary"
											: "border-border bg-muted",
									)}
									aria-label="notification switch"
								>
									<Switch.Thumb
										className={cn(
											"ml-0.5 size-5 rounded-full bg-background shadow transition-transform",
											notificationEnabled && "translate-x-5",
										)}
									/>
								</Switch.Root>
								<Badge variant={notificationEnabled ? "default" : "outline"}>
									{notificationEnabled ? "Enabled" : "Disabled"}
								</Badge>
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<p className="text-xs text-muted-foreground">
							{savedAt ? `Last saved at ${savedAt}` : "Not saved yet"}
						</p>
					</CardFooter>
				</Card>
			</div>
		</main>
	);
}

export default App;
