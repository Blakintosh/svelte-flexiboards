import { useFlexiWidget } from "@flexiboards/react";
import { clsx } from 'clsx';

export type FlowTileProps = {
    content: string;
};

export function FlowTile({ content }: FlowTileProps) {
    // The library's own transform positions the widget during drag, so the
    // grabbed tilt lives on this inner content instead of the widget itself.
    const widget = useFlexiWidget();

    // A placed widget is board furniture: soft tint fill, rounded corners, blue text.
    return <div
        className={clsx(
            'flex h-full items-center justify-center rounded-[10px] border border-rule-soft bg-tint p-4 text-[12px] font-semibold text-blue motion-safe:transition-transform motion-safe:duration-[120ms] lg:text-[13px]',
            widget.isGrabbed && 'rotate-[2.5deg]'
        )}>
        {content}
    </div>;
}