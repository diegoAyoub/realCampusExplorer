import {
	InsightData, InsightDatasetSection, InsightResult,
	ResultTooLargeError,
} from "./IInsightFacade";
import {QueryEngineHelper} from "./QueryEngineHelper";
import {
	AND,
	COLUMNS,
	COMPARATOR,
	EQ,
	FIELD_NAMES,
	GT,
	IS, LOGIC,
	LT,
	NOT,
	OPTION_KEYS,
	OPTIONS,
	OR,
	ORDER,
	WHERE,
	COLUMN_NUMBERS,
	COLUMN_STRINGS
} from "./Constants";

export class QueryEngine {
	public dataset: InsightData[];
	public query: any;
	public qryID: string = "";
	public datasetSections: InsightDatasetSection[] = [];
	public orderKey: string;
	public selectedColumns: string[];
	constructor(data: InsightData[], qryJson: unknown) {
		this.dataset = data;
		this.query = qryJson as any;
		this.selectedColumns = [];
		this.orderKey = "";
	}
	public doQuery(query: any): Promise<InsightResult[]> {
		let results: InsightDatasetSection[] = this.handleFilter(query[WHERE]);
		if (results === null || results === undefined) {
			return Promise.reject("Invalid Query");
		} else if(results.length > 5000) {
			return Promise.reject(new ResultTooLargeError("Way too many results sir"));
		} else {
			let resultFormatter = new QueryEngineHelper(this.qryID, results, this.orderKey, this.selectedColumns);
			return Promise.resolve(resultFormatter.getFormattedResult());
		}
	}

