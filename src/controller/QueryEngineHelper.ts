import {
	InsightDatasetRoom,
	InsightDatasetSection,
	InsightResult, ResultTooLargeError,
} from "./IInsightFacade";
import {APPLY, APPLY_TOKEN_AVG, COUNT, GROUP, MAX,
	MIN, NUMBER_FIELDS, STRING_FIELDS, SUM, TRANSFORMATIONS,UP,DOWN} from "./Constants";
import Decimal from "decimal.js";
import {QueryEngine} from "./QueryEngine";

export class QueryEngineHelper {
	public wantedColumns: string[];
	public qryID: string;
	public query: any;
	public filteredSections: InsightDatasetSection[] | InsightDatasetRoom[];
	public orderKeys: string[];
	public orderDir: string;

	constructor(filteredSections: InsightDatasetSection[] | InsightDatasetRoom[],
		queryEngine: QueryEngine) {
		this.query = queryEngine.query;
		this.filteredSections = filteredSections;
		this.qryID = queryEngine.getQueryId();
		this.wantedColumns = queryEngine.getColumns();
		this.orderKeys =  queryEngine.getOrderKeys();
		this.orderDir = queryEngine.getOrderDir();
	}

	//	filters columns and orders them if required. Returns an insightResult Array.
	public getFormattedResult(): Promise<InsightResult[]> {
		let result: InsightResult[] = this.filteredSections.map((section) => section.prefixJson(this.qryID));

		if (Object.prototype.hasOwnProperty.call(this.query, TRANSFORMATIONS)) {
			result = this.handleTransformation(result, this.query);
		}
		if (result.length > 5000) {
			return Promise.reject(new ResultTooLargeError("Way too many results sir"));
		}
		if (this.orderDir === DOWN) {
			result = this.handleSortDOWN(result);
		} else if(this.orderKeys) {
			result = this.handleSortUP(result);
		}
		for (let section of result) {
			for (let key in section) {
				if (!this.wantedColumns.includes(key)) {
					delete section[key];
				}
			}
		}
		return Promise.resolve(result);
	}

	public handleTransformation(qryResult: InsightResult[], qry: any): InsightResult[] {
		let transformationBlock = qry[TRANSFORMATIONS];
		let groupBlock = transformationBlock[GROUP];
		let groupKeyList: string[] = groupBlock;
		let currResult: InsightResult[];
		let groups = this.handleGroup(groupKeyList, qryResult);

		let applyBlock = transformationBlock[APPLY];
		currResult = groups.map((group) => this.handleApply(group, applyBlock));
		return currResult;

	}

	public getGroup(keys: string[], section: InsightResult, qryResults: InsightResult[]): InsightResult[] {
		let group: InsightResult[] = [];
		let temp = qryResults;
		for (let key of keys) {
			group = temp.filter((result) => result[key] === section[key]);
			temp = group;
		}
		return group;
	}

	public handleGroup(keys: string[], result: InsightResult[]): InsightResult[][] {
		let visitedGroups: string[] = [];
		let groups: InsightResult[][] = [];
		// let key: string = "sections_instructor";
		for (let section of result) {
			if (this.resultIsNotGrouped(groups, section)) {
				groups.push(this.getGroup(keys, section, result)); // change to check on array of keys
			}
		}
		return groups;
	}

	public resultIsNotGrouped(madeGroups: InsightResult[][], section: InsightResult): boolean {
		return madeGroups.every((group) => !group.includes(section));
	}

	public handleApply(groups: InsightResult[], applyBlock: any): InsightResult {
		let appliedGroups = groups[0]; // can be any random insight result
		if (applyBlock.length === 0) {
			return groups[0];
		}
		//	console.log("applying timer starting: ");
		//	console.time();
		for (let applyOperation of applyBlock) {
			let column = Object.keys(applyOperation)[0];
			appliedGroups[column] = this.apply(groups, applyOperation[column]);
			//	console.log(appliedGroups);
		}
		//	console.log("applied timer ending...");
		//	console.timeEnd();
		return appliedGroups;
	}

	public apply(group: InsightResult[], applyBlock: any): string | number {
		let applySubBlock = applyBlock;
		let operation = Object.keys(applySubBlock)[0];
		let col = applySubBlock[operation];
		switch(operation) {
			case APPLY_TOKEN_AVG : {
				return this.findAVG(group,col);
			}
			case MIN : {
				return this.findMIN(group,col) as number;
			}
			case MAX : {
				return this.findMAX(group,col);
			}
			case SUM : {
				return this.findSUM(group,col);
			}
			case COUNT : {
				return this.findCOUNT(group,col);
			}
		}
		return 0;

	}

	public handleSort(results: InsightResult[]): InsightResult[] {
		if (this.orderDir === UP) {
			//	console.log("up executed");
			return this.handleSortUP(results);
		}
		return this.handleSortDOWN(results);
	}

	public handleSortUP(results: InsightResult[]): InsightResult[] {
		results.sort((a, b) => this.insightResultComparator(a, b, 0));
		return results;
	}

	public handleSortDOWN(results: InsightResult[]): InsightResult[] {
		results.sort((a, b) => -1 * this.insightResultComparator(a, b, 0));
		return results;
	}


	public findAVG(sections: InsightResult[], col: string): number {
		let total: Decimal = new Decimal(0);
		let len = sections.length;
		for (let section of sections) {
			total = Decimal.add(new Decimal(section[col]),total);
		}
		return Number((total.toNumber() / len).toFixed(2));
	}

	public findMIN(sections: InsightResult[], col: string): number | null {
		let min: number | null = null;
		for (let section of sections) {
			if (min === null || min > (section[col] as number)) {
				min = section[col] as number;
			}
		}
		return min;

	}

	public findMAX(sections: InsightResult[], col: string): number {
		let max: number = sections[0][col] as number ;
		for (let section of sections) {
			if (max < (section[col] as number)) {
				max = section[col] as number;
			}
		}
		return max;
	}

	public findSUM(sections: InsightResult[], col: string): number {

		let total: Decimal = new Decimal(0);
		for (let section of sections) {
			total = Decimal.add(new Decimal(section[col]), total);
		}
		return Number((total.toNumber()).toFixed(2));
	}

	public findCOUNT(sections: InsightResult[], col: string): number {
		let seenField: any[] = [];
		let count = 0;
		for (let section of sections) {
			if (!seenField.includes(section[col])) {
				seenField.push(section[col]);
				count++;
			}
		}
		return count;
	}

	public insightResultComparator(a: InsightResult, b: InsightResult, index: number): number {
		if (index < this.orderKeys.length) {
			if (STRING_FIELDS.includes(this.orderKeys[index].split("_")[1])) {
				if ((a[this.orderKeys[index]] as string) < (b[this.orderKeys[index]] as string)) {
					return -1;
				} else if ((a[this.orderKeys[index]] as string) > (b[this.orderKeys[index]] as string)) {
					return 1;
				} else {
					return this.insightResultComparator(a, b, index + 1);
				}
			} else {
				if ((a[this.orderKeys[index]] as number) < (b[this.orderKeys[index]] as number)) {
					return -1;
				} else if ((a[this.orderKeys[index]] as number) > (b[this.orderKeys[index]] as number)) {
					return 1;
				} else {
					return this.insightResultComparator(a, b, index + 1);
				}
			}
		}
		return 0;
	}
}
