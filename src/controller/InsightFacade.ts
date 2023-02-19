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
import {readLocal, writeLocal} from "./DiskUtil";
let objectConstructor = ({}).constructor;

export const PATH_TO_ARCHIVES = "../../test/resources/archives/";
// const DATA = "pair.zip";

// USE THIS WHEN RUNNING WITH MAIN
// export const PATH_TO_ROOT_DATA = "../../../data/data.JSON";
// export const PATH_TO_ROOT_DATA_FOLDER = "../../../data";

// USE THIS WHEN RUNNING MOCHA
export const PATH_TO_ROOT_DATA = "./data/data.json";
export const PATH_TO_ROOT_DATA_FOLDER = "./data";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 */
export default class InsightFacade implements IInsightFacade {
	public insightDataList: InsightData[] = [];
	private queryEng: QueryEngine | null = null;
	constructor() {
		if(fs.existsSync(PATH_TO_ROOT_DATA) && fs.existsSync(PATH_TO_ROOT_DATA)) {
			readLocal(PATH_TO_ROOT_DATA, this.insightDataList);
		} else {
			fs.ensureDirSync(PATH_TO_ROOT_DATA_FOLDER);
		}
	}
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let asyncJobs: any[] = [];
		let dataset: InsightDatasetSection[] = [];
		try {
			if (this.isValidInsightKind(kind) && this.isValidId(id) && !this.isIdExist(id)) {
				let base64Data: JSZip = await zip.loadAsync(content, {base64: true});
				base64Data.folder("courses")?.forEach((relativePath, file) => {
					asyncJobs.push(file.async("string"));
				});
				await Promise.all(asyncJobs).then((classes) => parseClasses(classes, dataset));
				if(dataset.length !== 0) {
					this.insightDataList.push(new InsightData(id, kind, dataset.length, dataset));
					writeLocal(PATH_TO_ROOT_DATA, this.insightDataList);
					return Promise.resolve(this.getAddedIds());
				}
			}
			return Promise.reject(new InsightError("No sections were found in the inputted file"));
		} catch (error: unknown) {
			return Promise.reject(new InsightError((error as Error).message));
		}

	}


	/**
	 * Checks that the InsightKind is one that is currently supported
	 * REQUIRES: kind be an enum from InsightDatasetKind
	 * MODIFIES: None
	 * EFFECTS: Returns a Promise that resolves with void if it's supported, otherwise returns
	 * a Promise that rejects with an InsightError
	 **/
	public isValidInsightKind(kind: InsightDatasetKind): boolean {
		if (kind === InsightDatasetKind.Sections) {
			return true;
		}
		throw new InsightError("The InsightDatasetKind is not supported");
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
	public isValidId(id: string): boolean {
		if (id.trim().length === 0) { // blank id or id is all whitespace
			throw new InsightError("The inputted ID is invalid because it is composed only of whitespace.");
		} else if (id.includes("_")) { // id has an underscore
			throw new InsightError("The inputted ID is invalid because it contains an underscore.");
		}
		return true;
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
		try {
			if(this.isValidId(id) && this.isIdExist(id)) {
				for (const index in this.insightDataList) {
					if (this.insightDataList[index].metaData.id === id) {
						this.insightDataList.splice(Number(index), 1);
						 writeLocal(PATH_TO_ROOT_DATA, this.insightDataList);
						 return Promise.resolve(id);
					}
				}
			}
			return Promise.reject(new NotFoundError("dataset with the id" + id  + " doesn't exist"));
		} catch (error: unknown) {
			return Promise.reject(new InsightError((error as Error).message));
		}
	}

	public listDatasets(): Promise<InsightDataset[]> {
		let addedDatasets: InsightDataset[] = [];
		for (const insightData of this.insightDataList) {
			addedDatasets.push(insightData.metaData);
		}
		return Promise.resolve(addedDatasets);
	}
	public async performQuery(inputQuery: unknown): Promise<InsightResult[]> {
		if (inputQuery === null || inputQuery === undefined) {
			return Promise.reject(new InsightError("The query doesn't exist"));
		} else if (inputQuery.constructor === objectConstructor) {
			let query = inputQuery as any; //	try any also
			this.queryEng = new QueryEngine(this.insightDataList, query);
			if(this.queryEng.isValidQuery()) {
				return this.queryEng.doQuery(query);
			}
		}
		return Promise.reject(new InsightError("Invalid query semantics/syntax"));
	}
}
// add performquery

// let facade = new InsightFacade();
// const validSection = fs.readFileSync(PATH_TO_ARCHIVES + "pair.zip").toString("base64");
// const validClass = fs.readFileSync(PATH_TO_ARCHIVES + "CPSC418.zip").toString("base64");
// facade.addDataset("sections", validSection, InsightDatasetKind.Sections)
// 	.then(() => facade.listDatasets())
// 	.then((addedDatasets) => {
// 		// console.log("THEY'RE BETTER BE SOMETHING THERE");
// 		// console.log(facade.insightDataList);
// 		return Promise.resolve();
// 	})
// 	.then(() => facade.performQuery({WHERE: {
//
// 	}}))
// 	.catch((err) => console.log(err));

// facade.listDatasets()
// 	.then((results) => console.log(results))
// 	.then((results) => console.log(results))
// 	.then(() => facade.listDatasets())
// 	.then((results) => console.log(results))
// 	.then(() => facade.performQuery(null))
// 	.catch((results) => console.log(results))
;
