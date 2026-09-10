/**
 * API reference extractor.
 *
 * Pulls the documented public surface (component props, controller members,
 * configuration objects) straight out of the workspace TypeScript sources via
 * the compiler, so the docs tables can't drift from the code. JSDoc on the
 * declarations is the single source of truth for descriptions.
 *
 * Run: node scripts/extract-api.mjs   (also chained into the site build)
 * Output: src/lib/generated/api/<component>.json
 */

import { Project, Node, SyntaxKind } from 'ts-morph';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.resolve(repoRoot, 'site/src/lib/generated/api');

/**
 * What to extract. `svelte` points at the adapter component whose module
 * script exports `propsType`; `controller` and `configuration` name exported
 * symbols in @flexiboards/core.
 */
const manifest = [
	{
		id: 'flexi-board',
		component: 'FlexiBoard',
		svelte: 'packages/svelte/src/components/flexi-board.svelte',
		react: 'packages/react/src/components/flexi-board.tsx',
		propsType: 'FlexiBoardProps',
		controller: 'FlexiBoardController',
		types: [
			'FlexiBoardConfiguration',
			'FlexiTargetDefaults',
			'FlexiWidgetDefaults',
			'FlexiWidgetLayoutEntry',
			'FlexiRegistryEntry',
			'FlexiWidgetEvent',
			'FlexiWidgetDropEvent',
			'FlexiDropCheck'
		]
	},
	{
		id: 'flexi-sortable',
		component: 'FlexiSortable',
		svelte: 'packages/svelte/src/components/flexi-sortable.svelte',
		react: 'packages/react/src/components/flexi-sortable.tsx',
		propsType: 'FlexiSortableProps',
		types: []
	},
	{
		id: 'flexi-dashboard',
		component: 'FlexiDashboard',
		svelte: 'packages/svelte/src/components/flexi-dashboard.svelte',
		react: 'packages/react/src/components/flexi-dashboard.tsx',
		propsType: 'FlexiDashboardProps',
		types: []
	},
	{
		id: 'flexi-target',
		component: 'FlexiTarget',
		svelte: 'packages/svelte/src/components/flexi-target.svelte',
		react: 'packages/react/src/components/flexi-target.tsx',
		propsType: 'FlexiTargetProps',
		controller: 'FlexiTargetController',
		types: [
			'FlexiTargetPartialConfiguration',
			'FlexiWidgetDefaults',
			'FlowTargetLayout',
			'FreeFormTargetLayout'
		]
	},
	{
		id: 'flexi-widget',
		component: 'FlexiWidget',
		svelte: 'packages/svelte/src/components/flexi-widget.svelte',
		react: 'packages/react/src/components/flexi-widget.tsx',
		propsType: 'FlexiWidgetProps',
		controller: 'FlexiWidgetController',
		types: ['FlexiWidgetConfiguration', 'FlexiWidgetTransitionConfiguration']
	},
	{
		id: 'flexi-grab',
		component: 'FlexiGrab',
		svelte: 'packages/svelte/src/components/flexi-grab.svelte',
		react: 'packages/react/src/components/flexi-grab.tsx',
		propsType: 'FlexiGrabProps',
		types: []
	},
	{
		id: 'flexi-resize',
		component: 'FlexiResize',
		svelte: 'packages/svelte/src/components/flexi-resize.svelte',
		react: 'packages/react/src/components/flexi-resize.tsx',
		propsType: 'FlexiResizeProps',
		types: []
	},
	{
		id: 'responsive-flexi-board',
		component: 'ResponsiveFlexiBoard',
		svelte: 'packages/svelte/src/components/responsive-flexi-board.svelte',
		react: 'packages/react/src/components/responsive-flexi-board.tsx',
		propsType: 'ResponsiveFlexiBoardProps',
		controller: 'ResponsiveFlexiBoardController',
		types: ['ResponsiveFlexiBoardConfiguration']
	},
	{
		id: 'flexi-add',
		component: 'FlexiAdd',
		svelte: 'packages/svelte/src/components/flexi-add.svelte',
		react: 'packages/react/src/components/flexi-add.tsx',
		propsType: 'FlexiAddProps',
		controller: 'FlexiAddController',
		types: ['AdderWidgetConfiguration']
	},
	{
		id: 'flexi-delete',
		component: 'FlexiDelete',
		svelte: 'packages/svelte/src/components/flexi-delete.svelte',
		react: 'packages/react/src/components/flexi-delete.tsx',
		propsType: 'FlexiDeleteProps',
		controller: 'FlexiDeleteController',
		types: []
	}
];

