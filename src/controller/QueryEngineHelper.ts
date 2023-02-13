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

		this.init();
	}

	//	filters columns and orders them if required. Returns an insightResult Array.
	private init(): InsightResult[] {

		let result: InsightResult[] = [];
		if(this.orderBy !== ""){
			this.filteredSections.sort(this.compareFnValues);
		}

		for(const section of this.filteredSections){
			//	add only wanted columns to insightResult array
			for(const col of this.wantedColumns){
				//	section.
			}
		}

		return result;
	}

	private compareFnValues(a: InsightDatasetSection, b: InsightDatasetSection): number {

// 		if(a.(this.orderBy) > b.(this.orderBy)) {
// 			return 1;
// 		}
// 		if(a.(this.orderBy) < b.(this.orderBy)) {
// 			return -1;
// 		}
//
// 		return 0;
		return 1;
	}


/*	public prefixJSON(datasetID: string, dataSection): InsightResult {
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
			[keyUUID]: this.uuid,
			[keyCourse]: this.id,
			[keyTitle]: this.title,
			[keyProfessor]: this.instructor,
			[keySubject]: this.dept,
			[keyYear]: this.year,
			[keyAvg]: this.avg,
			[keyPass]: this.pass,
			[keyFail]: this.fail,
			[keyAudit]: this.audit,
		};
	}*/
}
