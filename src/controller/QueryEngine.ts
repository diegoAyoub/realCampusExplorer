//	This file will have a lot of the query helper functions, this file is essentially the query engine //
import {
	InsightData,
	InsightDatasetSection,
	InsightError,
	InsightResult,
	ResultTooLargeError,
} from "./IInsightFacade";
import {QueryEngineHelper} from "./QueryEngineHelper";

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
	public doQuery(query: any): Promise<InsightResult[]> {
		let results: InsightDatasetSection[] = this.handleFilter(query[WHERE]);
		if(results.length > 5000) {
			return Promise.reject(new ResultTooLargeError("Way too many results sir"));
		} else {
			let resultFormatter = new QueryEngineHelper(this.qryID, results, this.orderKey, this.selectedColumns);
			return Promise.resolve(resultFormatter.getFormattedResult());
		}
		// let resultFormatter = new QueryEngineHelper(this.qryID, results, this.orderKey, this.selectedColumns);
		// return Promise.resolve(resultFormatter.getFormattedResult());
	}

	public handleFilter(query: any): InsightDatasetSection[] {
		if (Object.prototype.hasOwnProperty.call(query, AND)) {
			return this.handleAnd(query[AND]);
		} else if (Object.prototype.hasOwnProperty.call(query, OR)) {
			return this.handleOr(query[OR]);
		} else if (Object.prototype.hasOwnProperty.call(query, NOT)) {
			return this.handleNot(query[NOT]);
		} else if (Object.prototype.hasOwnProperty.call(query, LT)) {
			// @TODO get/handle conditional info from lt key
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
	// Recursion through where sub block, explores each layer of camparators until section ID and column is found. Then
	//	returns true if valid. false otherwise
	public isValidWhere(whereBlock: any): boolean {
		let isValid = true;
		if(Object.keys(whereBlock).length !== 1) {
			return false;
		}
		for (let key in whereBlock) {
			let whereKey: string = key;
			let whereVal = whereBlock[key] as any;
			if (LOGIC.includes(whereKey)) {
				if(whereVal.length !== 0) { // AND/OR key must not correspond to a list thats empty
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

	public handleAnd(query: any): InsightDatasetSection[] {
		let results: InsightDatasetSection[] = [];
		let subResult: InsightDatasetSection[] = [];
		for (const operator of query) {
			subResult = this.handleFilter(operator);
			if (results.length === 0) {
				results = subResult;
			} else {
				results = subResult.filter((section) => results.includes(section));
			}
		}
		return results;
	}

	public handleOr(query: any): InsightDatasetSection[] {
		let results: InsightDatasetSection[] = [];
		let subResult: InsightDatasetSection[] = [];
		for (const operator of query) {
			subResult = this.handleFilter(operator);
			for (const section of subResult) {
				if(!results.includes(section)) {
					results.push(section);
				}
			}
		}
		return results;
	}

	public handleNot(query: any): InsightDatasetSection[] {
		let results: InsightDatasetSection[] = this.datasetSections;
		let subResult: InsightDatasetSection[] = [];
		subResult = this.handleFilter(query); //	does this actually work!?
		results = results.filter((section) => !subResult.includes(section)); // gets everythin in results thats not in subresult
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
			case IS: { // jk add special handler function for aster
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
		console.log("ERROR: Invalid Column Name");
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

	public isValidId(id: string): Promise<boolean> {
		if (id.trim().length === 0) {
			// blank id or id is all whitespace
			return Promise.reject(new InsightError("The ID must contain non white space characters"));
		} else if (id.includes("_")) {
			// id has an underscore
			return Promise.reject(new InsightError('The ID can\'t contain any underscores "_"'));
		}
		return Promise.resolve(true);
	}
	public isWildCardMatched(value: string, pattern: string) {
		let wildArr = pattern.split("*");
		if (wildArr.length === 2)	{
			if(wildArr[0] === "" && wildArr[1] !== "") {
				let substring = wildArr[1];
				let stringToMatch = value.substring(value.length - substring.length, value.length);
				return substring === stringToMatch;
			} else if (wildArr[0] !== "" && wildArr[1] === "") {
				let substring = wildArr[0];
				let stringToMatch = value.substring(0, substring.length);
				return substring === stringToMatch;
			}
		}
		return false;
	}

	public isValidWildCard(pattern: string) { // we are considering no pattern to be a valid wildcard pattern
		if(pattern.includes("*")) {
			let wildArr = pattern.split("*");
			if(wildArr.length > 2) {
				return false;
			} else if(wildArr[0] !== "" && wildArr[1] !== "") {
				return false;
			}
		}
		return true;
	}
}
