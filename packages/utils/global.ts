import { EVENTTYPES } from "../shared/constant";
import { variableType } from "./is";

interface MyGlobal {
	console?: Console;
}

export const isBrowserEnv = variableType.isWindow(
	typeof window !== "undefined" ? window : 0
);

export function getGlobal<T>() {
	if (isBrowserEnv) {
		return window as unknown as MyGlobal & T;
	}
}

const _global = getGlobal<Window>();

const replaceFlag = {};

export function setFlag(replaceType: EVENTTYPES, isSet: boolean) {
	if (replaceFlag[replaceType]) {
		return;
	}
	replaceFlag[replaceType] = isSet;
}

export function getFlag(replaceType: EVENTTYPES) {
	return replaceFlag[replaceType] ? true : false;
}

export function supportsHistory(): boolean {
	const chrome = (_global as any).chrome;
	const isChromePackagedApp = chrome && chrome.app && chrome.app.runtime;
	const hasHistoryApi =
		"history" in _global &&
		!!_global.history.pushState &&
		!!_global.history.replaceState;

	return !isChromePackagedApp && hasHistoryApi;
}

export { _global };
