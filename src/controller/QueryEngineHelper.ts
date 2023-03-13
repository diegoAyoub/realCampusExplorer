import {
	InsightDatasetRoom,
	InsightDatasetSection,
	InsightResult,
} from "./IInsightFacade";
import {NUMBER_FIELDS, STRING_FIELDS} from "./Constants";
import Decimal from "decimal.js";

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
	public getFormattedResult(): InsightResult[] {
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
		for(let section of result){
			for(let key in section) {
				if(!this.wantedColumns.includes(key)) {
					delete section[key];
				}
			}
		}

		if(Object.prototype.hasOwnProperty.call(this.query, "TRANSFORMATION")){
			let newResult: InsightResult[][] = this.handleTransformation(result, this.query);
			result = [];
			for(let group of newResult){
				for(let section of group){
					result.push(section);
				}
			}
		}
		return result;
	}

	public handleTransformation(qryResult: InsightResult[], qry: any): InsightResult[][] {
		let transformationBlock = qry["TRANSFORMATIONS"];
		let groupBlock = transformationBlock["GROUP"];
		let groupKeyList: string[] = groupBlock;
		let currResult: InsightResult[] = qryResult;
		let groups: InsightResult[][] = [];
		while(groupKeyList.length !== 0) {
			let hGroupResult = this.handleGroup(groupKeyList[0],qryResult, groups);
			groups.push(...this.handleGroup(groupKeyList[0], qryResult, groups));
			groupKeyList.shift();
				 //	@todo figure out this logic of 2d arrays and 1d array of groups
		}

		let applyBlock = transformationBlock["APPLY"];
		groups = this.handleApply(groups, applyBlock);
		return groups;

	}

	public getGroup(key: string, condition: string | number, sectionList: InsightResult[]): InsightResult[] {
		let group: InsightResult[] = [];
		for(let section of sectionList) {
			if(section[key] === condition){
				group.push(section);
			}
		}
		return group;
	}

	public handleGroup(key: string, result: InsightResult[], currResult: InsightResult[][]): InsightResult[][]  {
		let visitedGroups: string[]  = [];
		let groups: InsightResult[][] = [];
		//	let key: string = "sections_instructor";
		if(currResult.length === 0){
			for (let section of result) {
				if(!visitedGroups.includes(section[key] as string)) {
					visitedGroups.push(section[key] as string);
					groups.push(this.getGroup(key, section[key], result));
				}
			}
		} else{
			for(let res of currResult){
				for (let section of res){
					if(!visitedGroups.includes(section[key] as string)) {
						visitedGroups.push(section[key] as string);
						groups.push(this.getGroup(key, section[key], result));
					}
				}
			}
		}

		return groups;
	}

	public handleApply(groups: InsightResult[][], applyBlock: any): InsightResult[][] {
		let appliedGroups: InsightResult[][] = [];
		if(applyBlock.length === 0){
			return groups;
		}
		while(applyBlock.length !== 0){
			let colRenamed: string = Object.keys(applyBlock[0])[0];
			for(let group of groups){
				appliedGroups.push(this.apply(group, applyBlock[0], colRenamed));
			}
			applyBlock.shift();
		}
		return appliedGroups;
	}

	public apply(group: InsightResult[], applyBlock: any, renamedCol: string ): InsightResult[] {
		let applySubBlock = applyBlock[0];
		let operation = Object.keys(applySubBlock)[0];
		let col = applySubBlock[operation];
		let value: number = 0;
		switch(operation) {
			case "AVG" : {
				value = this.findAVG(group,col);
			}
			case "MIN" : {
				value = this.findMIN(group,col) as number;
			}
			case "MAX" : {
				value = this.findMAX(group,col);
			}
			case "SUM" : {
				value = this.findSUM(group,col);
			}
			case "COUNT" : {
				value = this.findCOUNT(group,col);
			}
		}
		for(let section of group){
			section[col] = value;
			section = this.rename(section, col, renamedCol);
		}
		return group;

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


