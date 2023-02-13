
/**
 * Reads from disk a json file of InsightData objects
 * REQUIRES: memory to have persisted data
 * MODIFIES: this
 * EFFECTS: returns a Promise that rejects with an error if an error is encountered, otherwise returns a resolved
 * promise.
 **/
import * as fs from "fs-extra";
import {InsightData, InsightDatasetSection} from "./IInsightFacade";
import {isValidDatasetSection} from "./Parser";

export function readLocal(path: string, insightDataList: InsightData[]): void {
	let fileContent = fs.readJSONSync(path);
	let insightDataSections: InsightDatasetSection[];
	for (const insightData of fileContent) {
		insightDataSections = [];
		for (const persistedSection of insightData.data) {
			// console.log(persistedSection); CHECK FOR DUPLICATE ID IN INSIGHTDATA
			if(isValidDatasetSection(persistedSection)){
				insightDataSections.push(new InsightDatasetSection(
					persistedSection.id,
					persistedSection.course,
					persistedSection.title,
					persistedSection.professor,
					persistedSection.subject,
					persistedSection.year,
					persistedSection.avg,
					persistedSection.pass,
					persistedSection.fail,
					persistedSection.audit
				));
			}
		}
		insightDataList.push(new InsightData(
			insightData.metaData.id,
			insightData.metaData.kind,
			insightData.metaData.numRows,
			insightDataSections // ADD CHECK FOR DUPLICATED IDS.
		));
	}
}
