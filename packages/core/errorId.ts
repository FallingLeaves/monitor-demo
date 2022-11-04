import { ERRORTYPES, EVENTTYPES } from "../shared";
import { variableType } from "../utils";
import { ReportDataType } from "../types";
import { options } from "./options";

const allErrorNumber: unknown = {};

export function getRealPath(url: string): string {
	return url.replace(/[\?#].*$/, "").replace(/\/\d+([\/]*$)/, "{param}$1");
}

function generatePromiseErrorId(data: ReportDataType, apiKey: string) {
	const locationUrl = getRealPath(data.url);
	if (data.name === EVENTTYPES.UNHANDLEDERJECTION) {
		return data.type + objectOrder(data.message) + apiKey;
	}
	return data.type + data.name + objectOrder(data.message) + locationUrl;
}

function objectOrder(reason) {
	const sortFn = (obj) => {
		return Object.keys(obj)
			.sort()
			.reduce((total, key) => {
				if (variableType.isObject(obj[key])) {
					total[key] = sortFn(obj[key]);
				} else {
					total[key] = obj[key];
				}
				return total;
			}, {});
	};
	try {
		if (/\{.*\}/.test(reason)) {
			let obj = JSON.parse(reason);
			obj = sortFn(obj);
			return JSON.stringify(obj);
		}
	} catch (error) {
		return reason;
	}
}

export function createErroeId(
	data: ReportDataType,
	apiKey: string
): number | null {
	let id: any;
	switch (data.type) {
		case ERRORTYPES.FETCH_ERROR:
			id =
				data.type +
				data.request.method +
				data.response.data +
				getRealPath(data.request.url) +
				apiKey;
			break;
		case ERRORTYPES.JAVASCRIPT_ERROR:
			id = data.type + data.name + data.message + apiKey;
			break;
		case ERRORTYPES.LOG_ERROR:
			id = data.customTag + data.type + data.name + apiKey;
			break;
		case ERRORTYPES.PROMISE_ERROR:
			id = generatePromiseErrorId(data, apiKey);
			break;
		default:
			id = data.type + data.message + apiKey;
			break;
	}
	id = hasCode(id);
	if (allErrorNumber[id] >= options.maxDuplicateCount) {
		return null;
	}
	if (typeof allErrorNumber[id] === "number") {
		allErrorNumber[id]++;
	} else {
		allErrorNumber[id] = 1;
	}
	return id;
}

export function hasCode(str: string) {
	let hash = 0;
	if (str.length === 0) {
		return hash;
	}
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return hash;
}
