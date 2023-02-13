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


export class QueryEngineHelper {

	public wantedColumns: string[];
	public orderBy: string;
	public qryID: string;
	public filteredSections: InsightDatasetSection[];
	//	public
	constructor(ID: string, filteredSections: InsightDatasetSection[], OrderCol: string, wantedColArr: string[]) {

		this.qryID = ID;
		this.orderBy = OrderCol;
		this.wantedColumns = wantedColArr;
		this.filteredSections = filteredSections;
		// this.init();
	}
	//	filters columns and orders them if required. Returns an insightResult Array.
	public getFormattedResult(): InsightResult[] {

		let result: InsightResult[] = this.filteredSections.map((section) => this.prefixJSON(this.qryID, section));
		// console.log("HAS LENGTH = " + result.length);
		if(this.orderBy !== ""){
			// let x = result[0]["sections_avg"];
			result.sort((a, b) => {
				if(a[this.orderBy] > b[this.orderBy]) {
					return 1;
				}
				if(a[this.orderBy] < b[this.orderBy]) {
					return -1;
				}
				return 0;
			});
		}
		for(let section of result){
			for(let key in section) {
				if(!this.wantedColumns.includes(key)) {
					delete section[key];
				}
			}
		}
		console.log("HAS LENGTH = " + result.length);
		return result;
	}

	private compareFnValues(a: InsightResult, b: InsightResult): number {

		if(a[this.orderBy] > b[this.orderBy]) {
			return 1;
		}
		if(a[this.orderBy] < b[this.orderBy]) {
			return -1;
		}
		return 0;
	}

	// private getResults() {
	// 	let results = this.filteredSections.map((section) => this.prefixJSON(this.qryID, section));
	// }

	public prefixJSON(datasetID: string, section: InsightDatasetSection): InsightResult {
		let keyUUID = datasetID + "_" + "uuid";
		let keyCourse = datasetID + "_" + "id";
		let keyTitle = datasetID + "_" + "title";
		let keyProfessor = datasetID + "_" + "instructor";
		let keySubject = datasetID + "_" + "dept";
		let keyYear = datasetID + "_" + "year";
		let keyAvg = datasetID + "_" + "avg";
		let keyPass = datasetID + "_" + "pass";
		let keyFail = datasetID + "_" + "fail";
		let keyAudit = datasetID + "_" + "audit";

		return {
			[keyUUID]: section.uuid,
			[keyCourse]: section.id,
			[keyTitle]: section.title,
			[keyProfessor]: section.instructor,
			[keySubject]: section.dept,
			[keyYear]: section.year,
			[keyAvg]: section.avg,
			[keyPass]: section.pass,
			[keyFail]: section.fail,
			[keyAudit]: section.audit,
		};
	}
}
