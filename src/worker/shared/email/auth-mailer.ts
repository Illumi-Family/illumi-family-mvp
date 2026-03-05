import { Resend } from "resend";
import type { AppBindings } from "../../types";

type VerificationEmailData = {
	to: string;
	name: string;
	url: string;
};

export const createResendClient = (env: AppBindings) => {
	if (!env.RESEND_API_KEY) {
		throw new Error("Missing RESEND_API_KEY");
	}
	return new Resend(env.RESEND_API_KEY);
};

export const sendVerificationEmail = async (
	env: AppBindings,
	data: VerificationEmailData,
) => {
	if (!env.RESEND_FROM_EMAIL) {
		throw new Error("Missing RESEND_FROM_EMAIL");
	}

	const resend = createResendClient(env);
	const response = await resend.emails.send({
		from: env.RESEND_FROM_EMAIL,
		to: data.to,
		subject: "Verify your Illumi Family account",
		html: `<p>Hi ${data.name || "there"},</p><p>Please verify your email by clicking <a href="${data.url}">this link</a>.</p>`,
		replyTo: env.RESEND_REPLY_TO || undefined,
	});

	if (response.error) {
		throw new Error(response.error.message || "Failed to send verification email");
	}
};
