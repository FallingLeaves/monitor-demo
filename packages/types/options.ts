export type HttpMethod =
	| "GET"
	| "POST"
	| "PATCH"
	| "PUT"
	| "DELETE"
	| "OPTIONS";

type CANCEL = null | undefined | boolean;

export enum XhrMethods {
	Get = "GET",
	Post = "POST",
	Put = "PUT",
	Delete = "DELETE",
}

interface IRequestHeaderConfig {
	url: HttpMethod;
	method: string;
}

type TSetRequestHeader = (key: string, value: string) => {};
export interface IBeforeAppAjaxSendConfig {
	setRequestHeader: TSetRequestHeader;
}

export interface InitOptions extends EventTypes, HooksTypes, BrowserHooksTypes {
	// 错误监控的服务器地址
	dsn?: string;
	/**
	 * 是否禁用
	 */
	disabled?: boolean;
	// key
	apiKey?: string;
	// 图片上报，默认 false，xhr 上报
	useImgUpload?: boolean;
	//
	trackKey?: string;
	// 默认 false
	debug?: boolean;
	//
	filterXhrUrlRegExp?: RegExp;
	filterDOMRegExp?: RegExp;
	maxBreadcrumbs?: number;
	throttleDelayTime?: number;
	maxDuplicateCount?: number;
	reportUIClick?: boolean;
}

export interface EventTypes {
	slientXhr?: boolean;
	slientFetch?: boolean;
	slientConsole?: boolean;
	slientDom?: boolean;
	slientHistory?: boolean;
	slientError?: boolean;
	slientUnhandledrejection?: boolean;
	slientHashchange?: boolean;
}

export interface HooksTypes {
	/**
	 * 对当前xhr实例做配置，例如设置header xhr.setRequestHeader()
	 * @param xhr xhr 实例
	 * @param reportData 上传数据
	 */
	configReportXhr?(xhr: XMLHttpRequest, reportData: any): void;

	beforeDataReport?(event: any): Promise<null | CANCEL> | any | CANCEL | null;

	beforePushBreadcrumb?(breadcrumb, hint);

	beforeAppAjaxSend?(
		config: IRequestHeaderConfig,
		setRequestHeader: IBeforeAppAjaxSendConfig
	): void;
}

export interface BrowserHooksTypes {
	onRouteChange?: (from: string, to: string) => unknown;
}
