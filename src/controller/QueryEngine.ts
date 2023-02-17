import {
	InsightData, InsightDatasetSection,
	InsightResult,
	ResultTooLargeError, InsightError
} from "./IInsightFacade";
import {QueryEngineHelper} from "./QueryEngineHelper";
import {writeLocal} from "./DiskUtil";
import {PATH_TO_ROOT_DATA} from "./InsightFacade";
const COLUMN_NAMES = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
const NOT = "NOT", AND = "AND", OR = "OR", IS = "IS", LT = "LT", EQ = "EQ", GT = "GT";
const WHERE = "WHERE", OPTIONS = "OPTIONS", COLUMNS = "COLUMNS", ORDER = "ORDER";
const LOGIC = [AND, OR], COMPARATOR = [LT, GT, EQ, IS, NOT];

export const COLUMN_STRINGS = ["uuid", "id", "title", "instructor", "dept", IS];
export const COLUMN_NUMBERS = ["year", "avg", "pass", "fail", "audit", LT, GT, EQ];
export class QueryEngine {
	public dataset: InsightData[];
	public queryJson: any;
	public qryID: string = "";
	public datasetSections: InsightDatasetSection[] = [];
	public orderKey: string;
	public selectedColumns: string[];
	constructor(data: InsightData[], qryJson: unknown) {
		this.dataset = data;
		this.queryJson = qryJson as any;
		this.selectedColumns = [];
		this.orderKey = "";
	}
	public async doQuery(query: any): Promise<InsightResult[]> {
		let results: InsightDatasetSection[] | null = this.handleFilter(query[WHERE]);
		if (results === null || results === undefined) {
			await writeLocal(PATH_TO_ROOT_DATA, this.dataset);
			return Promise.reject(new InsightError("Invalid Query"));
		} else if(results.length > 5000) {
			await writeLocal(PATH_TO_ROOT_DATA, this.dataset);
			return Promise.reject(new ResultTooLargeError("Way too many results sir"));
		} else {
			let resultFormatter = new QueryEngineHelper(this.qryID, results, this.orderKey, this.selectedColumns);
			return Promise.resolve(resultFormatter.getFormattedResult());
		}
	}

	public handleFilter(query: any): InsightDatasetSection[] | null {
		if(query === null || query === undefined) {
			return null;
		} else if (Object.prototype.hasOwnProperty.call(query, AND)) {
			return this.handleAnd(query[AND]);
		} else if (Object.prototype.hasOwnProperty.call(query, OR)) {
			return this.handleOr(query[OR]);
		} else if (Object.prototype.hasOwnProperty.call(query, NOT)) {
			return this.handleNot(query[NOT]);
		} else if (Object.prototype.hasOwnProperty.call(query, LT)) {
			return this.handleMComparator(LT, query);
		} else if (Object.prototype.hasOwnProperty.call(query, GT)) {
			return this.handleMComparator(GT, query);
		} else if (Object.prototype.hasOwnProperty.call(query, IS)) {
			return this.handleMComparator(IS, query);
		} else if (Object.prototype.hasOwnProperty.call(query, EQ)) {
			return this.handleMComparator(EQ, query);
		}
		return this.datasetSections;
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

	public handleAnd(query: any): InsightDatasetSection[] | null {
		let results: InsightDatasetSection[] = [];
		let subResult: InsightDatasetSection[] | null = [];
		//	return null;
		for (const operator of query) {

			subResult = this.handleFilter(operator);
			if(subResult === null || subResult === undefined) {
				return null;
			} else if (subResult.length === 0) {
				return subResult;
			} else if (results.length === 0) {
				results = subResult;
			} else {
				results = subResult.filter((section) => results.includes(section));
			}
		}
		return results;
	}

	public handleOr(query: any): InsightDatasetSection[] {
		let results: InsightDatasetSection[] = [];
		let subResult: InsightDatasetSection[] | null = [];
		for (const operator of query) {
			subResult = this.handleFilter(operator);
			for (const section of (subResult as InsightDatasetSection[])) {
				if(!results.includes(section)) {
					results.push(section);
				}
			}
		}
		return results;
	}

	public handleNot(query: any): InsightDatasetSection[] {
		let results: InsightDatasetSection[] = this.datasetSections;
		let subResult: InsightDatasetSection[] | null = [];
		subResult = this.handleFilter(query); //	does this actually work!?
		if(subResult === null) {
			return results;
		} else {
			results = results.filter((section) => !((subResult as InsightDatasetSection[]).includes(section))); // gets everythin in results thats not in subresult
		}
		return results;
	}
	public handleMComparator(comparator: string, query: any): InsightDatasetSection[] {
		let filteredList: InsightDatasetSection[] = [];
		let sections: InsightDatasetSection[] = this.datasetSections;
		let inBlock = query[comparator];
		let keys = Object.keys(query[comparator]);
		let keyArr = keys[0].split("_");
		let col = keyArr[1];
		let value = inBlock[keys[0]];
		switch (comparator) {
			case GT: {
				filteredList = sections.filter((section) => this.getColVal(section, col) > value);
				break;
			}
			case LT: {
				filteredList = sections.filter((section) => this.getColVal(section, col) < value);
				break;
			}
			case EQ: {
				filteredList = sections.filter((section) => this.getColVal(section, col) === value);
				break;
			}
			case IS: { // jk add special handler function for asterisk
				if(value.includes("*")) {
					if(this.isValidWildCard(value)) {
						filteredList = sections.filter((section) => {
							return this.isWildCardMatched(this.getColVal(section, col), value);
						});
					}
				} else {
					filteredList = sections.filter((section) => this.getColVal(section, col) === value);
				}
				break;
			}
		}
		return filteredList;
	}
	public getColVal(section: any, colName: string): any {
		if (COLUMN_NAMES.includes(colName)) {
			return section[colName];
		}
		return "ERROR";
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
	public isWildCardMatched(value: string, pattern: string): boolean {
		let wildArr = pattern.split("*");
		if (wildArr.length === 2) {
			if (wildArr[0] === "" && wildArr[1] === "") {
				return true;
			} else if(wildArr[0] === "" && wildArr[1] !== "") {
				let substring = wildArr[1];
				let stringToMatch = value.substring(value.length - substring.length, value.length);
				return substring === stringToMatch;
			} else if (wildArr[0] !== "" && wildArr[1] === "") {
				let substring = wildArr[0];
				let stringToMatch = value.substring(0, substring.length);
				return substring === stringToMatch;
			}
		} else if (value.includes(wildArr[1])) {
			return true;
		}
		return false;
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
}
