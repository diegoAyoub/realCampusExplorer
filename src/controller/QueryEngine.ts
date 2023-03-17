import {
	InsightData, InsightResult,

} from "./IInsightFacade";
import {QueryEngineHelper} from "./QueryEngineHelper";
import {
	AND,
	EQ,
	GT,
	IS, LT,
	NOT,
	OR,
	WHERE,
} from "./Constants";
import {QueryValidator} from "./QueryValidator";

export class QueryEngine {
	public dataset: InsightData[];
	public datasetKind: string;
	public query: any;
	public qryID: string = "";
	public datasetSections: any[] = [];
	public orderKey: string;
	public orderKeys: string[];
	public selectedColumns: string[];
	public applyKeys: string[];
	public groups: string[];
	public orderDir: string;

	constructor(data: InsightData[], qryJson: unknown) {
		this.dataset = data;
		this.query = qryJson as any;
		this.datasetKind = "";
		this.selectedColumns = [];
		this.applyKeys = [];
		this.orderKeys = [];
		this.groups = [];
		this.orderKey = "";
		this.orderDir = "";
	}

	public doQuery(query: any): Promise<InsightResult[]> {
		let results: any[] = this.handleFilter(query[WHERE]);
		if (results === null || results === undefined) {
			return Promise.reject("Invalid Query");
		} else {
			let result = new QueryEngineHelper(results, this);
			return result.getFormattedResult();
		}
	}

	public handleFilter(query: any): any[] {
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
		let queryValidator = new QueryValidator(this, this.query);
		return queryValidator.isValidQuery();
	}

	public setDataset(id: string): void {
		for (const dataset of this.dataset) {
			if (dataset.metaData.id === id) {
				this.datasetSections = dataset.data; // keep track of all sections being looked at
				this.datasetKind = dataset.metaData.kind;
				return;
			}
		}
	}

	public setQueryId(key: string) {
		this.qryID = key;
	}

	public getQueryId(): string {
		return this.qryID;
	}

	public setColumns(columns: string[]) {
		this.selectedColumns = columns;
	}

	public getColumns(): string[] {
		return this.selectedColumns;
	}

	public setOrderKeys(keys: string[]) {
		this.orderKeys = keys;
	}

	public setOrderDir(orderDir: string){
		this.orderDir = orderDir;
	}

	public getOrderDir(): string {
		return this.orderDir;
	}

	public getOrderKeys(): string[] {
		return this.orderKeys;
	}

	public getApplyKeys(): string[] {
		return this.applyKeys;
	}

	public addApplyKey(applyKey: string): void {
		this.applyKeys.push(applyKey);
	}

	public getGroups(): string[] {
		return this.groups;
	}

	public setGroups(group: string[]): void {
		this.groups = group;
	}

	public isDatasetAdded(datasetId: string): boolean {
		for (const dataset of this.dataset) {
			if (dataset.metaData.id === datasetId) {
				this.datasetSections = dataset.data; // keep track of all sections being looked at
				this.datasetKind = dataset.metaData.kind;
				return true;
			}
		}
		return false;
	}

	public getDatasetKind(): string {
		return this.datasetKind;
	}

	public handleAnd(query: any): any[] {
		let results: any[] = [];
		let subResult: any[];
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

	public handleOr(query: any): any[] {
		let results: any[] = [];
		let subResult: any[] = [];
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

	public handleNot(query: any): any[]  {
		let results: any[] = this.datasetSections;
		let subResult: any[] = this.handleFilter(query); //	does this actually work!?
		results = results.filter((section) => !subResult.includes(section)); // gets everythin in results thats not in subresult
		return results;
	}

	public handleMComparator(comparator: string, query: any): any[] {
		let sections: any[] = this.datasetSections;
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
}
