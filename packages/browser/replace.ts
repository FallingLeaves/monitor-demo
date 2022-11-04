import { MITOHttp } from "../types/common";
import { XhrMethods } from "../types/options";
import {
	getLocationHref,
	on,
	replaceOld,
	supportsHistory,
	throttle,
	variableType,
	_global,
} from "../utils";
import { options, transportData } from "../core";
import { EVENTTYPES, HTTPTYPE, HTTP_CODE, voidFun } from "../shared";
import { MITOXMLHttpRequest } from "../types";
import {
	ReplaceHandler,
	subscribeEvent,
	triggerHandlers,
} from "../core/subscribe";

function isFilterHttpUrl(url: string) {
	return options.filterXhrUrlRegExp && options.filterXhrUrlRegExp.test(url);
}

function replace(type: EVENTTYPES) {
	switch (type) {
		case EVENTTYPES.XHR:
			xhrReplace();
			break;
		case EVENTTYPES.FETCH:
			fetchReplace();
			break;
		case EVENTTYPES.ERROR:
			listenError();
			break;
		case EVENTTYPES.CONSOLE:
			consoleReplace();
			break;
		case EVENTTYPES.HISTORY:
			historyReplace();
			break;
		case EVENTTYPES.UNHANDLEDERJECTION:
			unhandledrejectionReplace();
			break;
		case EVENTTYPES.DOM:
			domReplace();
			break;
		default:
			break;
	}
}

export function addReplaceHandler(handler: ReplaceHandler) {
	if (!subscribeEvent(handler)) {
		return;
	}
	replace(handler.type as EVENTTYPES);
}

function xhrReplace(): void {
	if (!("XMLHttpRequest" in _global)) {
		return;
	}
	const originalXhrProto = XMLHttpRequest.prototype;
	replaceOld(originalXhrProto, "open", (originalOpen: voidFun): voidFun => {

		return function (this: MITOXMLHttpRequest, ...args: any[]): void {
			this.mito_xhr = {
				method: variableType.isString(args[0])
					? args[0]
					: args[0].toUpperCase(),
				url: args[1],
				sTime: Date.now(),
				type: HTTPTYPE.XHR,
			};

			originalOpen.apply(this, args);
		};
	});

	replaceOld(originalXhrProto, "send", (originalSend: voidFun): voidFun => {

		return function (this: MITOXMLHttpRequest, ...args: any[]): void {
			const { method, url } = this.mito_xhr;
			if (options.beforeAppAjaxSend) {
				options.beforeAppAjaxSend({ method, url }, this);
			}
			on(this, "readystatechange", function (this: MITOXMLHttpRequest) {
				if (
					(method === XhrMethods.Post &&
						transportData.isSdkTransportUrl(url)) ||
					isFilterHttpUrl(url)
				) {
					return;
				}
				const { responseType, response, status, readyState } = this;
				if (readyState === 4) {
					this.mito_xhr.reqData = args[0];
					const eTime = Date.now();
					this.mito_xhr.time = this.mito_xhr.sTime;
					this.mito_xhr.status = status;
					if (["", "json", "text"].indexOf(responseType) !== -1) {
						this.mito_xhr.responseText =
							typeof response === "object"
								? JSON.stringify(response)
								: response;
					}
					this.mito_xhr.elapsedTime = eTime - this.mito_xhr.sTime;
					triggerHandlers(EVENTTYPES.XHR, this.mito_xhr);
				}
			});
			// on(this, "loadend", function (this: MITOXMLHttpRequest) {
			// 	if (
			// 		(method === XhrMethods.Post &&
			// 			transportData.isSdkTransportUrl(url)) ||
			// 		isFilterHttpUrl(url)
			// 	) {
			// 		return;
			// 	}
			// 	const { responseType, response, status } = this;
			// 	this.mito_xhr.reqData = args[0];
			// 	const eTime = Date.now();
			// 	this.mito_xhr.time = this.mito_xhr.sTime;
			// 	this.mito_xhr.status = status;
			// 	if (["", "json", "text"].indexOf(responseType) !== -1) {
			// 		this.mito_xhr.responseText =
			// 			typeof response === "object" ? JSON.stringify(response) : response;
			// 	}
			// 	this.mito_xhr.elapsedTime = eTime - this.mito_xhr.sTime;
			// 	triggerHandlers(EVENTTYPES.XHR, this.mito_xhr);
			// });

			originalSend.apply(this, args);
		};
	});
}

