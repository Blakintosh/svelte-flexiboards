import {
	assistiveTextStyleObject,
	FlexiAnnouncerController,
	type InternalFlexiBoardController
} from '@flexiboards/core';
import { useCallback, useEffect, useId, useState } from 'react';
import { useFromCore } from '../adapter.js';

type FlexiAnnouncerProps = {
	provider: InternalFlexiBoardController;
};

/**
 * @internal Rendered by FlexiBoard. Screen-reader live region announcing
 * drag-and-drop actions.
 */
export function FlexiAnnouncer({ provider }: FlexiAnnouncerProps) {
	const [controller] = useState(() => new FlexiAnnouncerController(provider));
	// Attach after commit: StrictMode may discard an initializer's controller.
	useEffect(() => {
		provider.attachAnnouncer(controller);
		return () => controller.destroy();
	}, [provider, controller]);
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
