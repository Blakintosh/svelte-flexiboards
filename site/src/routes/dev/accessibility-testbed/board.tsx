import { FlexiBoard, FlexiTarget, FlexiWidget, FlexiGrab, FlexiResize } from '@flexiboards/react';
const config = {
	columnSizing: '80px',
	rowSizing: '80px',
	layout: { type: 'free', minColumns: 4, maxColumns: 4, minRows: 4, maxRows: 4 }
} as const;
export default function Board() {
	return (
		<FlexiBoard className="test-board">
			<FlexiTarget keyName="main" config={config}>
				<FlexiWidget x={0} y={0} resizability="both">
					<FlexiGrab>Move card</FlexiGrab>
					<FlexiResize>Resize card</FlexiResize>
				</FlexiWidget>
				<FlexiWidget x={2} y={0} width={2} height={2}>
					<button type="button">Card action</button>
				</FlexiWidget>
				<FlexiWidget x={0} y={2} draggability="none" resizability="none">
					<FlexiGrab>Disabled move</FlexiGrab>
				</FlexiWidget>
			</FlexiTarget>
			<FlexiTarget keyName="other" config={config} />
		</FlexiBoard>
	);
}
