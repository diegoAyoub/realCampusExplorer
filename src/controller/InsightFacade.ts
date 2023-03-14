import {
	IInsightFacade,
	InsightData,
	InsightDataset,
	InsightDatasetKind, InsightDatasetRoom,
	InsightDatasetSection,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";
import {QueryEngine} from "./QueryEngine";
import * as fs from "fs-extra";
import {handleReadingRooms, handleReadingSection} from "./ParseUtil";
import {readLocal, writeLocal} from "./DiskUtil";

let objectConstructor = ({}).constructor;


const DATA = "pair.zip";

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
		let dataset: InsightDatasetSection[] | InsightDatasetRoom[] = [];
		try {
			if(this.isIdExist(id)) {
				throw new InsightError("The ID already exists");
			}
			if (kind === InsightDatasetKind.Sections && this.isValidId(id)) {
				await handleReadingSection(content, dataset as InsightDatasetSection[]);
			} else if(kind === InsightDatasetKind.Rooms && this.isValidId(id)) {
				await handleReadingRooms(content, dataset as InsightDatasetRoom[]);
			}
			if(dataset.length) { // can be problematic if dataset already has 1 dataset added and a subsequent add crashes (we'd want to reject but it wouldn't)
				this.insightDataList.push(new InsightData(id, kind, dataset.length, dataset));
				writeLocal(PATH_TO_ROOT_DATA, this.insightDataList);
				return Promise.resolve(this.getAddedIds());
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
		if (kind === InsightDatasetKind.Sections || kind === InsightDatasetKind.Rooms) {
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

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		try {
			if (query === null || query === undefined) {
				return Promise.reject(new InsightError("The query doesn't exist"));
			} else if (query.constructor === objectConstructor) {
				this.queryEng = new QueryEngine(this.insightDataList, query);
				if(this.queryEng.isValidQuery()) {
					return this.queryEng.doQuery(query);
				}
			}
			return Promise.reject(new InsightError("Invalid query syntax"));
		} catch (error) {
			return Promise.reject(new InsightError((error as Error).message));
		}
	}
}
function runIt() {
	let facade = new InsightFacade();

	facade.listDatasets()
		.then((addedDatasets) => {
			console.log(addedDatasets);
			return Promise.resolve();
		})
		.then(() => facade.performQuery(query))
		.catch((err) => console.log(err));
}

// USE THIS WHEN RUNNING MOCHA
export const PATH_TO_ROOT_DATA = "./data/data.json";
export const PATH_TO_ROOT_DATA_FOLDER = "./data";

/*
	~~~~~~~ UNCOMMENT STUFF UNDER HERE FOR MAIN STUFF ~~~~~~~~~~~~
 */

// export const PATH_TO_ROOT_DATA = "../../../data/data.JSON";
// export const PATH_TO_ROOT_DATA_FOLDER = "../../../data";
// export const PATH_TO_ARCHIVES = "../../test/resources/archives/";
// runIt();
let query = {
	WHERE: {},
	OPTIONS: {
		COLUMNS: [
			"rooms_shortname",
			"maxSeats"
		],
		ORDER: {
			dir: "DOWN",
			keys: [
				"maxSeats"
			]
		}
	},
	TRANSFORMATIONS: {
		GROUP: [
			"rooms_shortname"
		],
		APPLY: [
			{
				maxSeats: {
					MAX: "rooms_seats"
				}
			}
		]
	}
};
