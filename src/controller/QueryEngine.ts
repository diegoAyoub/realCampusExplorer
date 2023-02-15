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
let NOT = "NOT", AND = "AND", OR = "OR", IS = "IS", LT = "LT", EQ = "EQ", GT = "GT";
let WHERE = "WHERE", OPTIONS = "OPTIONS", COLUMNS = "COLUMNS", ORDER = "ORDER";
const LOGIC = [AND, OR], COMPARATOR = [LT, GT, EQ, IS, NOT];
const COLUMN_STRINGS = ["uuid", "id", "title", "instructor", "dept", IS];
const COLUMN_NUMBERS = ["year", "avg", "pass", "fail", "audit", LT, GT, EQ];
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
		return [];
	}

	public isValidQuery(): boolean {
		let hasWhere: boolean = Object.prototype.hasOwnProperty.call(this.queryJson, WHERE);
		let hasOptions: boolean = Object.prototype.hasOwnProperty.call(this.queryJson, OPTIONS);
		if (!hasWhere || !hasOptions) { // WHERE KEY NOT FOUND OR OPTIONS KEY NOT FOUND
			return false; //	Promise.reject(new InsightError("Invalid query lang: WHERE"));
		}
		return this.isValidWhere(this.queryJson[WHERE]) && this.isValidOptions(this.queryJson[OPTIONS]);
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
				 isValid = isValid && this.isValidWhere(whereVal);
			} else {
				//	GET ID
				let keyArr = whereKey.split("_");
				let queryID: string = keyArr[0];
				let conditionCol: string = keyArr[1];
				this.qryID = queryID;
				if (!this.isIdExist(queryID) || !this.isValidId(queryID) || !COLUMN_NAMES.includes(conditionCol)) {
					// validID returns string and not boolean
					return false; // Promise.reject(new InsightError("Query ID is not valid or does not exist"));
				}
			}
		}
		return isValid;
	}
	public isValidOptions(optionBlock: any): boolean {
		let optionKeys = Object.keys(optionBlock);
		let columnKeys: string[] = [];
		// let filteredColumns: string[] = [];

		if (optionKeys.length === 1) {
			if (optionKeys[0] === COLUMNS) {
				columnKeys = optionBlock[COLUMNS];
				this.selectedColumns = this.getColumns(columnKeys);
				return this.selectedColumns.length === columnKeys.length;
			}
		} else if (optionKeys.length === 2) {
			if (optionKeys[0] === COLUMNS && optionKeys[1] === ORDER) {
				columnKeys = optionBlock[COLUMNS];
				this.selectedColumns = this.getColumns(columnKeys);
				if (this.isValidKey(optionBlock[ORDER]) && columnKeys.includes(optionBlock[ORDER])) {
					return this.selectedColumns.length === columnKeys.length;
				}
			}
		}
		return false;
	}
	public isValidKey(key: string) {
		let arr = key.split("_");
		let setID = arr[0];
		let col = arr[1];
		return COLUMN_NAMES.includes(col) && this.qryID === setID && arr.length === 2;
	}
	public getColumns(columnsBlock: any): string[] {
		let columns: string[] = [];
		for (const colKey of columnsBlock) {
			if (this.isValidKey(colKey)) {
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
				results = results.filter((section) => subResult.includes(section));
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
		for (const operator in query) {
			subResult = this.handleFilter(operator); //	does this actually work!?
		}
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
			case IS: { // jk add special handler function for asterisk
				filteredList = sections.filter((section) => this.getColVal(section, col) === value);
				break;
			}
		}
		return filteredList;
	}

	public getColVal(section: any, colName: string): string | number {
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
}
