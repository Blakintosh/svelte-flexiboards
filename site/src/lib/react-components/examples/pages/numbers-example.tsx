import { FlexiBoard, FlexiAdd, FlexiTarget, FlexiWidget, FlexiDelete, springTransitionConfig } from "@flexiboards/react";
import type { AdderWidgetConfiguration, FlexiWidgetController, FlexiBoardConfiguration } from "@flexiboards/react";
import { clsx } from 'clsx';
import { NumberTile } from "../numbers/number-tile";
import { Plus, Trash2 } from 'lucide-react';

export default function NumbersExample() {

	const boardConfig: FlexiBoardConfiguration = {
		widgetDefaults: {
			draggability: 'full',
			resizability: 'horizontal',
			transition: springTransitionConfig()
		}
	};
    
	// The drop preview is dashed fx-accent; the widget in hand reads as a
	// lifted card, not an accent outline.
	const className = (widget: FlexiWidgetController) => clsx([
		'motion-safe:transition-[rotate] motion-safe:duration-[160ms] motion-safe:ease-out',
		widget.isShadow && 'rounded-[14px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent',
		widget.isGrabbed && 'shadow-lift rotate-[2.5deg]'
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
                <span className="text-[11.5px] font-semibold text-faint">3 × 3 · free grid · add and delete</span>
            </header>

            <FlexiBoard
                className="flex min-h-0 min-w-0 flex-col items-center justify-center gap-4 lg:flex-row lg:gap-6"
                config={boardConfig}
            >
                <FlexiAdd
                    addWidget={addWidget}
                    className={'ui flex size-32 flex-col items-center justify-center rounded-[14px] border border-dashed border-rule-soft bg-stage p-4 text-center text-xs text-faint transition-colors duration-[120ms] hover:border-ink hover:bg-tint hover:text-ink lg:size-40'}
                >
                    {() => <>
                        <Plus className="mb-2 size-8 lg:size-12" />
                        Add a random number
                    </>}
                </FlexiAdd>
                <FlexiTarget
                    keyName="target"
                    className={'aspect-square h-64 gap-2 rounded-[14px] border border-rule-soft bg-panel p-4 shadow-card lg:h-128 lg:gap-6'}
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
                    'ui flex size-32 flex-col items-center justify-center rounded-[14px] border border-dashed border-rule-soft bg-stage p-4 text-center text-xs text-faint transition-colors duration-[120ms] lg:size-40',
                    deleter.isHovered && 'border-fx-accent/50 bg-tint-accent text-fx-accent-hover'
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