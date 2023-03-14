import {
	InsightDatasetRoom,
	InsightDatasetSection,
	InsightResult, ResultTooLargeError,
} from "./IInsightFacade";
import {APPLY, AVG, COUNT, GROUP, MAX, MIN, NUMBER_FIELDS, STRING_FIELDS, SUM, TRANSFORMATIONS} from "./Constants";
import Decimal from "decimal.js";
import {QueryEngine} from "./QueryEngine";

export class QueryEngineHelper {
	public wantedColumns: string[];
	public orderBy: string;
	public qryID: string;
	public query: any;
	public filteredSections: InsightDatasetSection[] | InsightDatasetRoom[];

	constructor(ID: string,
		filteredSections: InsightDatasetSection[] | InsightDatasetRoom[],
		OrderCol: string,
		wantedColArr: string[], qry: any) {
		this.qryID = ID;
		this.orderBy = OrderCol;
		this.wantedColumns = wantedColArr;
		this.filteredSections = filteredSections;
		this.query = qry;
	}

	//	filters columns and orders them if required. Returns an insightResult Array.
	public getFormattedResult(): Promise<InsightResult[]> {
		let result: InsightResult[] = this.filteredSections.map((section) => section.prefixJson(this.qryID));
		if(this.orderBy !== ""){
			if(NUMBER_FIELDS.includes(this.orderBy.split("_")[1])) {
				result.sort((a, b) => (a[this.orderBy] as number) - (b[this.orderBy] as number));
			}
			if(STRING_FIELDS.includes(this.orderBy.split("_")[1])) {
				result.sort((a, b) => {
					return (a[this.orderBy] as string).localeCompare(b[this.orderBy] as string);
				});
			}
		}
		if(Object.prototype.hasOwnProperty.call(this.query, TRANSFORMATIONS)){
			result = this.handleTransformation(result, this.query);
			// console.log(newResult);
		}
		if(result.length > 5000) {
			return Promise.reject(new ResultTooLargeError("Way too many results sir"));
		}
		for(let section of result){
			for(let key in section) {
				if(!this.wantedColumns.includes(key)) {
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
		// console.log(groups);

		let applyBlock = transformationBlock[APPLY];
		currResult = groups.map((group) => this.handleApply(group, applyBlock));
		return currResult;

	}

	public getGroup(keys: string[], section: InsightResult, qryResults: InsightResult[]): InsightResult[] {
		let group: InsightResult[] = [];
		let temp = qryResults;
		for(let key of keys) {
			group = temp.filter((result) => result[key] === section[key]);
			temp = group;
		}
		return group;
	}

	public handleGroup(keys: string[], result: InsightResult[]): InsightResult[][]  {
		let visitedGroups: string[]  = [];
		let groups: InsightResult[][] = [];
		// let key: string = "sections_instructor";
		for (let section of result) {
			if(this.resultIsNotGrouped(groups, section)) {
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
		if(applyBlock.length === 0){
			return groups[0];
		}
		for(let applyOperation of applyBlock) {
			let column = Object.keys(applyOperation)[0];
			// something like appliedGroups[key] = someResult
			appliedGroups[column] = this.apply(groups, applyOperation[column]);
		}
		return appliedGroups;
	}

	public apply(group: InsightResult[], applyBlock: any): string | number {
		let applySubBlock = applyBlock;
		let operation = Object.keys(applySubBlock)[0];
		let col = applySubBlock[operation];
		switch(operation) {
			case AVG : {
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

	public rename(section: any, oldCol: string, newCol: string): InsightResult {
		//	@todo CHECK IF THIS WORKS???
		Object.keys(section).forEach(function(key) {
			let newkey = newCol;
			section[newkey] = section[key];
			delete section[key];
		});
		return section;
	}
	/*	public handleSort(): void {
	}*/

	public findAVG(sections: InsightResult[], col: string): number {
		let total: Decimal = new Decimal(0);
		let len = sections.length;
		for (let section of sections) {
			total.add(new Decimal(section[col]));
		}
		return Number((total.toNumber() / len).toFixed(2));
	}

	public findMIN(sections: InsightResult[], col: string): number | null {
		let min: number | null = null;
		for (let section of sections) {
			if(min === null || min > (section[col] as number)){
				min = section[col] as number;
			}
		}
		return min;

	}

	public findMAX(sections: InsightResult[], col: string): number {
		let max: number = 0;
		for (let section of sections) {
			if(max < (section[col] as number)){
				max = section[col] as number;
			}
		}
		return max;
	}

	public findSUM(sections: InsightResult[], col: string): number {

		let total: Decimal = new Decimal(0);
		for (let section of sections) {
			total.add(new Decimal(section[col]));
		}
		return Number((total.toNumber()).toFixed(2));
	}

	public findCOUNT(sections: InsightResult[], col: string): number {
		return sections.length;
	}
}


