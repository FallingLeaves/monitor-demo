import { BreadcrumbPushData, InitOptions } from "../types";
import { BREADCRUMBTYPES, BREADCRUMBCATEGORYS } from "../shared";
import { validateOption } from "../utils";

export class Breadcrumb {
	maxBreadcrumbs = 10;
	beforePushBreadcrumb: unknown = null;
	stack: BreadcrumbPushData[] = [];

	constructor() {}

	push(data: BreadcrumbPushData): void {
		if (typeof this.beforePushBreadcrumb === "function") {
			let result: BreadcrumbPushData = null;
			const beforePushBreadcrumb = this.beforePushBreadcrumb;
			result = beforePushBreadcrumb(this, data);
			if (!result) {
				return;
			}
			this.immediatePush(result);
			return;
		}
		this.immediatePush(data);
	}

	immediatePush(data: BreadcrumbPushData): void {
		if (!data.time) {
			data.time = Date.now();
		}
		if (this.stack.length >= this.maxBreadcrumbs) {
			this.shift();
		}
		this.stack.push(data);
		this.stack.sort((a, b) => a.time - b.time);
		// console.log(this.stack);
	}

	shift(): boolean {
		return this.stack.shift() !== undefined;
	}

	clear(): void {
		this.stack = [];
	}

	getStack(): BreadcrumbPushData[] {
		return this.stack;
	}

	getCategory(type: BREADCRUMBTYPES) {
		switch (type) {
			case BREADCRUMBTYPES.XHR:
			case BREADCRUMBTYPES.FETCH:
				return BREADCRUMBCATEGORYS.HTTP;
			case BREADCRUMBTYPES.CLICK:
			case BREADCRUMBTYPES.ROUTE:
				return BREADCRUMBCATEGORYS.USER;
			case BREADCRUMBTYPES.CUSTOMER:
			case BREADCRUMBTYPES.CONSOLE:
				return BREADCRUMBCATEGORYS.DEBUG;
			case BREADCRUMBTYPES.UNHANDLEDERJECTION:
			case BREADCRUMBTYPES.CODE_ERROR:
			default:
				return BREADCRUMBCATEGORYS.EXCEPTION;
		}
	}

	bindOptions(options: InitOptions = {}): void {
		const { maxBreadcrumbs, beforePushBreadcrumb } = options;
		if (validateOption(maxBreadcrumbs, "maxBreadcrumbs", "number")) {
			this.maxBreadcrumbs = maxBreadcrumbs;
		}
		if (
			validateOption(beforePushBreadcrumb, "beforePushBreadcrumb", "function")
		) {
			this.beforePushBreadcrumb = beforePushBreadcrumb;
		}
	}
}

const breadcrumb = new Breadcrumb();

export { breadcrumb };