/**
 * Core erases framework render types to `unknown`; the Svelte adapter narrows
 * them at runtime. Present the narrowed spelling in the Svelte docs.
 */
const typeLabels = {
	FlexiWidgetChildrenSnippet: 'Snippet<[{ widget: FlexiWidgetController }]>',
	FlexiComponent: 'Component',
	FlexiContent: 'Snippet',
	FlexiWidgetClasses: 'ClassValue | ((widget: FlexiWidgetController) => ClassValue)',
	FlexiAddClasses: 'ClassValue | ((adder: FlexiAddController) => ClassValue)',
	FlexiAddWidgetFn: '() => AdderWidgetConfiguration | null',
	FlexiLoadLayoutFn: '() => FlexiLayout | FlexiWidgetLayoutEntry[] | undefined',
	FlexiLayoutChangeFn: '(layout: FlexiLayout) => void',
	ResponsiveFlexiLoadLayoutFn: '() => ResponsiveFlexiLayout | undefined',
	ResponsiveFlexiLayoutChangeFn: '(layouts: ResponsiveFlexiLayout) => void',
	FlexiDeleteClasses: 'ClassValue | ((deleter: FlexiDeleteController) => ClassValue)',
	FlexiWidgetTransitionTypeConfiguration:
		'{ duration?: number; easing?: string } | AnimationAdapter',
	TargetSizing:
		'string | (({ target, grid }: { target: FlexiTargetController; grid: FlexiGrid }) => string)'
};

const project = new Project({
	compilerOptions: {
		target: 99, // ESNext
		module: 99,
		moduleResolution: 100, // Bundler
		strict: true,
		baseUrl: repoRoot,
		paths: {
			'@flexiboards/core': ['packages/core/src/index.ts']
		}
	}
});

project.addSourceFilesAtPaths(path.join(repoRoot, 'packages/core/src/**/*.ts'));

/**
 * Aliases that are plain string-literal unions (e.g. WidgetResizability) get
 * expanded inline in the docs — the alias name alone tells a reader nothing.
 */
const literalAliases = new Map();
for (const file of project.getSourceFiles()) {
	for (const alias of file.getTypeAliases()) {
		const node = alias.getTypeNode();
		if (!node || !Node.isUnionTypeNode(node)) continue;
		const parts = node.getTypeNodes();
		const allLiterals = parts.every(
			(p) => Node.isLiteralTypeNode(p) && Node.isStringLiteral(p.getLiteral())
		);
		if (allLiterals) literalAliases.set(alias.getName(), node.getText());
	}
}

/** The React adapter instantiates the same core generics with `string` classes and render functions. */
const typeLabelsReact = {
	FlexiWidgetChildrenSnippet: '(params: { widget: FlexiWidgetController }) => ReactNode',
	FlexiComponent: 'ComponentType',
	FlexiContent: 'ReactNode',
	FlexiWidgetClasses: 'string | ((widget: FlexiWidgetController) => string)',
	FlexiAddClasses: 'string | ((adder: FlexiAddController) => string)',
	FlexiDeleteClasses: 'string | ((deleter: FlexiDeleteController) => string)'
};

function presentType(text, labels = typeLabels) {
	let out = text
		.replace(/import\("[^"]*"\)\./g, '')
		.replace(/\s+/g, ' ')
		.trim()
		// The React adapter's render-prop union, spelled out at its instantiation.
		.replace(/\bFlexiChildren<(\{[^}]*\})>/g, 'ReactNode | ((params: $1) => ReactNode)');
	for (const [name, label] of Object.entries({ ...typeLabels, ...labels })) {
		out = out.replace(new RegExp(`\\b${name}\\b`, 'g'), label);
	}
	for (const [name, expansion] of literalAliases) {
		out = out.replace(new RegExp(`\\b${name}\\b`, 'g'), expansion);
	}
	return out;
}

