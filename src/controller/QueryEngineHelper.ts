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
}
