import { CustomDB, idbIsSupported, deleteDB } from "idb-managed";
import {
	M_BYTE,
	sizeOf,
	dateFormat2Day,
	ResultMsg,
	getStartOfDay,
	dayFormat2Date,
} from "../utils";
import { invokeInQueue } from "./operation-queue";

const WEB_DB_VERSION = 1;
const WEB_DB_NAME = "__monitor_web_db__";
const LOG_DETAIL_TABLE_NAME = "__monitor_detail_table__";
const LOG_DETAIL_REPORTNAME_INDEX = "__logReportName__";
const LOG_DETAIL_CREATETIME_INDEX = "__logCreateTime__";
const LOG_DAY_TABLE_NAME = "__log_day_table__";
const LOG_DAY_TABLE_PRIMARY_KEY = "__logDay__";
const DEFAULT_LOG_DURATION = 7 * 24 * 3600 * 1000;
const DEFAULT_SINGLE_DAY_MAX_SIZE = 7 * M_BYTE;
const DEFAULT_SINGLE_PAGE_MAX_SIZE = 1 * M_BYTE;

type TimeStamp = number;

interface LogReportNameParsedOb {
	logDay: string;
	pageIndex: number;
}

interface LogItem {
	[LOG_DETAIL_REPORTNAME_INDEX]: string;
	[LOG_DETAIL_CREATETIME_INDEX]: TimeStamp;
	logSize: number;
	logString: string;
}

interface LogDayItem {
	[LOG_DAY_TABLE_PRIMARY_KEY]: string;
	totalSize: number;
	reportPagesInfo: {
		pageSizes: number[];
	};
}

class WebDB {
	public static idbIsSupported = idbIsSupported;
	public static deleteDB = deleteDB;
	private DB: CustomDB;

	constructor(dbName?: string) {
		this.DB = new CustomDB({
			dbName: dbName || WEB_DB_NAME,
			dbVersion: WEB_DB_VERSION,
			tables: {
				[LOG_DETAIL_TABLE_NAME]: {
					indexList: [
						{
							indexName: LOG_DETAIL_REPORTNAME_INDEX,
							unique: false,
						},
						{
							indexName: LOG_DETAIL_CREATETIME_INDEX,
							unique: false,
						},
					],
				},
				[LOG_DAY_TABLE_NAME]: {
					primaryKey: LOG_DAY_TABLE_PRIMARY_KEY,
				},
			},
		});
	}

	logReportNameFormatter(logDay: string, pageIndex: number) {
		return `${logDay}_${pageIndex}`;
	}

	logReportNameParse(resportName: string) {
		const splitArrary = resportName.split("_");
		return {
			logDay: splitArrary[0],
			pageIndex: splitArrary[1],
		};
	}

	async getLogDayInfo(logDay: string): Promise<LogDayItem | null> {
		return await this.DB.getItem(LOG_DAY_TABLE_NAME, logDay);
	}

	async getLogDaysInfo(
		fromLogDay: string,
		toLogDay: string
	): Promise<LogDayItem[]> {
		if (fromLogDay === toLogDay) {
			const result = await this.DB.getItem(LOG_DAY_TABLE_NAME, fromLogDay);
			return result ? [result] : [];
		} else {
			return await this.DB.getItemsInRange({
				tableName: LOG_DAY_TABLE_NAME,
				indexRange: {
					indexName: LOG_DAY_TABLE_PRIMARY_KEY,
					lowerIndex: fromLogDay,
					upperIndex: toLogDay,
					lowerExclusive: false,
					upperExclusive: false,
				},
			});
		}
	}

	async getLogsByReportName(reportName: string): Promise<LogItem[]> {
		const logs = await this.DB.getItemsInRange({
			tableName: LOG_DAY_TABLE_NAME,
			indexRange: {
				indexName: LOG_DETAIL_REPORTNAME_INDEX,
				onlyIndex: reportName,
			},
		});
		return logs;
	}

