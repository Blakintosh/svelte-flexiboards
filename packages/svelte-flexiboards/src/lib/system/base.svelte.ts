export abstract class FlexiControllerBase<T> {
	state: T = $state() as T;

	constructor(state: T) {
		this.state = state;
	}
}
