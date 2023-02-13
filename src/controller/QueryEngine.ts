//	This file will have a lot of the query helper functions, this file is essentially the query engine //
import {
	IInsightFacade,
	InsightData,
	InsightDataset,
	InsightDatasetKind,
	InsightDatasetSection,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import {QueryEngineHelper} from "./QueryEngineHelper";

const COLUMN_NAMES = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];

//	RECURSION
let NOT = "NOT";
let AND = "AND";
let OR = "OR";
//	BASE CASE
let IS = "IS";
let LT = "LT";
let EQ = "EQ";
let GT = "GT";
// idk
let WHERE = "WHERE";
let OPTIONS = "OPTIONS";
let COLUMNS = "COLUMNS";
let ORDER = "ORDER";
const COMPARATOR_LOGIC = [AND, OR];
const COMPARATOR = [LT, GT, EQ, IS, NOT];
export class QueryEngine {
	public dataset: InsightData[];
	public queryJson: any;
	public qryID: string = "";
	public datasetSections: InsightDatasetSection[] = [];
	public helper: any;
	public orderKey: string;
	public selectedColumns: string[];

	constructor(data: InsightData[], qryJson: unknown) {
		this.dataset = data;
		this.queryJson = qryJson as any;
		this.helper = null;
		this.selectedColumns = [];
		this.orderKey = "";
	}
	public doQuery(query: any) {
		let results: InsightDatasetSection[] = this.handleFilter(query[WHERE]);
		console.log(results.length);
		this.helper = new QueryEngineHelper(this.qryID, results, this.orderKey, this.selectedColumns);
		return this.helper.getFormattedResult();
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
		let emptyRet: InsightDatasetSection[] = [];
		return emptyRet;
	}

