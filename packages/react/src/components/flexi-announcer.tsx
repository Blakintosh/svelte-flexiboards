import {
	assistiveTextStyleObject,
	flexiannouncer,
	type InternalFlexiBoardController
} from '@flexiboards/core';
import { useCallback, useId, useState } from 'react';
import { useFromCore } from '../adapter.js';

type FlexiAnnouncerProps = {
	provider: InternalFlexiBoardController;
};

/**
 * @internal Rendered by FlexiBoard. Screen-reader live region announcing
 * drag-and-drop actions.
 */
export function FlexiAnnouncer({ provider }: FlexiAnnouncerProps) {
	// flexiannouncer attaches the controller to the board and has no destroy, so
	// lazy useState rather than useSingleRef holds it for the component's life.
	const [controller] = useState(() => flexiannouncer(provider));
	const id = useId();

	const politeness = useFromCore(useCallback(() => controller.politeness, [controller]));
	const message = useFromCore(useCallback(() => controller.message, [controller]));

	return (
		<div
			role="region"
			aria-live={politeness}
			aria-label="Drag-and-drop announcer"
			aria-atomic="true"
			style={assistiveTextStyleObject}
			id={id}
		>
			{message}
		</div>
	);
}
