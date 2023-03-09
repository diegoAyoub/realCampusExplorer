import {
	InsightData, InsightDatasetSection,
	InsightResult,
	ResultTooLargeError,
} from "./IInsightFacade";
import {QueryEngineHelper} from "./QueryEngineHelper";
import {writeLocal} from "./DiskUtil";
import {PATH_TO_ROOT_DATA} from "./InsightFacade";
import {COLUMN_NUMBERS, COLUMN_STRINGS} from "./QueryEngine";
const COLUMN_NAMES = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
const NOT = "NOT", AND = "AND", OR = "OR", IS = "IS", LT = "LT", EQ = "EQ", GT = "GT";
const WHERE = "WHERE", OPTIONS = "OPTIONS", COLUMNS = "COLUMNS", ORDER = "ORDER";
const LOGIC = [AND, OR], COMPARATOR = [LT, GT, EQ, IS, NOT];

export class QueryValidator {

	private queryJson: any;
	private qryID: string = "";
	private orderKey: string = "";
	public selectedColumns: string[];
	private dataset: InsightData[];
	private datasetSections: InsightDatasetSection[];
	constructor( qryJson: unknown, data: InsightData[]) {
		this.queryJson = qryJson as any;
		this.selectedColumns = [];
		this.orderKey = "";
		this.dataset = data;
		this.datasetSections = [];
	}
	public isValidQuery(): boolean {
		let hasWhere: boolean = Object.prototype.hasOwnProperty.call(this.queryJson, WHERE);
		let hasOptions: boolean = Object.prototype.hasOwnProperty.call(this.queryJson, OPTIONS);
		if (!hasWhere || !hasOptions) { // WHERE KEY NOT FOUND OR OPTIONS KEY NOT FOUND
			return false; //	Promise.reject(new InsightError("Invalid query lang: WHERE"));
		}
		let isValidWhere: boolean = this.isValidWhere(this.queryJson[WHERE]);
		let isWhereEmpty: boolean = Object.keys(this.queryJson[WHERE]).length === 0;
		let isValidOptions = this.isValidOptions(this.queryJson[OPTIONS]);
		return (isWhereEmpty || isValidWhere) && isValidOptions;
	}

	public isValidWhere(whereBlock: any): boolean {
		let isValid = true;
		if(Object.keys(whereBlock).length !== 1) {
			return false;
		}
		for (let key in whereBlock) {
			let whereKey: string = key;
			let whereVal = whereBlock[key] as any;
			if (LOGIC.includes(whereKey)) {
				if(whereVal.length !== 0) { // AND/OR key must not correspond to a list thats not empty
					for(let filter of whereVal) {
						isValid = isValid && this.isValidWhere(filter);
					}
				} else {
					return false;
				}
			} else if (COMPARATOR.includes(whereKey)) {
				isValid = isValid && this.isValidComparatorEntry(whereVal,key) && this.isValidWhere(whereVal);
			} else {
				//	GET ID
				let keyArr = whereKey.split("_");
				let queryID: string = keyArr[0];
				let conditionCol: string = keyArr[1];
				this.qryID = this.qryID === "" ? queryID : this.qryID;
				if (!this.isIdExist(queryID) ||
					!this.isValidId(queryID) ||
					!COLUMN_NAMES.includes(conditionCol) ||
					queryID !== this.qryID) {
					// validID returns string and not boolean
					return false; // Promise.reject(new InsightError("Query ID is not valid or does not exist"));
				}
			}
		}
		return isValid;
	}

	public isValidComparatorEntry(object: any, comparator: string): boolean {
		let key = Object.keys(object)[0];
		let field = key.split("_")[1];
		let value = object[key];

		return comparator === NOT ||
			(COLUMN_NUMBERS.includes(field) && COLUMN_NUMBERS.includes(comparator) && typeof value === "number") ||
			(COLUMN_STRINGS.includes(field) && COLUMN_STRINGS.includes(comparator) && typeof value === "string" &&
				this.isValidWildCard(value));
	}

	public isValidOptions(optionBlock: any): boolean {
		let optionKeys = Object.keys(optionBlock);
		let columnKeys: string[] = [];

		if (optionKeys.length === 1) {
			if (optionKeys[0] === COLUMNS) {
				columnKeys = optionBlock[COLUMNS];
				this.selectedColumns = this.getColumns(columnKeys);
				this.isIdExist(this.qryID);
				return this.selectedColumns.length === columnKeys.length;
			}
		} else if (optionKeys.length === 2) {
			if (optionKeys[0] === COLUMNS && optionKeys[1] === ORDER) {
				columnKeys = optionBlock[COLUMNS];
				this.selectedColumns = this.getColumns(columnKeys);
				if (this.isValidKey(optionBlock[ORDER]) && columnKeys.includes(optionBlock[ORDER])) {
					this.orderKey = optionBlock[ORDER];
					this.isIdExist(this.qryID);
					return this.selectedColumns.length === columnKeys.length;
				}
			}
		}
		return false;
	}

	public isValidKey(key: string): boolean {
		let arr = key.split("_");
		let setID = arr[0];
		let col = arr[1];
		return COLUMN_NAMES.includes(col) && this.qryID === setID && arr.length === 2;
	}
	public getColumns(columnsBlock: any): string[] {
		let columns: string[] = [];
		let datasetId = "";
		for (const colKey of columnsBlock) {
			this.qryID = this.qryID === "" ? colKey.split("_")[0] : this.qryID;
			if (this.isValidKey(colKey)) {
				datasetId = colKey;
				columns.push(colKey);
			}
		}
		return columns;
	}

	public isValidWildCard(pattern: string): boolean { // we are considering no pattern to be a valid wildcard pattern
		if(pattern.includes("*")) {
			let wildArr = pattern.split("*");
			if(pattern[0] === "*" && pattern[pattern.length - 1] === "*" && wildArr.length === 3) { // *string*
				return true;
			} else if(wildArr.length > 2) { // more than one * should fail
				return false;
			} else if(wildArr[0] !== "" && wildArr[1] !== "") { // st*ring
				return false;
			}
		}
		return true;
	}

	public isIdExist(id: string): boolean {
		for (const dataset of this.dataset) {
			if (dataset.metaData.id === id) {
				this.datasetSections = dataset.data; // keep track of all sections being looked at
				return true;
			}
		}
		return false;
	}
	public isValidId(id: string): boolean {
		if (id.trim().length === 0) { // blank id or id is all whitespace
			return false;
		} else if (id.includes("_")) { // id has an underscore
			return false;
		}
		return true;
	}
}