function fetchReplace(): void {
	if (!("fetch" in _global)) {
		return;
	}

	replaceOld(_global, EVENTTYPES.FETCH, (originalFetch: voidFun) => {
		return function (url: string, config: Partial<Request> = {}) {
			const sTime = Date.now();
			const method = (config && config.method) || "GET";
			let handlerData: MITOHttp = {
				type: HTTPTYPE.FETCH,
				method,
				reqData: config && config.body,
				url,
			};
			const headers = new Headers(config.headers || {});
			Object.assign(headers, {
				setRequestHeader: headers.set,
			});
			if (options.beforeAppAjaxSend) {
				options.beforeAppAjaxSend({ method, url }, headers);
			}
			config = {
				...config,
				headers,
			};

			return originalFetch.apply(_global, [url, config]).then(
				(res: Response) => {
					const tempRes = res.clone();
					const eTime = Date.now();
					handlerData = {
						...handlerData,
						elapsedTime: eTime - sTime,
						status: tempRes.status,
						time: sTime,
					};
					tempRes.text().then((data) => {
						if (
							method === XhrMethods.Post &&
							transportData.isSdkTransportUrl(url)
						) {
							return;
						}
						if (isFilterHttpUrl(url)) {
							return;
						}
						handlerData.responseText =
							tempRes.status > HTTP_CODE.UNAUTHORIZED && data;
						triggerHandlers(EVENTTYPES.FETCH, handlerData);
					});
				},
				(err: Error) => {
					const eTime = Date.now();
					if (
						method === XhrMethods.Post &&
						transportData.isSdkTransportUrl(url)
					) {
						return;
					}
					if (isFilterHttpUrl(url)) {
						return;
					}
					handlerData = {
						...handlerData,
						elapsedTime: eTime - sTime,
						status: 0,
						time: sTime,
					};
					triggerHandlers(EVENTTYPES.FETCH, handlerData);
					throw err;
				}
			);
		};
	});
}

function listenError() {
	on(
		_global,
		"error",
		function (e: ErrorEvent) {
			triggerHandlers(EVENTTYPES.ERROR, e);
		},
		true
	);
}

function consoleReplace() {
	if (!("console" in _global)) {
		return;
	}
	const logType = ["log", "debug", "info", "warn", "error", "assert"];
	logType.forEach(function (level) {
		if (!(level in _global.console)) {
			return;
		}
		replaceOld(
			_global.console,
			level,
			function (originalConsole: () => any): Function {
				return function (...args: any[]) {
					if (originalConsole) {
						triggerHandlers(EVENTTYPES.CONSOLE, { args, level });
						originalConsole.apply(_global.console, args);
					}
				};
			}
		);
	});
}

let lastHref: string;
lastHref = getLocationHref();
function historyReplace() {
	if (!supportsHistory()) {
		return;
	}
	const oldOnpopstate = _global.onpopstate;
	_global.onpopstate = function (this: WindowEventHandlers, ...args: any[]) {
		const to = getLocationHref();
		const from = lastHref;
		triggerHandlers(EVENTTYPES.HISTORY, { from, to });
		oldOnpopstate && oldOnpopstate.apply(this, args);
	};

	function historyReplaceFn(originalHistoryFn: voidFun): voidFun {
		return function (this: History, ...args: any[]) {
			const url = args.length > 2 ? args[2] : undefined;
			if (url) {
				const from = lastHref;
				const to = String(url);
				lastHref = to;
				triggerHandlers(EVENTTYPES.HISTORY, { from, to });
				return originalHistoryFn.apply(this, args);
			}
		};
	}

	replaceOld(_global.history, "pushState", historyReplaceFn);
	replaceOld(_global.history, "replaceState", historyReplaceFn);
}

function unhandledrejectionReplace() {
	on(
		_global,
		EVENTTYPES.UNHANDLEDERJECTION,
		function (e: PromiseRejectionEvent) {
			triggerHandlers(EVENTTYPES.UNHANDLEDERJECTION, e);
		}
	);
}

function domReplace() {
	if (!("document" in _global)) {
		return;
	}
	const clickThrottle = throttle(triggerHandlers, options.throttleDelayTime);
	on(_global.document, "click", function () {
		clickThrottle(
			EVENTTYPES.DOM,
			{
				category: "click",
				data: this,
			},
			true
		);
	});
}
