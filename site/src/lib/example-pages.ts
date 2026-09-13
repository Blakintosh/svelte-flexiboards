type ExamplePage = {
	title: string;
	slug: string;
	description: string;
	href: string;
};

export const examplePages: Record<string, ExamplePage> = {
	dashboard: {
		title: 'Dashboard',
		slug: 'dashboard',
		description:
			'A drag-and-drop SaaS dashboard with an editable, responsive layout that persists between visits.',
		href: '/examples/dashboard'
	},
	notes: {
		title: 'Notes',
		slug: 'notes',
		description: 'A popular note-taking app.',
		href: '/examples/notes'
	},
	flexspressive: {
		title: 'Flexspressive',
		slug: 'flexspressive',
		description: 'All your quick settings.',
		href: '/examples/flexspressive'
	},
	products: {
		title: 'Products',
		slug: 'products',
		description: 'An e-commerce product grid with 2D flow layout.',
		href: '/examples/products'
	},
	numbers: {
		title: 'Numbers',
		slug: 'numbers',
		description: 'Random numbers on a grid. You can add and remove widgets.',
		href: '/examples/numbers'
	},
	flow: {
		title: 'Flow',
		slug: 'flow',
		description: 'A simple 2D flow layout.',
		href: '/examples/flow'
	},
	kanban: {
		title: 'Kanban',
		slug: 'kanban',
		description:
			'A sprint board. Cards move between four flow targets; the column headings are a second, independent board.',
		href: '/examples/kanban'
	},
	'form-builder': {
		title: 'Form Builder',
		slug: 'form-builder',
		description:
			'A drag-and-drop form builder. Fields carry their settings as widget metadata, exported live as JSON.',
		href: '/examples/form-builder'
	},
	compound: {
		title: 'Compound',
		slug: 'compound',
		description:
			'Nested boards. Tiles that are themselves boards, with every drag scoped to the board that owns it.',
		href: '/examples/compound'
	},
	gallery: {
		title: 'Gallery',
		slug: 'gallery',
		description:
			'A cyanotype plate mosaic on a free 2D grid. Resize a plate and its neighbours make room; switch between spring and CSS motion.',
		href: '/examples/gallery'
	},
	launcher: {
		title: 'Launcher',
		slug: 'launcher',
		description: 'A bento home screen that keeps a different layout at every breakpoint.',
		href: '/examples/launcher'
	},
	playlist: {
		title: 'Playlist',
		slug: 'playlist',
		description: 'A keyboard-first sortable list: one flow target, one grab handle per row.',
		href: '/examples/playlist'
	}
};
