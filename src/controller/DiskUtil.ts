
/**
 * Reads from disk a json file of InsightData objects
 * REQUIRES: memory to have persisted data
 * MODIFIES: this
 * EFFECTS: returns a Promise that rejects with an error if an error is encountered, otherwise returns a resolved
 * promise.
 **/
import * as fs from "fs-extra";
import {InsightData, InsightDatasetSection} from "./IInsightFacade";
const REQUIRED_DATASET_SECTION_KEYS =
	["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
export function readLocal(path: string, insightDataList: InsightData[]) {
	try {
		console.log(path);
		let fileContent = fs.readJSONSync(path);
		// console.log(fileContent);
		let insightDataSections: InsightDatasetSection[];
		for (const insightData of fileContent) {
			insightDataSections = [];
			if(!isDuplicatedDataset(insightDataList, insightData.metaData.id)) {
				for (const persistedSection of insightData.data) {
					// console.log(persistedSection);
					if(isValidDatasetSection(persistedSection)){
						insightDataSections.push(new InsightDatasetSection(
							persistedSection["uuid"],
							persistedSection["id"],
							persistedSection["title"],
							persistedSection["instructor"],
							persistedSection["dept"],
							persistedSection["year"],
							persistedSection["avg"],
							persistedSection["pass"],
							persistedSection["fail"],
							persistedSection["audit"]
						));
					}
				}
				insightDataList.push(new InsightData(
					insightData.metaData.id,
					insightData.metaData.kind,
					insightData.metaData.numRows,
					insightDataSections
				));
			}
		}
	} catch(Exception) {
		return ("There was an error reading from disk");
	}
}

export function writeLocal(path: string, insightDataList: InsightData[]): boolean {
	try {
		// console.log(path);
		fs.outputJsonSync(path, insightDataList);
		return true;
	} catch(Exception) {
		return false;
	}
}

function isDuplicatedDataset(insightDataList: InsightData[], id: string): boolean {
	for (const dataset of insightDataList) {
		if (dataset.metaData.id === id) {
			return true;
		}
	}
	return false;
}

function isValidDatasetSection(section: any): boolean {
	let isValid = true;
	for(const requiredKey of REQUIRED_DATASET_SECTION_KEYS) {
		isValid = isValid && Object.prototype.hasOwnProperty.call(section,requiredKey.toLowerCase());
	}
	return isValid;
}