	public handleFilter(query: any): InsightDatasetSection[] {
		if(Object.prototype.hasOwnProperty.call(query, AND)) {
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
		let hasWhere: boolean = Object.prototype.hasOwnProperty.call(this.query, WHERE);
		let hasOptions: boolean = Object.prototype.hasOwnProperty.call(this.query, OPTIONS);
		if (hasWhere && hasOptions) { // WHERE KEY NOT FOUND OR OPTIONS KEY NOT FOUND
			let isValidOptions = this.isValidOptionsBlock(this.query[OPTIONS]); // validate options first
			this.setDataset(this.qryID); // maybe move this somewhere
			let isWhereEmpty: boolean = Object.keys(this.query[WHERE]).length === 0;
			let isValidWhere: boolean = this.isValidWhereBlock(this.query[WHERE]);
			return (isWhereEmpty || isValidWhere) && isValidOptions;
		}
		return false;
	}
	public isValidWhereBlock(filter: any): boolean {
		let isValid = true;
		let keys: string[] = Object.keys(filter);
		let key = keys[0];
		if(keys.length !== 1){
			return false;
		} else if(LOGIC.includes(key) && filter[key].length) { // IS {AND, OR}
			for(const filterObject of filter[key]) {
				isValid = isValid && this.isValidWhereBlock(filterObject);
			}
			return isValid;
		} else if(COMPARATOR.includes(key)){ // IS {LT, GT, EQ, IS}
			return isValid && this.isValidComparatorEntry(filter[key], key);
		} else if(NOT === key) { // IS {NOT}
			return this.isValidWhereBlock(filter[key]);
		} else {
			return false;
		}
	}

	public isValidComparatorEntry(object: any, comparator: string): boolean {
		let key = Object.keys(object)[0];
		let field = key.split("_")[1];
		let value = object[key];
		if(COLUMN_NUMBERS.includes(field) && COLUMN_NUMBERS.includes(comparator) && typeof value === "number") {
			return this.isValidKey(key);
		} else if(COLUMN_STRINGS.includes(field) && COLUMN_STRINGS.includes(comparator) && typeof value === "string") {
			return this.isValidWildCard(value) && this.isValidKey(key);
		} else {
			return false;
		}
	}
	public isValidOptionsBlock(optionBlock: any): boolean {
		let optionKeys: string[] = Object.keys(optionBlock);
		let optionsHasValidKeys: boolean = this.optionsHasValidKeys(optionBlock); // KEYS ARE IN THE SET COLUMN_KEYS
		let optionsHasColumns: boolean = optionKeys.includes(COLUMNS); // HAS COLUMNS
		let isValidColumns: boolean = this.isValidColumns(optionBlock[COLUMNS]); // COLUMNS IS AN ARRAY AND EACH ELEMENT IS A STRING, REFERENCES ONE DATASET
		if(optionsHasValidKeys && optionsHasColumns && isValidColumns) {
			this.setColumns(optionBlock[COLUMNS]);
			this.setQueryId(this.selectedColumns[0]);
			let optionsHasOrder = optionKeys.includes(ORDER);
			if(optionsHasOrder && this.isValidKey(optionBlock[ORDER])) {
				this.setOrderKey(optionBlock[ORDER]);
				return this.selectedColumns.includes(optionBlock[ORDER]);
			} else {
				return true;
			}
		}
		return false;

	}
	public setDataset(id: string): void {
		for (const dataset of this.dataset) {
			if (dataset.metaData.id === id) {
				this.datasetSections = dataset.data; // keep track of all sections being looked at
			}
		}
	}
	public setQueryId(key: string) {
		this.qryID = key.split("_")[0];
	}
	public setColumns(columns: string[]) {
		this.selectedColumns = columns;
	}
	public setOrderKey(key: string) {
		this.orderKey = key;
	}
	public optionsHasValidKeys(optionBlock: any): boolean {
		let optionKeys = Object.keys(optionBlock);
		return optionKeys.every((element: any) => OPTION_KEYS.includes(element));
	}
	public isValidColumns(columns: any): boolean {
		let isArray = Array.isArray(columns); // is an array
		if(isArray && columns.length > 0) {
			let isStringArray = columns.every((element: any) => typeof element === "string"); // everything is a string
			let referencedDataset = columns[0].split("_")[0];
			let hasSameDatasetIds = columns.every((element: any) => element.split("_")[0] === referencedDataset); // EVERYTHING REFERENCES THE SAME DATASET
			let isValidFieldsReferenced = columns.every((element: any) => FIELD_NAMES.includes(element.split("_")[1])); // FIELDS REFERENCED ARE ONES THAT ARE SUPPORTED
			return isStringArray && hasSameDatasetIds && isValidFieldsReferenced;
		}
		return false;
	}
	public isValidKey(key: any): boolean {
		let arr = key.split("_");
		let setID = arr[0];
		let col = arr[1];
		return typeof key === "string" && FIELD_NAMES.includes(col) && this.qryID === setID && arr.length === 2;
	}
	public handleAnd(query: any): InsightDatasetSection[] {
		let results: InsightDatasetSection[] = [];
		let subResult: InsightDatasetSection[];
		for (const operator of query) {
			subResult = this.handleFilter(operator);
			if (subResult.length === 0) {
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
		let subResult: InsightDatasetSection[]  = this.handleFilter(query); //	does this actually work!?
		results = results.filter((section) => !subResult.includes(section)); // gets everythin in results thats not in subresult
		return results;
	}
	public handleMComparator(comparator: string, query: any): InsightDatasetSection[] {
		let sections: InsightDatasetSection[] = this.datasetSections;
		let keyValueObject = query[comparator];
		let key = Object.keys(keyValueObject)[0];
		let value = keyValueObject[key];
		let field = key.split("_")[1];
		switch (comparator) {
			case GT: {
				return sections.filter((section) => section.get(field) > value);
			}
			case LT: {
				return sections.filter((section) => section.get(field) < value);
			}
			case EQ: {
				return sections.filter((section) => section.get(field) === value);
			}
			case IS: {
				return sections.filter((section) => this.isStringMatched(section.get(field), value));
			}
		}
		return [];
	}
	public isStringMatched(inputString: string | number, pattern: string): boolean {
		let wildArr = pattern.split("*");
		let value: string = inputString as string;
		if(pattern === value) {
			return true;
		} else if (wildArr.length === 2) {
			if (pattern === "*") {
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
