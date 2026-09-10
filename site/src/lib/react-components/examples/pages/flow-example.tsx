import { FlexiBoard, FlexiAdd, FlexiTarget, FlexiWidget, FlexiDelete } from "@flexiboards/react";
import type { AdderWidgetConfiguration, FlexiWidgetController, FlexiBoardConfiguration } from "@flexiboards/react";
import { clsx } from 'clsx';
import { FlowTile } from "../flow/flow-tile";
import { Plus, Trash2 } from 'lucide-react';

export default function FlowExample() {

	const boardConfig: FlexiBoardConfiguration = {
		widgetDefaults: {
			draggability: 'full',
			resizability: 'horizontal'
		}
	};
    
	// The drop preview reads as a dashed accent outline; the widget in hand
	// lifts off the sheet instead of taking an accent border.
	const className = (widget: FlexiWidgetController) => clsx([
		widget.isShadow && 'rounded-[14px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent',
		widget.isGrabbed && 'rounded-[10px] shadow-lift opacity-90'
	]);
    
    return (
        <main className="flex h-full min-h-0 w-full flex-col gap-8 bg-paper px-12 py-8 lg:px-16">
            <header className="flex shrink-0 items-baseline justify-between gap-4">
                <h1 className="font-serif text-2xl text-ink lg:text-[30px]">Flow</h1>
                <span className="font-mono text-[11px] text-faint">3 × 3 · flow · row axis</span>
            </header>

            <FlexiBoard
                className="flex min-h-0 min-w-0 flex-col items-center justify-center gap-4 lg:flex-row lg:gap-6"
                config={boardConfig}
            >
                <FlexiTarget
                    keyName="target"
                    className={'aspect-square h-64 gap-2 rounded-[14px] border border-rule-soft bg-panel p-4 shadow-card lg:h-128 lg:gap-6'}
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