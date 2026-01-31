import type { Component } from 'svelte';
import type { FlexiTargetDefaults } from '../target/types.js';
import type { FlexiWidgetChildrenSnippet, FlexiWidgetDefaults } from '../widget/types.js';

export type FlexiBoardConfiguration = {
	widgetDefaults?: FlexiWidgetDefaults;
	targetDefaults?: FlexiTargetDefaults;
	registry?: Record<string, FlexiRegistryEntry>;
	loadLayout?: FlexiLoadLayoutFn;
};

export type FlexiRegistryEntry = Omit<FlexiWidgetDefaults, 'width' | 'height' | 'draggable'>;


export type FlexiWidgetLayoutEntry = {
	registryKey: string;
	x: number;
	y: number;
	width: number;
	height: number;
	metadata?: Record<string, any>;
};

export type FlexiLayout = Record<string, FlexiWidgetLayoutEntry[]>;

export type FlexiLoadLayoutFn = () => FlexiLayout | FlexiWidgetLayoutEntry[] | undefined;