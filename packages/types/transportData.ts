import { BreadcrumbPushData } from "./breadcrumb";
import { ActionType } from "./track";

export interface TransportDataType {
	breadcrumb?: BreadcrumbPushData[];
	data?: FinalReportType;
}

export type FinalReportType = ReportDataType | TrackReportData;

interface CommonDataType {
	isTrackData?: boolean;
}

export interface ReportDataType extends CommonDataType {
	type?: string;
	message?: string;
	url: string;
	name?: string;
	stack?: any;
	time?: number;
	errorId?: number;
	level: string;
	// ajax
	elapsedTime?: number;
	request?: {
		httpType?: string;
		traceId?: string;
		method: string;
		url: string;
		data: any;
	};
	response?: {
		status: number;
		data: string;
	};
	// vue
	componentName?: string;
	propsData?: any;
	// logError 手动报错 MITO.log
	customTag?: string;
}

export interface TrackReportData extends CommonDataType {
	// uuid
	id?: string;
	// 埋点code 一般由人为传进来，可以自定义规范
	trackId?: string;
	// 埋点类型
	actionType: ActionType;
	// 埋点开始时间
	startTime?: number;
	// 埋点停留时间
	durationTime?: number;
	// 上报时间
	trackTime?: number;
}

export function isReportDataType(data: ReportDataType | TrackReportData): data is ReportDataType {
  return (<TrackReportData>data).actionType === undefined && !data.isTrackData
}