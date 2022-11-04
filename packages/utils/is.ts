export const nativeToString = Object.prototype.toString;

function isType(type: string) {
	return function (value: any) {
		return nativeToString.call(value) === `[object ${type}]`;
	};
}

/**
 * 检测变量类型
 * @param type
 */

export const variableType = {
	isNumber: isType("Number"),
	isString: isType("String"),
	isBoolean: isType("Boolean"),
	isNull: isType("Null"),
	isUndefined: isType("Undefined"),
	isSymbol: isType("Symbol"),
	isFunction: isType("Function"),
	isObject: isType("Object"),
	isArray: isType("Array"),
	isWindow: isType("Window"),
};

export function isEmpty(val: any): boolean {
	return (
		(variableType.isString(val) && val.trim() === "") ||
		val === undefined ||
		val === null
	);
}

export function isEmptyOnject(obj: Object): boolean {
	return variableType.isObject(obj) && Object.keys(obj).length === 0;
}

export function isError(val: any): boolean {
	switch (nativeToString.call(val)) {
		case "[object Error]":
			return true;
		case "[object Exception]":
			return true;
		case "[object DOMException]":
			return true;
		default:
			return isInstanceOf(val, Error);
	}
}

export function isInstanceOf(val: any, base: any): boolean {
	try {
		return val instanceof base;
	} catch (error) {
		return false;
	}
}
