interface PromiseItem {
	asyncF: Function;
	resolution: Function;
	rejection: Function;
}

const operationQueue: PromiseItem[] = [];
let operationRunning: boolean = false;

async function operationsRecursion(): Promise<void> {
	while (operationQueue.length > 0 && !operationRunning) {
		const nextOperation = operationQueue.shift();
		operationRunning = true;
		try {
			const result = await nextOperation.asyncF();
			nextOperation.resolution(result);
		} catch (error) {
			nextOperation.rejection(error);
		}
		operationRunning = false;
		operationsRecursion();
	}
}

export function invokeInQueue(asyncF: Function): Promise<any> {
	return new Promise((resolve, reject) => {
		operationQueue.push({
			asyncF,
			resolution: resolve,
			rejection: reject,
		});
		operationsRecursion();
	});
}
