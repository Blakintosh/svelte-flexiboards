import type { FlexiTargetDefaults } from '../target/types.js';
import type { FlexiWidgetDefaults } from '../widget/types.js';

export type FlexiBoardConfiguration = {
	widgetDefaults?: FlexiWidgetDefaults;
	targetDefaults?: FlexiTargetDefaults;
};
