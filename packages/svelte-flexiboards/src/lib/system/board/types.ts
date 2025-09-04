import type { Component } from 'svelte';
import type { FlexiTargetDefaults } from '../target/types.js';
import type { FlexiWidgetChildrenSnippet, FlexiWidgetDefaults } from '../widget/types.js';

export type FlexiBoardConfiguration = {
	widgetDefaults?: FlexiWidgetDefaults;
	targetDefaults?: FlexiTargetDefaults;
	registry?: Record<string, FlexiRegistryEntry>;
};

export type FlexiRegistryEntry = FlexiWidgetDefaults;

export type FlexiWidgetLayoutEntry = {
	registryKey: string;
	x: number;
	y: number;
	width: number;
	height: number;
	name?: string;
	metadata?: Record<string, any>;
};