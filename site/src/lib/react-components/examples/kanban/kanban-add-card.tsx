import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import Button from '../common/button';
import { fieldClass } from '../common/button-classes';

export type KanbanAddCardProps = {
	/** Human-readable column name, used for the input's label. */
	column: string;
	/** Called with a non-empty, trimmed title. */
	onAdd: (title: string) => void;
};

export default function KanbanAddCard({ column, onAdd }: KanbanAddCardProps) {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState('');
	const input = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (open) input.current?.focus();
	}, [open]);

	function commit() {
		const title = value.trim();
		if (!title) return;
		onAdd(title);
		setValue('');
		setOpen(false);
	}

	function cancel() {
		setValue('');
		setOpen(false);
	}

	// The board listens for Enter (grab/drop) and Escape (cancel) too, so the
	// composer swallows both rather than letting a typed Enter reach a widget.
	function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();
			commit();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			cancel();
		}
	}

	if (open) {
		return (
			<div className="border-rule-soft bg-panel mt-2 flex items-center gap-1 rounded-[10px] border p-1">
				<input
					ref={input}
					value={value}
					onChange={(event) => setValue(event.target.value)}
					onKeyDown={onKeyDown}
					placeholder="Card title"
					aria-label={`New card in ${column}`}
					className={`${fieldClass} h-7 border-0 bg-transparent px-1.5 text-[13px] shadow-none focus-visible:ring-0`}
				/>
				<Button size="sm" className="h-7 shrink-0 rounded-full px-2 text-[11px]" onClick={commit}>
					Add
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="size-7 shrink-0 rounded-full"
					onClick={cancel}
					title="Cancel"
				>
					<X className="size-4" />
					<span className="sr-only">Cancel adding a card to {column}</span>
				</Button>
			</div>
		);
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			className="text-faint hover:bg-rule-faint hover:text-ink mt-2 h-7 w-full justify-start gap-1.5 rounded-[9px] px-1.5"
			onClick={() => setOpen(true)}
		>
			<Plus className="size-3.5" />
			<span className="ui text-xs">Add card</span>
			<span className="sr-only">to {column}</span>
		</Button>
	);
}