	public validateQuery(): boolean {
		//	check if the query is in an input section like in the tests [TESTING PURPOSES ONLY I THINK] NOT NEEDED INPUT IS PART OF FOLDER-TEST
		if (Object.prototype.hasOwnProperty.call(this.queryJson, "input")) {
			this.queryJson = this.queryJson["input"];
		}
		//	check if there is a where block
		let isWhere: boolean = Object.prototype.hasOwnProperty.call(this.queryJson, WHERE);
		if (!isWhere) { // WHERE KEY NOT FOUND
			return false; //	Promise.reject(new InsightError("Invalid query lang: WHERE"));
		}
		//	check if there is an options block or return error
		let isOptions: boolean = Object.prototype.hasOwnProperty.call(this.queryJson, OPTIONS);

		if (!isOptions) { // OPTIONS KEY NOT FOUND
			return false; //	Promise.reject(new InsightError("Invalid query lang: OPTIONS"));
		}
		if (this.validateWhere(this.queryJson[WHERE])) { // VALIDATE WHERE
			if(this.validateOptions(this.queryJson[OPTIONS])) { // structured like this for debugging purposes
				return true;
			}
			// return true;
		}
		return false;
	}
	// Recursion through where sub block, explores each layer of camparators until section ID and column is found. Then
	//	returns true if valid. false otherwise
	public validateWhere(whereBlock: any): boolean {
		let conditionVal: any;
		let isValid = true;
		for (let key in whereBlock) {
			let whereKey: string = key;
			let whereVal = whereBlock[key] as any;

			if (COMPARATOR_LOGIC.includes(whereKey)) {
				for(let filter of whereVal) {
					isValid = isValid && this.validateWhere(filter);
				}
			} else if (COMPARATOR.includes(whereKey)) { // maybe add nested for loop for AND and OR using OF
				 isValid = isValid && this.validateWhere(whereVal);
			} else {
				conditionVal = whereVal;
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
	public validateOptions(optionBlock: any): boolean {
		let optionKeys = Object.keys(optionBlock);
		let columnKeys: string[] = [];
		let filteredColumns: string[] = [];

		if (optionKeys.length === 1) {
			if (optionKeys[0] === COLUMNS) {
				columnKeys = optionBlock[COLUMNS];
				filteredColumns = this.getColumns(columnKeys);
				this.selectedColumns = filteredColumns;
				return filteredColumns.length === columnKeys.length;
			}
		} else if (optionKeys.length === 2) {
			if (optionKeys[0] === COLUMNS && optionKeys[1] === ORDER) {
				columnKeys = optionBlock[COLUMNS];
				filteredColumns = this.getColumns(columnKeys);
				let tempArr = optionBlock[ORDER].split("_");
				let orderCol = tempArr[1];
				let orderID = tempArr[0];
				if (tempArr.length <= 2 && COLUMN_NAMES.includes(orderCol) && orderID === this.qryID) {
					this.orderKey = optionBlock[ORDER];
					this.selectedColumns = filteredColumns;
					return filteredColumns.length === columnKeys.length;
				}
			}
		}
		return false;
	}
	public getColumns(columnsBlock: any): string[] {
		let columns: string[] = [];
		for (const colKey of columnsBlock) {
			let arr = colKey.split("_");
			let setID = arr[0];
			let col = arr[1];
			if (COLUMN_NAMES.includes(col) && this.qryID === setID && arr.length <= 2) {
				columns.push(colKey);
			}
		}
		return columns;
	}

	public handleAnd(query: any): InsightDatasetSection[] {
		// Everything in the AND will return an insightdataset section. If an insightdataset section exists in all
		// the InsightDatasetSection[], then it satisfies the conditions listed in the and.
		let results: InsightDatasetSection[] = [];
		let subResult: InsightDatasetSection[] = [];
		for (const operator of query) {
			console.log("handleAnd waiting for subresult");
			subResult = this.handleFilter(operator);
			console.log("handleAnd subresults obtained");
			if (results.length === 0) {
				results = subResult; //	results needs to be initialized to something
			} else {
				// results already has sections. If results has sections that are found in subResult then the AND conditions
				// are satisfied (but does this find the overlap tho? double check) <--!
				results = results.filter((section) => subResult.includes(section));
			}
		}
		// const ids = results.map((section) => section["uuid"]);
		// const filtered = results.filter(({id}, index) => !ids.includes(id, index + 1));
		return results;
	}

	public handleOr(query: any): InsightDatasetSection[] {
		let results: InsightDatasetSection[] = [];
		let subResult: InsightDatasetSection[] = [];
		for (const operator of query) {
			subResult = this.handleFilter(operator);
			for (const section of subResult) {
				results.push(section); // @todo can i replace with ... section??
			}
		}
		// let uniqueSections = new Set(results); // remove duplicates by making it a set?
		// results = [...uniqueSections];
		// const ids = results.map((section) => section["uuid"]);
		// const filtered = results.filter(({id}, index) => !ids.includes(id, index + 1));
		results = results.filter((section) => !subResult.includes(section));
		return results;
	}

	public handleNot(query: any): InsightDatasetSection[] {
		let results: InsightDatasetSection[] = this.datasetSections;
		let subResult: InsightDatasetSection[] = [];
		for (const operator in query) {
			subResult.push(...this.handleFilter(operator)); //	does this actually work!?
		}
		let index: number;
		for (const section of subResult) {
			index = results.indexOf(section);
			if (index !== -1) {
				results.splice(index, 1); //	add a check for length
			} else {
				console.log("INTERNAL ERROR: handleNot");
			}
		}
		return results;
	}
	public handleMComparator(comparator: string, query: any): InsightDatasetSection[] {
		let filteredList: InsightDatasetSection[] = [];
		let sections: InsightDatasetSection[] = this.dataset[0].data; // @todo: change so that it matches datset ids iwth the one in the query
		let inBlock = query[comparator];
		let keys = Object.keys(query[comparator]);
		let keyArr = keys[0].split("_");
		let col = keyArr[1];
		let value = inBlock[keys[0]];
		switch (comparator) {
			case GT: {
				for (const currClass of sections) {
					if (this.getColVal(currClass, col) > value) {
						filteredList.push(currClass);
					}
				}
				break;
			}
			case LT: {
				for (const currClass of sections) {
					if (this.getColVal(currClass, col) < value) {
						filteredList.push(currClass);
					}
				}
				break;
			}
			case EQ: {
				for (const currClass of sections) {
					if (this.getColVal(currClass, col) === value) {
						filteredList.push(currClass);
					}
				}
				break;
			}
			case IS: {
				for (const currClass of sections) {
					if (this.getColVal(currClass, col) === value) {
						filteredList.push(currClass);
					}
				}
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
