import { FlexiBoard, FlexiTarget, FlexiWidget } from './index.js';
import './App.css';

function App() {
	return (
		<main>
			<h1>@flexiboards/react demo</h1>
			<FlexiBoard>
				<FlexiTarget
					keyName="demo"
					className="demo-grid"
					config={{
						layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 }
					}}
				>
					<FlexiWidget x={0} y={0} width={1} height={1} className="demo-widget">
						{() => <span>Widget A</span>}
					</FlexiWidget>
					<FlexiWidget x={1} y={1} width={2} height={1} className="demo-widget">
						{() => <span>Widget B</span>}
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
		</main>
	);
}

export default App;
