import { FlexiBoard, FlexiAdd, FlexiTarget, FlexiWidget, FlexiDelete } from "@flexiboards/react";
import type { AdderWidgetConfiguration, FlexiWidgetController, FlexiBoardConfiguration } from "@flexiboards/react";
import { clsx } from 'clsx';
import { FlowTile } from "../flow/flow-tile";
import { Plus, Trash2 } from 'lucide-react';

export default function FlowExample() {

	const boardConfig: FlexiBoardConfiguration = {
		widgetDefaults: {
			draggable: true,
			resizability: 'horizontal'
		}
	};
    
	// Anything provisional — the drop preview, the widget in hand — is dashed fx-accent.
	const className = (widget: FlexiWidgetController) => clsx([
		widget.isShadow && 'border border-dashed border-fx-accent bg-tint-accent opacity-70',
		widget.isGrabbed && 'border border-fx-accent opacity-60'
	]);
    
    return (
        <main className="flex h-full min-h-0 w-full flex-col gap-8 bg-paper px-12 py-8 lg:px-16">
            <header className="flex shrink-0 items-baseline justify-between gap-4">
                <h1 className="font-serif text-2xl text-ink lg:text-[30px]">Flow</h1>
                <span className="label text-[10px] text-faint">3 × 3 · flow · row axis</span>
            </header>

            <FlexiBoard
                className="flex min-h-0 min-w-0 flex-col items-center justify-center gap-4 lg:flex-row lg:gap-6"
                config={boardConfig}
            >
                <FlexiTarget
                    keyName="target"
                    className={'aspect-square h-64 gap-2 border border-ink bg-panel p-4 lg:h-128 lg:gap-6'}
                    config={{
                        rowSizing: 'minmax(0, 6rem)',
                        layout: {
                            type: 'flow',
                            flowAxis: 'row',
                            placementStrategy: 'append',
                            rows: 3,
                            columns: 3
                        }
                    }}
                >
                    <FlexiWidget
                        className={className}
                        component={FlowTile}
                        componentProps={{ content: 'Lorem' }}
                        width={1}
                    />
                    <FlexiWidget
                        className={className}
                        component={FlowTile}
                        componentProps={{ content: 'ipsum' }}
                        width={1}
                    />
                    <FlexiWidget
                        className={className}
                        component={FlowTile}
                        componentProps={{ content: 'dolor' }}
                        width={2}
                    />
                    <FlexiWidget
                        className={className}
                        component={FlowTile}
                        componentProps={{ content: 'sit' }}
                        width={3}
                    />
                    <FlexiWidget
                        className={className}
                        component={FlowTile}
                        componentProps={{ content: 'amet' }}
                        width={2}
                    />
                </FlexiTarget>
            </FlexiBoard>
        </main>
    );
}