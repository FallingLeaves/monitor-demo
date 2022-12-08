import { _global } from "../utils";
import { InitOptions } from "../types";
import { initOptions, log } from "../core";
import { setupRaplace } from "./load";

function initWeb(options: InitOptions = {}) {
	if (!("XMLHttpRequest" in _global) || options.disabled) {
		return;
	}
	initOptions(options);
	setupRaplace();
}

function init(options: InitOptions = {}) {
	initWeb(options);
}

export { init, log };

// init({
// 	// dsn: "http://localhost:2021/errors/upload",
// throttleDelayTime: 0,
// onRouteChange(from, to) {
// 	console.log("onRouteChange: _", from, to);
// },
// });
