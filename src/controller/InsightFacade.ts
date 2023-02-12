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
// import queryEngine from "./queryEngine";
import {QueryEngine} from "./QueryEngine";
import * as fs from "fs-extra";
import * as zip from "jszip";
import JSZip from "jszip";
const PATH_TO_ARCHIVES = "../../test/resources/archives/";
// const PATH_TO_ROOT_DATA = "../../../data/data.json"; // USE THIS WHEN RUNNING WITH MAIN
const DATA = "pair.zip";
const PATH_TO_ROOT_DATA = "./data/data.json"; // USE THIS WHEN RUNNING MOCHA
const REQUIRED_SECTION_KEYS = ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];
const COMPARATORLOGIC = ["AND", "OR", "LT", "GT", "EQ", "IS", "NOT"];
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 */
export default class InsightFacade implements IInsightFacade {
	public insightDataList: InsightData[] = [];
	public sections: InsightDatasetSection[] = []; // move this to local and have parseClasses return it instead?
	private queryEng: any;
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	// ask about asyncronony in the proj seems like most of the stuff i'm doing is syncronous and test was failing cuz it took too long.
	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let asyncJobs: any[] = [];
		this.sections = [];
		return this.isValidInsightKind(kind) //
			.then(() => this.isValidId(id))
			.then(() => (this.isIdExist(id) ? Promise.reject("The ID already exists") : Promise.resolve()))
			.then(() => zip.loadAsync(content, {base64: true}))
			.then((base64Data: JSZip) => {
				base64Data.folder("courses")?.forEach((relativePath, file) => {
					asyncJobs.push(file.async("string"));
				});
			})
			.then(() => Promise.all(asyncJobs).then((classes) => this.parseClasses(classes)))
			.then(() => {
				try {
					if (this.sections.length !== 0) {
						this.insightDataList.push(new InsightData(id, kind, this.sections.length, this.sections));
						return fs
							.outputJson(PATH_TO_ROOT_DATA, this.insightDataList)
							.then(() => Promise.resolve(this.getAddedIds()))
							.catch(() => Promise.reject(new InsightError("There was an error writing to disk")));
					}
					return Promise.reject(new InsightError("No sections were found in the inputted file"));
				} catch (Exception) {
					// console.log(Exception);
					return Promise.reject("An error occurred while writing to to disk");
				}
			})
			.catch((err) => {
				// console.log(err);
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
		if (id.trim().length === 0) {
			// blank id or id is all whitespace
			return Promise.reject(new InsightError("The ID must contain non white space characters"));
		} else if (id.includes("_")) {
			// id has an underscore
			return Promise.reject(new InsightError('The ID can\'t contain any underscores "_"'));
		}
		return Promise.resolve("");
	}
	/**
	 * Verifies that a section object is valid. A valid section is one that has all the required keys: ( "id",
	 * "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit")
	 * REQUIRES: None
	 * MODIFIES: None
	 * EFFECTS: Returns true if the object is valid and false otherwise.
	 **/
	public isValidSection(section: any): boolean {
		let isValid = true;
		for (const requiredKey of REQUIRED_SECTION_KEYS) {
			isValid = isValid && Object.prototype.hasOwnProperty.call(section, requiredKey);
		}
		return isValid;
	}
	/**
	 * Read a file that contains a stringified version of an object and parses it into an InsightDatasetSection
	 * REQUIRES: the string to be a valid object that contains a "results" key
	 * MODIFIES: this.section (maybe change this later)
	 * EFFECTS: Returns a promise that rejects if an error is encountered, otherwise returns a resolved promise.
	 * Valid sections found in the object under the results key are added to this.section.
	 **/
	public parseClasses(classes: any): Promise<void> {
		try {
			for (const AClass of classes) {
				try {
					let classObject = JSON.parse(AClass);
					if (classObject.result.length !== 0) {
						// for the ones with results key that maps to empty
						// Promise.reject(new InsightError("There are no valid sections"));
						for (const section of classObject.result) {
							if (this.isValidSection(section)) {
								this.sections.push(
									new InsightDatasetSection(
										// id,
										section.id,
										section.Course,
										section.Title,
										section.Professor,
										section.Subject,
										section.Year,
										section.Avg,
										section.Pass,
										section.Fail,
										section.Audit
									)
								);
							}
						}
					}
				} catch (Error) {
					// sometimes classes arg has an element that is filled with null characters mostly found in
					// cases where validClass or validSection i.e. custom file I made with one section or one class
				}
			}
			return Promise.resolve();
		} catch (Exception) {
			return Promise.reject(new InsightError("There was a problem parsing the json"));
		}
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
	public performQuery(query: unknown): Promise<InsightResult[]> {
		let inputQuery = query as any; //	try any also
		this.queryEng = new QueryEngine(this.insightDataList, inputQuery);
		if (this.queryEng.validateQuery()) {
			this.handleWhere(inputQuery);
		} else {
			//	query is not valid
			return Promise.reject(new InsightError("Invalid query semantics/syntax"));
		}

		return Promise.reject(new InsightError("Invalid query semantics/syntax"));
	}

	/*	handle where block from query*/
	private handleWhere(whereBlock: any): Promise<string> {
		return Promise.resolve("YER");
	}
	public findDataset(id: string): Promise<InsightData> {
		for (const dataset of this.insightDataList) {
			if (dataset.metaData.id === id) {
				let currentDataset: InsightData = dataset;
				return Promise.resolve(currentDataset);
			}
		}
		return Promise.reject(new InsightError("Matching ID not found"));
	}
	private filter(dataID: string, conditionCol: string, operator: string, dataset: InsightData): Promise<string> {
		let sections = dataset["data"];

		return Promise.resolve("success");
	}
	/*	handle options block from query*/
	private handleOptions(options: JSON): string {
		return "";
	}
	/**
	 * Reads from disk a json file of InsightData objects
	 * REQUIRES: memory to have persisted data
	 * MODIFIES: this
	 * EFFECTS: returns a Promise that rejects with an error if an error is encountered, otherwise returns a resolved
	 * promise.
	 **/
	public readLocal(): Promise<void> {
		return fs
			.readJson(PATH_TO_ROOT_DATA)
			.then((fileContent: any) => {
				let insightDataSections: InsightDatasetSection[];
				for (const insightData of fileContent) {
					insightDataSections = [];
					for (const persistedSection of insightData.data) {
						// console.log(content.data);
						insightDataSections.push(
							new InsightDatasetSection(
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
							)
						);
					}
					this.insightDataList.push(
						new InsightData(
							insightData.metaData.id,
							insightData.metaData.kind,
							insightData.metaData.numRows,
							insightDataSections
						)
					);
				}
				return Promise.resolve();
			})
			.catch((err: Error) => Promise.reject(new Error("There was a problem reading local")));
	}
}
