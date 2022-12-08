import { breadcrumb, handleConsole, transportData } from "../core";
import { BREADCRUMBTYPES, EVENTTYPES } from "../shared";
import { htmlElementAsString, Severity } from "../utils";
import { HandleEvents } from "./handleEvents";
import { addReplaceHandler } from "./replace";

export function setupRaplace() {
	addReplaceHandler({
		callback: (data) => {
			HandleEvents.handleHttp(data, BREADCRUMBTYPES.XHR);
		},
		type: EVENTTYPES.XHR,
	});

	addReplaceHandler({
		callback: (data) => {
			HandleEvents.handleHttp(data, BREADCRUMBTYPES.FETCH);
		},
		type: EVENTTYPES.FETCH,
	});

	addReplaceHandler({
		callback: (data) => {
			HandleEvents.handleError(data);
		},
		type: EVENTTYPES.ERROR,
	});

	// addReplaceHandler({
	// 	callback: (data) => {
	// 		handleConsole(data);
	// 	},
	// 	type: EVENTTYPES.CONSOLE,
	// });

	addReplaceHandler({
		callback: (data) => {
			HandleEvents.handleHistory(data);
		},
		type: EVENTTYPES.HISTORY,
	});

	addReplaceHandler({
		callback: (data) => {
			HandleEvents.handleUnhandleRejection(data);
		},
		type: EVENTTYPES.UNHANDLEDERJECTION,
	});

	addReplaceHandler({
		callback: (data) => {
			HandleEvents.handleDOMClick(data.data);
		},
		type: EVENTTYPES.DOM,
	});

	addReplaceHandler({
		callback: (data) => {
			HandleEvents.handleHashchange(data);
		},
		type: EVENTTYPES.HASHCHANGE,
	});
}
