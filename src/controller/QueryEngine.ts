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

import * as InFa from "./InsightFacade";
import * as fs from "fs-extra";
import * as zip from "jszip";
import JSZip from "jszip";

const COMPARATORLOGIC = ["AND", "OR", "LT", "GT", "EQ", "IS", "NOT"];

//	RECURSION
let NOT = "NOT";
let AND = "AND";
let OR = "OR";
//	BASE CASE
let IS = "IS";
let LT = "LT";
let EQ = "EQ";
let GT = "GT";
//	QUERY STUFF
let WHERE = "WHERE";
let OPTIONS = "OPTIONS";
let ORDER = "ORDER";
let COLUMNS = "COLUMNS";

export class QueryEngine {
	public dataset: InsightData[];
	public queryJson: any;
	public qryID: string = "";
	public datasetSections: InsightDatasetSection[] = [];

	constructor(data: InsightData[], qryJson: unknown) {
		this.dataset = data;
		this.queryJson = qryJson as any;
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
			let inBlock = query[LT];
			let keys = Object.keys(query[LT]);
			let keyArr = keys[0].split("_");
			let col = keyArr[1];
			let value = inBlock[keys[0]];

			return this.handleMComparator(LT, col, value, query[LT]);
		} else if (Object.prototype.hasOwnProperty.call(query, GT)) {
			let inBlock = query[GT];
			let keys = Object.keys(query[GT]);
			let keyArr = keys[0].split("_");
			let col = keyArr[1];
			let value = inBlock[keys[0]];
			return this.handleMComparator(GT, col, value, query[GT]);
		} else if (Object.prototype.hasOwnProperty.call(query, IS)) {
			let inBlock = query[IS];
			let keys = Object.keys(query[IS]);
			let keyArr = keys[0].split("_");
			let col = keyArr[1];
			let value = inBlock[keys[0]];

			return this.handleMComparator(IS, col, value, query[IS]);
		} else if (Object.prototype.hasOwnProperty.call(query, EQ)) {
			let inBlock = query[EQ];
			let keys = Object.keys(query[EQ]);
			let keyArr = keys[0].split("_");
			let col = keyArr[1];
			let value = inBlock[keys[0]];

			return this.handleMComparator(EQ, col, value, query[EQ]);
		}
		let emptyRet: InsightDatasetSection[] = [];
		return emptyRet;
	}

	public validateQuery(): boolean {
		//	check if the query is in an input section like in the tests [TESTING PURPOSES ONLY I THINK]
		if (Object.prototype.hasOwnProperty.call(this.queryJson, "input")) {
			this.queryJson = this.queryJson["input"];
		}
		//	check if there is a where block
		let isWhere: boolean = Object.prototype.hasOwnProperty.call(this.queryJson, "WHERE");
		if (!isWhere) {
			return false; //	Promise.reject(new InsightError("Invalid query lang: WHERE"));
		}
		//	check if there is an options block or return error
		let isOptions: boolean = Object.prototype.hasOwnProperty.call(this.queryJson, "OPTIONS");

		if (!isOptions) {
			return false; //	Promise.reject(new InsightError("Invalid query lang: OPTIONS"));
		}
		// validateWhere();
		return true;
	}
	// Recursion through where sub block, explores each layer of camparators until section ID and column is found. Then
	//	returns true if valid. false otherwise
	public validateWhere(whereBlock: any): boolean {
		let conditionVal: any;
		for (let key in whereBlock) {
			let whereKey: string = key;
			let whereVal = whereBlock[key] as any;
			if (COMPARATORLOGIC.includes(whereKey)) {
				return this.validateWhere(whereKey);
			} else {
				conditionVal = whereVal;
				//	GET ID
				let keyArr = whereKey.split("_");
				let queryID: string = keyArr[0];
				let conditionCol: string = keyArr[1];

				if (!this.isIdExist(queryID) || !this.isValidId(queryID)) {
					return false; // Promise.reject(new InsightError("Query ID is not valid or does not exist"));
				}
				//	ELSE
			}
		}
		return true;
	}

	public handleAnd(query: any): InsightDatasetSection[] {
		// Everything in the AND will return an insightdataset section. If an insightdataset section exists in all
		// the InsightDatasetSection[], then it satisfies the conditions listed in the and.
		let results: InsightDatasetSection[] = [];
		let subResult: InsightDatasetSection[] = [];
		for (const operator in query) {
			console.log("handleAnd waiting for subresult");
			subResult = this.handleFilter(operator);
			console.log("handleAnd subresults obtained");
			if (results.length === 0) {
				results = subResult; //	results needs to be initialized to something
			} else {
				// results already has sections. If results has sections that are found in subResult then the AND conditions
				// are satisfied (but does this find the overlap tho? double check) <--!
				results.filter((section) => subResult.includes(section));
			}
		}
		return results;
	}

	public handleOr(query: any): InsightDatasetSection[] {
		let results: InsightDatasetSection[] = [];
		let subResult: InsightDatasetSection[] = [];
		for (const operator in query) {
			subResult = this.handleFilter(operator);
			for (const section of subResult) {
				results.push(section); // @todo can i replace with ... section??
			}
		}
		// remove duplicates by making it a set?
		let uniqueSections = new Set(results);
		results = [...uniqueSections];
		return results;
	}

	public handleNot(query: any): InsightDatasetSection[] {
		let results: InsightDatasetSection[] = this.datasetSections;
		let subResult: InsightDatasetSection[] = [];
		for (const operator in query) {
			subResult.push(...this.handleFilter(operator));
		}

		let index: number;
		for (const section of subResult) {
			index = results.indexOf(section);
			if (index !== -1) {
				results.splice(index, 1);
			} else {
				console.log("INTERNAL ERROR: handleNot");
			}
		}

		return results;
	}
	public handleMComparator(comparator: string, col: string, value: string, query: any): InsightDatasetSection[] {
		let filteredList: InsightDatasetSection[] = [];
		let sections: InsightDatasetSection[] = this.dataset[0].data;
		switch (comparator) {
			case "GT": {
				//	do something
				for (const currClass of sections) {
					if (this.getColVal(currClass, col) > value) {
						filteredList.push(currClass);
					}
				}
				break;
			}
			case "LT": {
				for (const currClass of sections) {
					if (this.getColVal(currClass, col) < value) {
						filteredList.push(currClass);
					}
				}
				break;
			}
			case "EQ": {
				for (const currClass of sections) {
					if (this.getColVal(currClass, col) === value) {
						filteredList.push(currClass);
					}
				}
				break;
			}
		}
		// return Promise.resolve("");
		return filteredList;
	}

	public getColVal(section: any, colName: string): string | number {
		switch (colName) {
			case "uuid": {
				return section["uuid"];
			}
			case "id": {
				return section["id"];
			}
			case "title": {
				return section["title"];
			}
			case "instructor": {
				return section["instructor"];
			}
			case "dept": {
				return section["dept"];
			}
			case "year": {
				return section["year"];
			}
			case "avg": {
				return section["avg"];
			}
			case "pass": {
				return section["pass"];
			}
			case "fail": {
				return section["fail"];
			}
			case "audit": {
				return section["audit"];
			}
			// @TODO might need a default case sending back an error here
		}
		return "cmon now";
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

	public isValidId(id: string): Promise<string> {
		if (id.trim().length === 0) {
			// blank id or id is all whitespace
			return Promise.reject(new InsightError("The ID must contain non white space characters"));
		} else if (id.includes("_")) {
			// id has an underscore
			return Promise.reject(new InsightError('The ID can\'t contain any underscores "_"'));
		}
		return Promise.resolve("");
	}
}
