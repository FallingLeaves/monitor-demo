export type voidFun = () => void;

/**
 * 上报错误类型
 */

export enum ERRORTYPES {
	UNKNOWN = "UNKNOWN",
	UNKNOWN_FUNCTION = "UNKNOWN_FUNCTION",
	JAVASCRIPT_ERROR = "JAVASCRIPT_ERROR",
	LOG_ERROR = "LOG_ERROR",
	FETCH_ERROR = "FETCH_ERROR",
	RESOURCE_ERROR = "RESOURCE_ERROR",
	PROMISE_ERROR = "PROMISE_ERROR",
	ROUTE_ERROR = "ROUTE_ERROR",
}

export const CompositeEvents = {
	...ERRORTYPES,
};

export type CompositeEvents = typeof CompositeEvents;

/**
 * 用户行为
 */
export enum BREADCRUMBTYPES {
	ROUTE = "Route",
	CLICK = "UI.Click",
	CONSOLE = "Console",
	XHR = "Xhr",
	FETCH = "Fetch",
	UNHANDLEDERJECTION = "Unhandledrejection",
	RESOURCE = 'Resource',
	CODE_ERROR = "Code Error",

	CUSTOMER = "Customer",
}

/**
 * 用户行为类型
 */
export enum BREADCRUMBCATEGORYS {
	HTTP = "http",
	USER = "user",
	DEBUG = "debug",
	EXCEPTION = "exception",
	LIFECYCLE = "lifecycle",
}

/**
 * 重写事件类型
 */
export enum EVENTTYPES {
	XHR = "xhr",
	FETCH = "fetch",
	CONSOLE = "console",
	DOM = "dom",
	HISTORY = "history",
	ERROR = "error",
	HASHCHANGE = "hashchange",
	UNHANDLEDERJECTION = "unhandledrejection",
}

export enum HTTPTYPE {
	XHR = "xhr",
	FETCH = "fetch",
}

export enum HTTP_CODE {
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	INTERNAL_EXCEPTION = 500,
}

export const ERROR_TYPE_RE =
	/^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?(.*)$/;

const globalVar = {
	isLogAddBreadcrumb: true,
	crossOriginThreshold: 1000,
};
export { globalVar };
