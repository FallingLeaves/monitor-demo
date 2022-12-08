import { ERRORTYPES, BREADCRUMBTYPES } from "../shared";
import {
	isError,
	extractErrorStack,
	unknownToString,
	Severity,
	getLocationHref,
} from "../utils";
import { transportData } from "./transportData";
import { breadcrumb } from "./breadcrumb";
import { TNumStrObj } from "../types";

interface LogTypes {
	message: TNumStrObj;
	tag?: TNumStrObj;
	level?: Severity;
	ex?: Error | any;
	type?: string;
}

export function log({
	message = "emptyMsg",
	tag = "",
	level = Severity.Critical,
	ex = "",
	type = ERRORTYPES.LOG_ERROR,
}: LogTypes): void {
	let errorInfo = {};
	if (isError(ex)) {
		errorInfo = extractErrorStack(ex, level);
	}
	const error = {
		type,
		level,
		message: unknownToString(message),
		name: "MITO.log",
		customTag: unknownToString(tag),
		time: Date.now(),
		url: getLocationHref(),
		...errorInfo,
	};

	breadcrumb.push({
		type: BREADCRUMBTYPES.CUSTOMER,
		category: breadcrumb.getCategory(BREADCRUMBTYPES.CUSTOMER),
		data: message,
		level: Severity.fromString(level.toString()),
	});
	transportData.send(error);
}
