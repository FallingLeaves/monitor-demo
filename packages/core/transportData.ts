import { saveLog } from "../browser/web-db";
import {
	FinalReportType,
	InitOptions,
	isReportDataType,
	TransportDataType,
	XhrMethods,
} from "../types";
import { isBrowserEnv, isEmpty, Queue, validateOption } from "../utils";
import { breadcrumb } from "./breadcrumb";
import { createErroeId } from "./errorId";

export class TransportData {
	queue: Queue;
	beforeDataReport: unknown = null;
	configReportXhr: unknown = null;
	useImgUpload = false;

	errorDsn = "";
	apiKey = "";

	constructor() {
		this.queue = new Queue();
	}

	imgRequest(data: any, url: string) {
		const requestFun = () => {
			let img = new Image();
			const spliceStr = url.indexOf("?") === -1 ? "?" : "&";
			img.src = `${url}${spliceStr}data=${encodeURIComponent(
				JSON.stringify(data)
			)}`;
			img = null;
		};
		this.queue.addFn(requestFun);
	}

	async beforePost(data: FinalReportType) {
		if (isReportDataType(data)) {
			const errorId = createErroeId(data, this.apiKey);
			if (!errorId) {
				return false;
			}
			data.errorId = errorId;
		}
		let transportData = this.getTransportData(data);
		if (typeof this.beforeDataReport === "function") {
			transportData = await this.beforeDataReport(transportData);
			if (!transportData) {
				return false;
			}
		}
		return transportData;
	}

	getTransportData(data: FinalReportType): TransportDataType {
		return {
			breadcrumb: breadcrumb.getStack(),
			data,
		};
	}

	async xhrPost(data: any, url: string) {
		const requestFun = (): void => {
			const xhr = new XMLHttpRequest();
			xhr.open(XhrMethods.Post, url);
			xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			xhr.withCredentials = true;
			if (typeof this.configReportXhr === "function") {
				this.configReportXhr(xhr, data);
			}
			xhr.send(JSON.stringify(data));
		};
		this.queue.addFn(requestFun);
	}

	isSdkTransportUrl(targetUrl: string): boolean {
		let isSdkDsn = false;
		if (this.errorDsn && targetUrl.indexOf(this.errorDsn) !== -1) {
			isSdkDsn = true;
		}
		return isSdkDsn;
	}

	bindOptions(options: InitOptions = {}) {
		const { dsn, beforeDataReport, configReportXhr, useImgUpload, apiKey } =
			options;
		if (validateOption(dsn, "dsn", "string")) {
			this.errorDsn = dsn;
		}
		if (validateOption(apiKey, "apiKey", "string")) {
			this.apiKey = apiKey;
		}
		if (validateOption(useImgUpload, "useImgUpload", "string")) {
			this.useImgUpload = useImgUpload;
		}
		if (validateOption(beforeDataReport, "beforeDataReport", "function")) {
			this.beforeDataReport = beforeDataReport;
		}
		if (validateOption(configReportXhr, "configReportXhr", "function")) {
			this.configReportXhr = configReportXhr;
		}
	}

	async send(data: FinalReportType) {
		let dsn = "";
		if (isReportDataType(data)) {
			dsn = this.errorDsn;
			if (isEmpty(dsn)) {
				// console.error("dsn为空，没有传入监控错误上报的dsn地址，请在init中传入");
				console.log("上传数据: ", data);
				if (isBrowserEnv) {
					saveLog(data);
				}
				return;
			}
		}
		const result = await this.beforePost(data);
		if (!result) {
			return;
		}
		if (isBrowserEnv) {
			return this.useImgUpload
				? this.imgRequest(result, dsn)
				: this.xhrPost(result, dsn);
		}
	}
}

const transportData = new TransportData();

export { transportData };
