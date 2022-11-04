import { voidFun } from "../shared";

export function nativeTryCatch(fn: voidFun, errorFn?: (err: any) => void) {
	try {
		fn();
	} catch (err) {
		console.log("err", err);
		if (errorFn) {
			errorFn(err);
		}
	}
}
