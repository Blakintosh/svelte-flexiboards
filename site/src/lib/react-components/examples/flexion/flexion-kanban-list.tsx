import { FlexiTarget, FlexiWidget } from '@flexiboards/react';
import type { FlexiTargetController, FlexiWidgetController } from '@flexiboards/react';
import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { cn } from '$lib/utils.js';
import Button from '../common/button';

type FlexionKanbanListProps = {
	category: string;
	categoryLabel: string;
	bgClass: string;
	dotClass: string;
	// Items carry a done flag; completed work is struck through, not hidden.
	items: { label: string; done?: boolean }[];
};

const addedWidgetClass =
	'rounded-[10px] border border-rule-soft bg-panel px-4 py-2 text-[13px] text-ink shadow-card';

export default function FlexionKanbanList({
	category,
	categoryLabel,
	bgClass,
	dotClass,
	items
}: FlexionKanbanListProps) {
	const [adding, setAdding] = useState(false);
	const [newItem, setNewItem] = useState('');
	const target = useRef<FlexiTargetController | null>(null);
	const addInput = useRef<HTMLInputElement | null>(null);

	// Auto focus the add input when it's being added.
	useEffect(() => {
		if (adding) {
			addInput.current?.focus();
		}
	}, [adding]);

	function addItem() {
		setAdding(false);

		target.current?.createWidget({
			className: addedWidgetClass,
			snippet: ({ widget }: { widget: FlexiWidgetController }) => (
				<>{widget.componentProps?.content as string}</>
			),
			componentProps: {
				content: newItem
			}
		});
		setNewItem('');
	}

	function cancelAddItem() {
		setAdding(false);
		setNewItem('');
	}

	// The Svelte version listens on <svelte:window>; same capture, same rules.
	useEffect(() => {
		if (!adding) return;

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Enter' && newItem.length) {
				addItem();
			} else if (event.key === 'Escape') {
				cancelAddItem();
			}
		}

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	});

	const header = ({ target: targetController }: { target: FlexiTargetController }) => (
		// Column headings are status chips: rounded pill, tinted fill, round dot.
		<div className="mb-4 flex items-center gap-4">
			<h3
				className={twMerge(
					'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold',
					bgClass
				)}
			>
				<div className={twMerge('size-1.5 rounded-full', dotClass)}></div>
				{categoryLabel}
			</h3>
			<span className="font-mono text-[11px] text-faint">{targetController.widgets.size}</span>
		</div>
	);

	const footer = () =>
		!adding ? (
			<Button onClick={() => setAdding(true)} variant="ghost" className="rounded-full">
				<Plus />
				Add
			</Button>
		) : (
			<div className="mt-1 flex w-48 items-center gap-2 rounded-[10px] border border-rule-soft bg-tint px-4 py-1 2xl:w-64">
				<Button
					onClick={cancelAddItem}
					variant="ghost"
					size="icon"
					className="size-4 shrink-0 rounded-full"
				>
					<X />
				</Button>
				<input
					type="text"
					ref={addInput}
					value={newItem}
					onChange={(event) => setNewItem(event.target.value)}
					className="min-w-0 grow bg-transparent text-[13px] text-ink outline-none"
				/>
				<Button onClick={addItem} variant="link" size="sm" className="shrink-0">
					Add
				</Button>
			</div>
		);

	return (
		<FlexiTarget
			keyName={category}
			className="w-72 lg:w-48 2xl:w-64 gap-1"
			onfirstcreate={(controller) => (target.current = controller)}
			header={header}
			footer={footer}
		>
			{items.map((item) => (
				<FlexiWidget
					key={item.label}
					className={(widget: FlexiWidgetController) =>
						cn(
							'rounded-[10px] border border-rule-soft bg-panel px-4 py-2 text-[13px] text-ink shadow-card',
							item.done && 'text-faint line-through',
							widget.isGrabbed && ' border-rule-soft opacity-60 shadow-lift',
							widget.isShadow &&
								'rounded-[14px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent'
						)
					}
				>
					{item.label}
				</FlexiWidget>
			))}
		</FlexiTarget>
	);
}
