import {
	InsightDatasetRoom,
	InsightDatasetSection,
	InsightResult,
} from "./IInsightFacade";
import {NUMBER_FIELDS, STRING_FIELDS} from "./Constants";

export class QueryEngineHelper {
	public wantedColumns: string[];
	public orderBy: string;
	public qryID: string;
	public filteredSections: InsightDatasetSection[] | InsightDatasetRoom[];
	constructor(ID: string,
		filteredSections: InsightDatasetSection[] | InsightDatasetRoom[],
		OrderCol: string,
		wantedColArr: string[]) {
		this.qryID = ID;
		this.orderBy = OrderCol;
		this.wantedColumns = wantedColArr;
		this.filteredSections = filteredSections;
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
		return result;
	}

	public prefixJsonSection(datasetID: string, section: InsightDatasetSection): InsightResult {
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

	public prefixJsonRoom(datasetID: string, room: InsightDatasetRoom): InsightResult {
		let keyFullName = datasetID + "_" + "fullname";
		let keyShortName = datasetID + "_" + "shortname";
		let keyNumber = datasetID + "_" + "number";
		let keyName = datasetID + "_" + "name";
		let keyAddress = datasetID + "_" + "address";
		let keyLat = datasetID + "_" + "lat";
		let keyLon = datasetID + "_" + "lon";
		let keySeats = datasetID + "_" + "seats";
		let keyType = datasetID + "_" + "type";
		let keyFurniture = datasetID + "_" + "furniture";
		let keyHref = datasetID + "_" + "href";

		return {
			[keyFullName]: room.fullname,
			[keyShortName]: room.shortname,
			[keyNumber]: room.number,
			[keyName]: room.name,
			[keyAddress]: room.address,
			[keyLat]: room.lat,
			[keyLon]: room.lon,
			[keySeats]: room.seats,
			[keyType]: room.type,
			[keyFurniture]: room.furniture,
			[keyHref]: room.href,
		};
	}
}