function jsDocInfo(decl) {
	const docs = Node.isJSDocable(decl) ? decl.getJsDocs() : [];
	const info = { description: '' };
	for (const doc of docs) {
		const desc = doc.getDescription().trim();
		if (desc) info.description = desc.replace(/\s+/g, ' ');
		for (const tag of doc.getTags()) {
			const tagName = tag.getTagName();
			const comment = (tag.getCommentText() ?? '').replace(/\s+/g, ' ').trim();
			if (tagName === 'deprecated') info.deprecated = comment || 'Deprecated.';
			if (tagName === 'default') info.default = comment;
			if (tagName === 'internal') info.internal = true;
		}
	}
	return info;
}

/** Flatten a (possibly intersected) object type into documented entries. */
function extractMembers(type, { bindables = new Set(), location, labels } = {}) {
	const entries = [];
	for (const symbol of type.getProperties()) {
		// A member re-declared on a later intersection arm (e.g. width on both
		// FlexiWidgetDefaults and FlexiWidgetConfiguration) is documented by the
		// most specific — last — JSDoc'd declaration.
		const decls = symbol.getDeclarations();
		const decl =
			decls
				.slice()
				.reverse()
				.find((d) => Node.isJSDocable(d) && d.getJsDocs().length > 0) ?? decls[0];
		if (!decl) continue;
		const doc = jsDocInfo(decl);
		if (doc.internal) continue;

		let typeText;
		const enclosingAlias = decl.getFirstAncestorByKind(SyntaxKind.TypeAliasDeclaration);
		const isGenericMember = (enclosingAlias?.getTypeParameters().length ?? 0) > 0;
		if (isGenericMember && location) {
			// Generic members (FlexiCommonProps<T>) only mean something once
			// instantiated; resolve at the usage site so T becomes concrete.
			typeText = symbol.getTypeAtLocation(location).getText(location);
		} else if (Node.isPropertySignature(decl) || Node.isPropertyDeclaration(decl)) {
			typeText = decl.getTypeNode()?.getText();
		}
		typeText ??= symbol.getTypeAtLocation(decl).getText(decl);

		const entry = {
			name: symbol.getName(),
			type: presentType(typeText, labels),
			description: doc.description
		};
		if (doc.deprecated) entry.deprecated = doc.deprecated;
		if (doc.default) entry.default = doc.default;
		if (bindables.has(entry.name)) entry.bindable = true;
		entries.push(entry);
	}
	return entries;
}

function methodTypeText(member) {
	const params = member
		.getParameters()
		.map((p) => `${p.getName()}: ${presentType(p.getTypeNode()?.getText() ?? 'unknown')}`)
		.join(', ');
	const ret = presentType(
		member.getReturnTypeNode()?.getText() ?? member.getReturnType().getText(member)
	);
	return `(${params}) => ${ret}`;
}

/** Public properties, getters, and methods of a controller class or interface. */
function extractController(decl) {
	const properties = [];
	const methods = [];
	const isClass = Node.isClassDeclaration(decl);
	const isPublic = (m) =>
		!m.getName().startsWith('#') && (!isClass || (m.getScope?.() ?? 'public') === 'public');
	const setters = new Set(decl.getSetAccessors().map((s) => s.getName()));

	for (const member of [...decl.getProperties(), ...decl.getGetAccessors()]) {
		if (!isPublic(member)) continue;
		const doc = jsDocInfo(member);
		if (doc.internal) continue;
		const isGetter = Node.isGetAccessorDeclaration(member);
		const typeText = isGetter
			? (member.getReturnTypeNode()?.getText() ?? member.getReturnType().getText(member))
			: (member.getTypeNode()?.getText() ?? member.getType().getText(member));
		const entry = {
			name: member.getName(),
			type: presentType(typeText),
			description: doc.description
		};
		const isReadonly = isGetter
			? !setters.has(member.getName())
			: member.hasModifier?.(SyntaxKind.ReadonlyKeyword);
		if (isReadonly) entry.readonly = true;
		if (doc.deprecated) entry.deprecated = doc.deprecated;
		properties.push(entry);
	}

	for (const method of decl.getMethods()) {
		if (!isPublic(method)) continue;
		const doc = jsDocInfo(method);
		if (doc.internal) continue;
		const entry = {
			name: method.getName(),
			type: methodTypeText(method),
			description: doc.description
		};
		if (doc.deprecated) entry.deprecated = doc.deprecated;
		methods.push(entry);
	}

	return { name: decl.getName(), properties, methods };
}

