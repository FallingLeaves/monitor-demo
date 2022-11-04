import {
	breadcrumb,
	httpTransform,
	options,
	resourceTransform,
	transportData,
} from "../core";
import {
	BREADCRUMBTYPES,
	ERRORTYPES,
	ERROR_TYPE_RE,
	HTTP_CODE,
} from "../shared";
import { Replace, ReportDataType } from "../types";
import {
	extractErrorStack,
	getLocationHref,
	isError,
	parseUrlToObj,
	Severity,
	unknownToString,
} from "../utils";
import { MITOHttp, ResourceErrorTarget } from "../types/common";
const HandleEvents = {
	// 处理xhr fetch
	handleHttp(data: MITOHttp, type: BREADCRUMBTYPES) {
		const isError =
			data.status === 0 ||
			data.status === HTTP_CODE.BAD_REQUEST ||
			data.status > HTTP_CODE.UNAUTHORIZED;
		const result = httpTransform(data);
		breadcrumb.push({
			type,
			category: breadcrumb.getCategory(type),
			data: { ...result },
			level: Severity.Info,
			time: data.time,
		});
		if (isError) {
			breadcrumb.push({
				type,
				category: breadcrumb.getCategory(BREADCRUMBTYPES.CODE_ERROR),
				data: { ...result },
				level: Severity.Error,
				time: data.time,
			});
			transportData.send(result);
		}
	},
	// 处理window的error
	handleError(errorEvent: ErrorEvent) {
		const target = errorEvent.target as ResourceErrorTarget;
		if (target.localName) {
			// 资源加载失败
			const data = resourceTransform(errorEvent.target as ResourceErrorTarget);
			breadcrumb.push({
				type: BREADCRUMBTYPES.RESOURCE,
				category: breadcrumb.getCategory(BREADCRUMBTYPES.RESOURCE),
				data,
				level: Severity.Error,
			});
			return transportData.send(data);
		}
		// code error
		const { message, filename, lineno, colno, error } = errorEvent;
		let result: ReportDataType;
		if (error && isError(error)) {
			result = extractErrorStack(error, Severity.Normal);
		}
		// 处理 SyntaxError
		if (!result) {
			result = HandleEvents.handleNotErrorInstance(
				message,
				filename,
				lineno,
				colno
			);
		}
		result.type = ERRORTYPES.JAVASCRIPT_ERROR;
		breadcrumb.push({
			type: BREADCRUMBTYPES.CODE_ERROR,
			category: breadcrumb.getCategory(BREADCRUMBTYPES.CODE_ERROR),
			data: { ...result },
			level: Severity.Error,
		});
		transportData.send(result);
	},
	handleNotErrorInstance(
		message: string,
		filename: string,
		lineno: number,
		colno: number
	) {
		let name: string | ERRORTYPES = ERRORTYPES.UNKNOWN;
		const url = filename || getLocationHref();
		let msg = message;
		const matches = message.match(ERROR_TYPE_RE);
		if (matches[1]) {
			name = matches[1];
			msg = matches[2];
		}
		const element = {
			url,
			func: ERRORTYPES.UNKNOWN_FUNCTION,
			args: ERRORTYPES.UNKNOWN,
			line: lineno,
			col: colno,
		};
		return {
			url,
			name,
			message: msg,
			level: Severity.Normal,
			time: Date.now(),
			stack: [element],
		};
	},
	handleHistory(data: Replace.IRouter) {
		const { from, to } = data;
		const { relative: parsedFrom } = parseUrlToObj(from);
		const { relative: parsedTo } = parseUrlToObj(to);
		breadcrumb.push({
			type: BREADCRUMBTYPES.ROUTE,
			category: breadcrumb.getCategory(BREADCRUMBTYPES.ROUTE),
			data: {
				from: parsedFrom ? parsedFrom : "/",
				to: parsedTo ? parsedTo : "/",
			},
			level: Severity.Info,
		});
		const { onRouteChange } = options;
		if (onRouteChange) {
			onRouteChange(from, to);
		}
	},
	handleHashchange(data: HashChangeEvent) {
		const { oldURL, newURL } = data;
		const { relative: from } = parseUrlToObj(oldURL);
		const { relative: to } = parseUrlToObj(newURL);
		breadcrumb.push({
			type: BREADCRUMBTYPES.ROUTE,
			category: breadcrumb.getCategory(BREADCRUMBTYPES.ROUTE),
			data: {
				from,
				to,
			},
			level: Severity.Info,
		});
		const { onRouteChange } = options;
		if (onRouteChange) {
			onRouteChange(from, to);
		}
	},
	handleUnhandleRejection(event: PromiseRejectionEvent) {
		let data: ReportDataType = {
			type: ERRORTYPES.PROMISE_ERROR,
			message: unknownToString(event.reason),
			url: getLocationHref(),
			name: event.type,
			time: Date.now(),
			level: Severity.Low,
		};
		if (isError(event.reason)) {
			data = {
				...data,
				...extractErrorStack(event.reason, Severity.Low),
			};
		}
		breadcrumb.push({
			type: BREADCRUMBTYPES.UNHANDLEDERJECTION,
			category: breadcrumb.getCategory(BREADCRUMBTYPES.UNHANDLEDERJECTION),
			data: { ...data },
			level: Severity.Error,
		});
		transportData.send(data);
	},
};

export { HandleEvents };
