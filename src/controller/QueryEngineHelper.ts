import {
	InsightDatasetSection,
	InsightResult,
} from "./IInsightFacade";
import {COLUMN_NUMBERS, COLUMN_STRINGS} from "./Constants";

export class QueryEngineHelper {
	public wantedColumns: string[];
	public orderBy: string;
	public qryID: string;
	public filteredSections: InsightDatasetSection[];
	constructor(ID: string, filteredSections: InsightDatasetSection[], OrderCol: string, wantedColArr: string[]) {
		this.qryID = ID;
		this.orderBy = OrderCol;
		this.wantedColumns = wantedColArr;
		this.filteredSections = filteredSections;
	}

	//	filters columns and orders them if required. Returns an insightResult Array.
	public getFormattedResult(): InsightResult[] {
		let result: InsightResult[] = this.filteredSections.map((section) => this.prefixJSON(this.qryID, section));
		if(this.orderBy !== ""){
			if(COLUMN_NUMBERS.includes(this.orderBy.split("_")[1])) {
				result.sort((a, b) => (a[this.orderBy] as number) - (b[this.orderBy] as number));
			}
			if(COLUMN_STRINGS.includes(this.orderBy.split("_")[1])) {
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
		return result;
	}

	public prefixJSON(datasetID: string, section: InsightDatasetSection): InsightResult {
		let keyUUID = datasetID + "_" + "uuid";
		let keyID = datasetID + "_" + "id";
		let keyTitle = datasetID + "_" + "title";
		let keyInstructor = datasetID + "_" + "instructor";
		let keyDept = datasetID + "_" + "dept";
		let keyYear = datasetID + "_" + "year";
		let keyAvg = datasetID + "_" + "avg";
		let keyPass = datasetID + "_" + "pass";
		let keyFail = datasetID + "_" + "fail";
		let keyAudit = datasetID + "_" + "audit";

		return {
			[keyUUID]: section.uuid,
			[keyID]: section.id,
			[keyTitle]: section.title,
			[keyInstructor]: section.instructor,
			[keyDept]: section.dept,
			[keyYear]: section.year,
			[keyAvg]: section.avg,
			[keyPass]: section.pass,
			[keyFail]: section.fail,
			[keyAudit]: section.audit,
		};
	}
}
