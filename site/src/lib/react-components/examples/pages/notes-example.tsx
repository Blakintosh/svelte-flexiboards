import { FlexiBoard, FlexiTarget, simpleTransitionConfig } from '@flexiboards/react';
import type { FlexiBoardConfiguration } from '@flexiboards/react';
import { ArrowLeft, ArrowRight, Ellipsis } from 'lucide-react';
import Button from '../common/button';
import AppSidebar from '../flexion/app-sidebar';
import FlexionBlockContainer from '../flexion/flexion-block-container';
import FlexionHeadingBlock from '../flexion/flexion-heading-block';
import FlexionKanbanBlock from '../flexion/flexion-kanban-block';
import FlexionQuoteBlock from '../flexion/flexion-quote-block';
import FlexionTextBlock from '../flexion/flexion-text-block';

const boardConfig: FlexiBoardConfiguration = {
	targetDefaults: {
		layout: {
			type: 'flow',
			flowAxis: 'row',
			placementStrategy: 'append'
		}
	},
	widgetDefaults: {
		draggability: 'full',
		transition: simpleTransitionConfig()
	}
};

export default function NotesExample() {
	return (
		<div className="flex h-full min-h-0 w-full grow">
			<AppSidebar />
			<main className="bg-paper flex h-full min-h-0 grow flex-col px-4 py-4 lg:px-8">
				<header className="border-rule-soft mb-8 flex items-center justify-between border-b pb-3">
					<div className="flex items-center gap-4">
						<ul className="hidden items-center lg:flex">
							<li>
								<Button variant="ghost" size="icon" className="rounded-full [&_svg]:size-5">
									<ArrowLeft />
								</Button>
							</li>
							<li>
								<Button
									variant="ghost"
									size="icon"
									disabled
									className="rounded-full [&_svg]:size-5"
								>
									<ArrowRight />
								</Button>
							</li>
						</ul>

						<span className="text-ink text-[12px] font-semibold">Launch plan — 0.5</span>
						<span className="text-faint font-mono text-[11px]">Edited 2h ago</span>
					</div>

					<ul className="flex items-center gap-2">
						<Button variant="ghost" className="hidden rounded-full lg:block">
							Share
						</Button>

						<Button variant="ghost" size="icon" className="rounded-full [&_svg]:size-5">
							<Ellipsis />
						</Button>
					</ul>
				</header>
				<article className="flex min-h-0 w-full grow flex-col">
					<FlexiBoard config={boardConfig} className="overflow-y-auto py-8 2xl:pl-8 2xl:pr-16">
						<h1 className="text-ink mb-8 pl-8 font-serif text-[30px] 2xl:text-[38px]">
							Launch plan — 0.5
						</h1>
						{/* Real page content: the copy explains the demo the reader is dragging. */}
						<FlexiTarget keyName="page" className="gap-6">
							<FlexionBlockContainer
								component={FlexionTextBlock}
								props={{
									content:
										'The 0.5 release lands the React adapter and the new drop resolver. Everything below is drag-sortable — blocks are Flexiboards widgets on a one-column flow grid, so the page itself is the demo.'
								}}
							/>
							<FlexionBlockContainer
								component={FlexionHeadingBlock}
								props={{ content: 'This week' }}
							/>
							<FlexionBlockContainer component={FlexionKanbanBlock} />
							<FlexionBlockContainer
								component={FlexionQuoteBlock}
								props={{
									label: 'Decision:',
									content:
										'we ship 0.5 when the resolver passes the reversal test on touch. No date-driven launches.'
								}}
							/>
							<FlexionBlockContainer
								component={FlexionTextBlock}
								props={{
									content:
										'Rollout: npm first, then the docs switchover. Keep 0.4 docs published for a month behind a version picker.'
								}}
							/>
						</FlexiTarget>
					</FlexiBoard>
				</article>
			</main>
		</div>
	);
}
