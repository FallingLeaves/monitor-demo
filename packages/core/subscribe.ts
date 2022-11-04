import { EVENTTYPES } from "../shared";
import { getFlag, nativeTryCatch, setFlag, getFunctionName } from "../utils";

export interface ReplaceHandler {
	type: EVENTTYPES;
	callback: ReplaceCallback;
}

type ReplaceCallback = (data: any) => void;

const handlers: { [key in EVENTTYPES]?: ReplaceCallback[] } = {};

export function subscribeEvent(handler: ReplaceHandler): boolean {
	if (!handler || getFlag(handler.type)) {
		return false;
	}
	setFlag(handler.type, true);
	handlers[handler.type] = handlers[handler.type] || [];
	handlers[handler.type].push(handler.callback);
	return true;
}

export function triggerHandlers(type: EVENTTYPES, data: any): void {
	if (!type || !handlers[type]) {
		return;
	}
	handlers[type].forEach((callback) => {
		nativeTryCatch(
			() => {
				callback(data);
			},
			(e: Error) => {
				console.log(
					`重写事件triggerHandlers的回调函数发生错误\nType:${type}\nName: ${getFunctionName(
						callback
					)}\nError: ${e}`
				);
			}
		);
	});
}
