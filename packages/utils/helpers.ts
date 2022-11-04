import { AnyObject } from "../types";
import { nativeToString, variableType } from ".";

type TotalEventName =
	| keyof GlobalEventHandlersEventMap
	| keyof XMLHttpRequestEventTargetEventMap
	| keyof WindowEventMap
	| keyof DocumentEventMap;

export function getLocationHref(): string {
	if (typeof document === "undefined" || document.location == null) return "";
	return document.location.href;
}

export function on(
	target: { addEventListener: Function },
	eventName: TotalEventName,
	handler: Function,
	options: boolean | unknown = false
) {
	target.addEventListener(eventName, handler, options);
}

/**
 * 重写某对象上的某个属性
 * @param source 需要重写的对象
 * @param name 重写对象的key
 * @param replacement 以原有函数为参数，重写原函数
 * @param isForced 是否强制重写
 * @returns
 */
export function replaceOld(
	source: AnyObject,
	name: string,
	replacement: (...args: any[]) => any,
	isForced = false
): void {
	if (source === undefined) {
		return;
	}
	if (name in source || isForced) {
		const original = source[name];
		const wrapped = replacement(original);
		if (typeof wrapped === "function") {
			source[name] = wrapped;
		}
	}
}

export function typeofAny(target: any, type: string): boolean {
	return typeof target === type;
}

export function toStringAny(target: any, type: string): boolean {
	return nativeToString.call(target) === type;
}

export function validateOption(
	target: any,
	targetName: string,
	expectType: string
): boolean {
	if (typeofAny(target, expectType)) {
		return true;
	}
	typeof target !== "undefined" &&
		console.log(
			`${targetName}期望传入${expectType}类型，目前是${typeof target}类型`
		);

	return false;
}

export function toStringValidateOption(
	target: any,
	targetName: string,
	expectType: string
): boolean {
	if (toStringAny(target, expectType)) return true;
	typeof target !== "undefined" &&
		console.log(
			`${targetName}期望传入${expectType}类型，目前是${nativeToString.call(
				target
			)}类型`
		);
	return false;
}

export const defaultFunctionName = "<anonymous>";

export function getFunctionName(fn: unknown): string {
	if (!fn || typeof fn !== "function") {
		return defaultFunctionName;
	}
	return fn.name || defaultFunctionName;
}

export const throttle = (fn: Function, delay: number): Function => {
	let canRun = true;
	return function (...args) {
		if (!canRun) {
			return;
		}
		fn.apply(this, args);
		canRun = false;
		setTimeout(() => {
			canRun = true;
		}, delay);
	};
};

export const debounce = (
	fn: Function,
	delay: number,
	isImmediate = false
): Function => {
	let timer = null;
	return function (...args) {
		if (isImmediate) {
			fn.apply(this, args);
			isImmediate = false;
			return;
		}
		clearTimeout(timer);
		timer = setTimeout(() => {
			fn.apply(this, args);
		}, delay);
	};
};

export function interceptStr(str: string, interceptLength: number) {
	if (variableType.isString(str)) {
		return (
			str.slice(0, interceptLength) +
			(str.length > interceptLength ? `:截取前${interceptLength}个字符` : "")
		);
	}
	return "";
}

export function unknownToString(target: unknown): string {
	if (variableType.isString(target)) {
		return target as string;
	}
	if (variableType.isUndefined(target)) {
		return "undefined";
	}
	return JSON.stringify(target);
}
