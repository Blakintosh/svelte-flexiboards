export abstract class FlexiControllerBase<T> {
	protected state: T = $state() as T;

	constructor(state: T) {
		this.state = state;
	}
}
