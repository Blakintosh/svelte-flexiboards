import { useCallback } from "react";
import { useFromCore } from "../adapter";
import { assistiveTextStyle, generateUniqueId } from "@flexiboards/core";

function FlexiAdd() {
    const newWidget = useFromCore(useCallback(() => widget.y, [widget]));
    const assistiveTextId = generateUniqueId();

    return (
        <>
            <button
                className={derivedClassName}
                aria-descibedby={assistiveTextId}
                style={{ touchAction: "none" }}
                onPointerDown={onpointerdown}
                onKeyDown={onkeydown}
            >
                <span style={assistiveTextStyle} id={assistiveTextId}>
                    Press Enter to drag a new widget into this board.
                </span>
            </button>
            <div style={{ display: "none" }}>
                {newWidget && (
                    <RenderedFlexiWidget widget={newWidget} />
                )}
            </div>
        </>
    )
}