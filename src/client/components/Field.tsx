import type { ReactNode } from "react";

/** Shared Tailwind class string for text inputs inside <Field>. */
export const inputClass =
	"w-full px-3 py-2.5 border border-border rounded-lg bg-bg text-text text-[0.95rem] focus:outline-2 focus:outline-primary focus:-outline-offset-1 focus:border-primary";

/** Label + control + inline validation error. */
export default function Field({
	id,
	label,
	error,
	children,
}: {
	id: string;
	label: string;
	error?: unknown;
	children: ReactNode;
}) {
	return (
		<div className="mb-4">
			<label htmlFor={id} className="block text-sm font-semibold mb-1.5">
				{label}
			</label>
			{children}
			{error ? (
				<p className="text-danger text-xs mt-1.5" role="alert">
					{String(error)}
				</p>
			) : null}
		</div>
	);
}