/** Locate an exported class, interface, or type alias across the core sources. */
function findCoreDeclaration(name) {
	for (const file of project.getSourceFiles()) {
		const found = file.getClass(name) ?? file.getInterface(name) ?? file.getTypeAlias(name);
		if (found) return found;
	}
	throw new Error(`Could not find core declaration ${name}`);
}

for (const entry of manifest) {
	const sveltePath = path.join(repoRoot, entry.svelte);
	const svelteSource = readFileSync(sveltePath, 'utf-8');

	// The props type lives in the component's `<script module>`, but its imports
	// may be split across the module and instance scripts. Lift both blocks into
	// a sibling virtual .ts file so relative imports still resolve; runtime
	// errors in the concatenation are irrelevant to type extraction.
	const scripts = [...svelteSource.matchAll(/<script[^>]*lang="ts"[^>]*>([\s\S]*?)<\/script>/g)]
		.map((m) => m[1])
		.join('\n');
	if (!scripts) throw new Error(`No TS scripts found in ${entry.svelte}`);
	const virtualFile = project.createSourceFile(
		sveltePath.replace(/\.svelte$/, '.__docs__.ts'),
		scripts,
		{ overwrite: true }
	);

	// Bindable props are a Svelte-instance-script fact ($bindable), not a type-level one.
	const bindables = new Set(
		[...svelteSource.matchAll(/(\w+)(?:\s*=\s*|\s*:\s*\w+\s*=\s*)\$bindable/g)].map((m) => m[1])
	);

	const propsAlias = virtualFile.getTypeAlias(entry.propsType);
	if (!propsAlias) throw new Error(`${entry.propsType} not exported from ${entry.svelte}`);

	// React props come straight from the .tsx component's exported props type.
	let propsReact;
	if (entry.react) {
		const reactFile = project.addSourceFileAtPath(path.join(repoRoot, entry.react));
		const reactAlias = reactFile.getTypeAlias(entry.propsType);
		if (!reactAlias) throw new Error(`${entry.propsType} not exported from ${entry.react}`);
		propsReact = extractMembers(reactAlias.getType(), {
			location: reactAlias,
			labels: typeLabelsReact
		});
	}

	const types = {};
	for (const typeName of entry.types) {
		types[typeName] = extractMembers(findCoreDeclaration(typeName).getType());
	}

	const result = {
		component: entry.component,
		generatedFrom: [entry.svelte, ...(entry.react ? [entry.react] : []), 'packages/core/src'],
		props: extractMembers(propsAlias.getType(), { bindables, location: propsAlias }),
		...(propsReact && { propsReact }),
		...(entry.controller && { controller: extractController(findCoreDeclaration(entry.controller)) }),
		types
	};

	mkdirSync(outDir, { recursive: true });
	const outPath = path.join(outDir, `${entry.id}.json`);
	writeFileSync(outPath, JSON.stringify(result, null, '\t') + '\n');
	console.log(
		`✓ ${entry.component}: ${result.props.length} props, ` +
			`${result.controller?.properties.length ?? 0} controller properties, ` +
			`${result.controller?.methods.length ?? 0} methods, ` +
			`types [${Object.entries(types)
				.map(([n, e]) => `${n}:${e.length}`)
				.join(', ')}] → ${path.relative(repoRoot, outPath)}`
	);
}
