import { InitOptions } from "../types";
import { validateOption, toStringValidateOption } from "../utils";
import { breadcrumb } from "./breadcrumb";
import { transportData } from "./transportData";

export class Options {
	beforeAppAjaxSend: Function = () => {};
	filterXhrUrlRegExp: RegExp;
	filterDOMRegExp: RegExp;
	onRouteChange?: Function;
	throttleDelayTime = 0;
	maxDuplicateCount = 2;
	maxBreadcrumbs = 20;
	reportUIClick = false;

	constructor() {}

	bindOptions(options: InitOptions = {}) {
		const {
			beforeAppAjaxSend,
			onRouteChange,
			filterXhrUrlRegExp,
			throttleDelayTime,
			maxDuplicateCount,
			maxBreadcrumbs,
			reportUIClick,
			filterDOMRegExp,
		} = options;
		if (validateOption(beforeAppAjaxSend, "beforeAppAjaxSend", "function")) {
			this.beforeAppAjaxSend = beforeAppAjaxSend;
		}
		if (validateOption(onRouteChange, "onRouteChange", "function")) {
			this.onRouteChange = onRouteChange;
		}
		if (validateOption(throttleDelayTime, "throttleDelayTime", "number")) {
			this.throttleDelayTime = throttleDelayTime;
		}
		if (validateOption(maxBreadcrumbs, "maxBreadcrumbs", "number")) {
			this.maxBreadcrumbs = maxBreadcrumbs;
		}
		if (validateOption(maxDuplicateCount, "maxDuplicateCount", "number")) {
			this.maxDuplicateCount = maxDuplicateCount;
		}
		if (validateOption(reportUIClick, "reportUIClick", "boolean")) {
			this.reportUIClick = reportUIClick;
		}
		if (
			toStringValidateOption(
				filterXhrUrlRegExp,
				"filterXhrUrlRegExp",
				"[object RegExp]"
			)
		) {
			this.filterXhrUrlRegExp = filterXhrUrlRegExp;
		}
		if (
			toStringValidateOption(
				filterDOMRegExp,
				"filterDOMRegExp",
				"[object RegExp]"
			)
		) {
			this.filterDOMRegExp = filterDOMRegExp;
		}
	}
}

const options = new Options();

export function initOptions(paramOptions: InitOptions = {}) {
	console.log(paramOptions);
	
	breadcrumb.bindOptions(paramOptions);
	transportData.bindOptions(paramOptions);
	options.bindOptions(paramOptions);
}

export { options };
