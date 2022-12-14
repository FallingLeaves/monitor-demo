import { ResourceErrorTarget } from "../types/common";
import { BREADCRUMBTYPES, ERRORTYPES, globalVar } from "../shared";
import {
	fromHttpStatus,
	getLocationHref,
	SpanStatus,
	Severity,
	interceptStr,
} from "../utils";
import { ReportDataType, MITOHttp, Replace } from "../types";
import { getRealPath } from "./errorId";
import { breadcrumb } from "./breadcrumb";
export function httpTransform(data: MITOHttp): ReportDataType {
	let message = "";
	const { elapsedTime, time, method, traceId, type, status } = data;
	const name = `${type}--${method}`;
	if (status === 0) {
		message =
			elapsedTime <= globalVar.crossOriginThreshold
				? "http请求失败，失败原因：跨域限制或域名不存在"
				: "http请求失败，失败原因：超时";
	} else {
		message = fromHttpStatus(status);
	}
	message =
		message === SpanStatus.Ok ? message : `${message} ${getRealPath(data.url)}`;
	return {
		type: ERRORTYPES.FETCH_ERROR,
		url: getLocationHref(),
		time,
		elapsedTime,
		level: Severity.Low,
		message,
		name,
		request: {
			httpType: type,
			traceId,
			method,
			url: data.url,
			data: data.reqData || "",
		},
		response: {
			status,
			data: data.responseText,
		},
	};
}

const resourceMap = {
	img: "图片",
	script: "js脚本",
};

export function resourceTransform(traget: ResourceErrorTarget): ReportDataType {
	return {
		type: ERRORTYPES.RESOURCE_ERROR,
		url: getLocationHref(),
		message:
			"资源地址：" +
			(interceptStr(traget.src, 120) || interceptStr(traget.href, 120)),
		level: Severity.Low,
		time: Date.now(),
		name: `${resourceMap[traget.localName] || traget.localName}加载失败`,
	};
}

export function handleConsole(data: Replace.TriggerConsole) {
	if (globalVar.isLogAddBreadcrumb) {
		breadcrumb.push({
			type: BREADCRUMBTYPES.CONSOLE,
			category: breadcrumb.getCategory(BREADCRUMBTYPES.CONSOLE),
			data,
			level: Severity.fromString(data.level),
		});
	}
}
