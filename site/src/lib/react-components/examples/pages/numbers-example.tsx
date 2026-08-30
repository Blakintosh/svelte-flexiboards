import { FlexiBoard, FlexiAdd, FlexiTarget, FlexiWidget, FlexiDelete, springTransitionConfig } from "@flexiboards/react";
import type { AdderWidgetConfiguration, FlexiWidgetController, FlexiBoardConfiguration } from "@flexiboards/react";
import { clsx } from 'clsx';
import { NumberTile } from "../numbers/number-tile";
import { Plus, Trash2 } from 'lucide-react';

export default function NumbersExample() {

	const boardConfig: FlexiBoardConfiguration = {
		widgetDefaults: {
			draggable: true,
			resizability: 'horizontal',
			transition: springTransitionConfig()
		}
	};
    
	// Anything provisional — the drop preview, the widget in hand — is dashed fx-accent.
	const className = (widget: FlexiWidgetController) => clsx([
		widget.isShadow && 'border border-dashed border-fx-accent bg-tint-accent opacity-70',
		widget.isGrabbed && 'border border-fx-accent opacity-60'
	]);

	function addWidget(): AdderWidgetConfiguration {
		return {
			widget: {
				component: NumberTile,
				componentProps: {
					number: Math.floor(Math.random() * 10)
				},
				className
			},
			widthPx: 100,
			heightPx: 100
		};
	}
    
    return (
        <main className="flex h-full min-h-0 w-full flex-col gap-8 bg-paper px-12 py-8 lg:px-16">
            <header className="flex shrink-0 items-baseline justify-between gap-4">
                <h1 className="font-serif text-2xl text-ink lg:text-[30px]">Numbers</h1>
                <span className="label text-[10px] text-faint">3 × 3 · free · add and delete</span>
            </header>

            <FlexiBoard
                className="flex min-h-0 min-w-0 flex-col items-center justify-center gap-4 lg:flex-row lg:gap-6"
                config={boardConfig}
            >
                <FlexiAdd
                    addWidget={addWidget}
                    className={'label flex size-32 flex-col items-center justify-center border border-dashed border-rule bg-tint-2 p-4 text-center text-[10px] text-faint transition-colors duration-[120ms] hover:border-ink hover:text-ink lg:size-40'}
                >
                    {() => <>
                        <Plus className="mb-2 size-8 lg:size-12" />
                        Add a random number
                    </>}
                </FlexiAdd>
                <FlexiTarget
                    keyName="target"
                    className={'aspect-square h-64 gap-2 border border-ink bg-panel p-4 lg:h-128 lg:gap-6'}
                    config={{
                        rowSizing: 'minmax(0, 1fr)',
                        layout: {
                            type: 'free',
                            minRows: 3,
                            minColumns: 3,
                            maxRows: 3,
                            maxColumns: 3
                        }
                    }}
                >
                    <FlexiWidget
                        className={className}
                        component={NumberTile}
                        componentProps={{ number: 1 }}
                        x={0}
                        y={0}
                    />
                    <FlexiWidget
                        className={className}
                        component={NumberTile}
                        componentProps={{ number: 5 }}
                        x={1}
                        y={2}
                    />
                </FlexiTarget>
                <FlexiDelete className={(deleter) => clsx([
                    'label flex size-32 flex-col items-center justify-center border border-dashed border-rule bg-tint-2 p-4 text-center text-[10px] text-faint duration-[120ms] lg:size-40',
                    deleter.isHovered && 'border-fx-accent bg-tint-accent text-fx-accent'
                ])}>
                    {() => <>
                        <Trash2 className="mb-2 size-8 lg:size-12" />
                        Delete

                        <span className="sr-only">Drag a widget here to delete it</span>
                    </>}
                </FlexiDelete>
            </FlexiBoard>
        </main>
    );
}