	async addLog(logString: string): Promise<void> {
		const logSize = sizeOf(logString);
		const now = new Date();
		const today: string = dateFormat2Day(now);
		const todayInfo: LogDayItem = (await this.getLogDayInfo(today)) || {
			[LOG_DAY_TABLE_PRIMARY_KEY]: today,
			totalSize: 0,
			reportPagesInfo: { pageSizes: [0] },
		};
		if (todayInfo.totalSize + logSize > DEFAULT_SINGLE_DAY_MAX_SIZE) {
			console.log(ResultMsg.EXCEED_LOG_SIZE_LIMIT);
			return;
		}
		if (!todayInfo.reportPagesInfo || !todayInfo.reportPagesInfo.pageSizes) {
			todayInfo.reportPagesInfo = {
				pageSizes: [0],
			};
		}
		const currentPageSizeArr = todayInfo.reportPagesInfo.pageSizes;
		const currentPageIndex = currentPageSizeArr.length - 1;
		const currentPageSize = currentPageSizeArr[currentPageIndex];
		const needNewPage =
			currentPageSize > 0 &&
			currentPageSize + logSize > DEFAULT_SINGLE_PAGE_MAX_SIZE;
		const nextPageSizesArr = (function (): number[] {
			const arrCopy = currentPageSizeArr.slice();
			if (needNewPage) {
				arrCopy.push(logSize);
			} else {
				arrCopy[currentPageIndex] += logSize;
			}
			return arrCopy;
		})();
		const logItem: LogItem = {
			[LOG_DETAIL_REPORTNAME_INDEX]: this.logReportNameFormatter(
				today,
				needNewPage ? currentPageIndex + 1 : currentPageIndex
			),
			[LOG_DETAIL_CREATETIME_INDEX]: +now,
			logSize,
			logString,
		};
		const updatedTodayInfo: LogDayItem = {
			[LOG_DAY_TABLE_PRIMARY_KEY]: today,
			totalSize: todayInfo.totalSize + logSize,
			reportPagesInfo: {
				pageSizes: nextPageSizesArr,
			},
		};
		const durationBeforeExpired =
			DEFAULT_LOG_DURATION - (+new Date() - getStartOfDay(new Date()));
		await this.DB.addItems([
			{
				tableName: LOG_DAY_TABLE_NAME,
				item: updatedTodayInfo,
				itemDuration: durationBeforeExpired,
			},
			{
				tableName: LOG_DETAIL_TABLE_NAME,
				item: logItem,
				itemDuration: durationBeforeExpired,
			},
		]);
	}

	async incrementalDelete(logDay: string, reportedPageIndexes: number[]) {
		const dayInfo: LogDayItem | null = await this.getLogDayInfo(logDay);
		if (
			dayInfo &&
			dayInfo.reportPagesInfo &&
			dayInfo.reportPagesInfo.pageSizes instanceof Array
		) {
			const currentPageSizeArr = dayInfo.reportPagesInfo.pageSizes;
			const currentTotalSize = dayInfo.totalSize;
			const totalReportedSize = currentPageSizeArr.reduce(
				(accSize, currentSize, indexOfPage) => {
					if (reportedPageIndexes.indexOf(indexOfPage) >= 0) {
						return accSize + currentSize;
					} else {
						return accSize;
					}
				},
				0
			);
			const pageSizesArrayWithNewPage =
				(function addNewPgeIfLastPageIsReported(): number[] {
					if (reportedPageIndexes.indexOf(currentPageSizeArr.length - 1) >= 0) {
						return currentPageSizeArr.concat([0]);
					} else {
						return currentPageSizeArr;
					}
				})();
			const resetReportedPageSizes = pageSizesArrayWithNewPage.reduce(
				(accSizesArray, currentSize, index) => {
					if (reportedPageIndexes.indexOf(index) >= 0) {
						return accSizesArray.concat([0]); // Reset to 0 if this page is reported.
					} else {
						return accSizesArray.concat([currentSize]);
					}
				},
				[] as number[]
			);
			const updatedDayInfo: LogDayItem = {
				...dayInfo,
				reportPagesInfo: {
					pageSizes: resetReportedPageSizes,
				},
				totalSize: Math.max(currentTotalSize - totalReportedSize, 0),
			};
			const durationBeforeExpired =
				DEFAULT_LOG_DURATION -
				(+new Date() - getStartOfDay(new Date())) -
				(getStartOfDay(new Date()) - dayFormat2Date(logDay).getTime());
			await this.DB.addItems([
				{
					tableName: LOG_DAY_TABLE_NAME,
					item: updatedDayInfo,
					itemDuration: durationBeforeExpired,
				},
			]);
			for (const pageIndex of reportedPageIndexes) {
				await this.DB.deleteItemsInRange([
					{
						tableName: LOG_DETAIL_TABLE_NAME,
						indexRange: {
							indexName: LOG_DETAIL_REPORTNAME_INDEX,
							onlyIndex: this.logReportNameFormatter(logDay, pageIndex),
						},
					},
				]);
			}
		}
	}
}

let webDBInstance: WebDB;

export async function saveLog(log) {
	try {
		if (!WebDB.idbIsSupported()) {
			console.log(ResultMsg.DB_NOT_SUPPORT);
			return;
		}
		if (!webDBInstance) {
			webDBInstance = new WebDB();
		}
		await invokeInQueue(async () => {
			await webDBInstance.addLog(JSON.stringify(log));
		});
	} catch (error) {}
}
