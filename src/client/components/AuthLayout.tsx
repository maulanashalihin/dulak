import type { ReactNode } from "react";
import Brand from "./Brand";

/** Centered card layout for the guest pages (login / register). */
export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<main className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(700px_320px_at_50%_-10%,var(--primary-soft),transparent_70%)] bg-bg">
			<div className="w-full max-w-[400px] bg-surface border border-border rounded-radius shadow-card p-8">
				<div className="flex justify-center mb-6">
					<Brand href="/" />
				</div>
				{children}
			</div>
		</main>
	);
}
