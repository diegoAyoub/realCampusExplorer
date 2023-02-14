import {
	IInsightFacade,
	InsightData,
	InsightDataset,
	InsightDatasetKind,
	InsightDatasetSection,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";
import {QueryEngine} from "./QueryEngine";
import * as fs from "fs-extra";
import * as zip from "jszip";
import JSZip from "jszip";
import {parseClasses} from "./Parser";
import {readLocal} from "./DiskUtil";

const PATH_TO_ARCHIVES = "../../test/resources/archives/";
const DATA = "pair.zip";
// const PATH_TO_ROOT_DATA = "../../../data/data.JSON"; // USE THIS WHEN RUNNING WITH MAIN
const PATH_TO_ROOT_DATA = "./data/data.json"; // USE THIS WHEN RUNNING MOCHA

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 */
export default class InsightFacade implements IInsightFacade {
	public insightDataList: InsightData[] = [];
	private queryEng: QueryEngine | null = null;
	constructor() {
		console.log("InsightFacadeImpl::init()");
		readLocal(PATH_TO_ROOT_DATA, this.insightDataList);
	}
	// @todo: Go through spec for what needs to be done once a valid section is found (special cases)
	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let asyncJobs: any[] = [];
		let sections: InsightDatasetSection[] = [];
		return this.isValidInsightKind(kind) //
			.then(() => this.isValidId(id))
			.then(() => this.isIdExist(id) ? Promise.reject("The ID already exists") : Promise.resolve())
			.then(() =>  zip.loadAsync(content, {base64: true}))
			.then((base64Data: JSZip) => {
				base64Data.folder("courses")?.forEach((relativePath, file) => {
					asyncJobs.push(file.async("string"));
				});
			})
			.then(() => Promise.all(asyncJobs).then((classes) => parseClasses(classes, sections)))
			.then(() => {
				try {
					if (sections.length !== 0) {
						this.insightDataList.push(new InsightData(id, kind, sections.length, sections));
						return fs.outputJson(PATH_TO_ROOT_DATA,  this.insightDataList)
							.then(() =>  Promise.resolve(this.getAddedIds()))
							.catch(() =>  Promise.reject(new InsightError("There was an error writing to disk")));
					}
					return Promise.reject(new InsightError("No sections were found in the inputted file"));
				} catch (Exception) {
					return Promise.reject("An error occurred while writing to to disk");
				}
			})
			.catch((err) => {
				return Promise.reject(new InsightError(err));
			});
	}
	/**
	 * Checks that the InsightKind is one that is currently supported
	 * REQUIRES: kind be an enum from InsightDatasetKind
	 * MODIFIES: None
	 * EFFECTS: Returns a Promise that resolves with void if it's supported, otherwise returns
	 * a Promise that rejects with an InsightError
	 **/
	public isValidInsightKind(kind: InsightDatasetKind): Promise<void> {
		if (kind === InsightDatasetKind.Sections) {
			return Promise.resolve();
		}
		return Promise.reject(new InsightError("There is currently no support for that kind of dataset."));
	}
	/**
	 * Gets the IDs of the datasets that are currently added to this.
	 * REQUIRES: None
	 * MODIFIES: None
	 * EFFECTS: Returns an array of the IDs that are currently added to this
	 **/
	public getAddedIds(): string[] {
		let addedIDs = [];
		for (const dataset of this.insightDataList) {
			addedIDs.push(dataset.metaData.id);
		}
		return addedIDs;
	}
	/**
	 * Checks that an ID is valid. An ID is invalid if it contains an underscore, if it's blank, or if it is composed
	 * entirely of whitespace characters.
	 * MODIFIES: None
	 * EFFECTS: Returns an array of the IDs that are currently added to this
	 **/
	public isValidId(id: string): Promise<string> {
		if (id.trim().length === 0) { // blank id or id is all whitespace
			return Promise.reject(new InsightError("The ID must contain non white space characters"));
		} else if (id.includes("_")) { // id has an underscore
			return Promise.reject(new InsightError('The ID can\'t contain any underscores "_"'));
		}
		return Promise.resolve("");
	}
	/**
	 * Returns a boolean indicating whether the inputted id is one that corresponds to a dataset that's already
	 * been added.
	 * REQUIRES: None
	 * MODIFIES: None
	 * EFFECTS: Returns true if the id exists and false otherwise.
	 **/
	public isIdExist(id: string): boolean {
		for (const dataset of this.insightDataList) {
			if (dataset.metaData.id === id) {
				return true;
			}
		}
		return false;
	}

	public removeDataset(id: string): Promise<string> {
		return this.isValidId(id)
			.then(() => {
				if (this.isIdExist(id)) {
					return Promise.resolve(id);
				}
				return Promise.reject(new NotFoundError("Can't remove the ID because it's not added"));
			})
			.then(() => {
				for (const index in this.insightDataList) {
					if (this.insightDataList[index].metaData.id === id) {
						this.insightDataList.splice(Number(index), 1);
						return fs
							.outputJson(PATH_TO_ROOT_DATA, this.insightDataList)
							.then(() => Promise.resolve(id))
							.catch(() => {
								return Promise.reject(new InsightError("Error updating disk to reflect removal"));
							});
					}
				}
				return Promise.resolve(id);
			})
			.catch((err) => {
				return Promise.reject(err);
			});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		let addedDatasets: InsightDataset[] = [];
		for (const insightData of this.insightDataList) {
			addedDatasets.push(insightData.metaData);
		}
		return Promise.resolve(addedDatasets);
	}
	public performQuery(inputQuery: unknown): Promise<InsightResult[]> {
		let query = inputQuery as any; //	try any also
		//	let testin: InsightResult[] = [new InsightResult()]
		this.queryEng = new QueryEngine(this.insightDataList, inputQuery);
		if (this.queryEng.isValidQuery()) {
			console.log("yep its valid");
			 return this.queryEng.doQuery(query);
		}
		console.log("yep its nah its invalid");
		return Promise.reject(new InsightError("Invalid query semantics/syntax"));
	}
}

// let facade = new InsightFacade();
// const validDataset = fs.readFileSync(PATH_TO_ARCHIVES + "valid_section.zip").toString("base64");
// facade.listDatasets()
// 	.then((results) => console.log(results))
// 	.then(() => facade.addDataset("randomid", validDataset, InsightDatasetKind.Sections));

// facade.addDataset("sections", validDataset, InsightDatasetKind.Sections)
// 	.then(() => facade.listDatasets())
// 	.then((addedDatasets) =>{
// 		// console.log(facade.insightDataList);
// 		console.log("hey");
// 		console.log(addedDatasets);
// 		// return facade.readLocal();
// 		return Promise.resolve();
// 	})
// 	.then(() => {
// 		return facade.performQuery({
// 			WHERE: {
// 				AND: [
// 					{
// 						AND: []
// 					},
// 					{
// 						LT: {
// 							sections_avg: 95
// 						}
// 					}
// 				]
// 			},
// 			OPTIONS: {
// 				COLUMNS: [
// 					"sections_dept",
// 					"sections_id",
// 					"sections_avg"
// 				],
// 				ORDER: "sections_avg"
// 			}
// 		});
// 	})
// 	.then((results) => console.log(results))
// 	.catch((err) => console.log(err));

