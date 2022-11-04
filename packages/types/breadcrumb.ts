import { Severity } from "../utils";
import { BREADCRUMBTYPES } from "../shared";

export interface BreadcrumbPushData {
	type: BREADCRUMBTYPES;
	data: any;
	category?: string;
	time?: number;
	level: Severity;
}
