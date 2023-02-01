import {
	IInsightFacade,
	InsightData,
	InsightDataset,
	InsightDatasetKind,
	InsightDatasetSection,
	InsightError,
	InsightResult, NotFoundError
} from "./IInsightFacade";
import * as fs from "fs-extra";
import * as zip from "jszip";

// const pathToArchives = "../../test/resources/archives/";
// const pathToRootData = "../../../data/"; // CHANGE BACK WHEN RUNNING WITH MAIN
const pathToRootData = "./data/data.json"; // USE THIS WHEN RUNNING MOCHA
// const data = "pair.zip";
const validSectionKeys = ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public insightDataList: InsightData[] = [];
	public sections: InsightDatasetSection[] = [];
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}
	// @todo: Go through spec for what needs to be done once a valid section is found (special cases)
	// make it so that we can read from a file and parse it into InsightData[]
	// ADDRESS THE GIT BOT IMPLICIT ANY: WHATEVER MSG
	// MAKE IT WORK WITH LOCAL TESTS.
	// RELATIVE PATH WITH DIST FOLDER
	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let asyncJobs: any[] = [];
		this.sections = [];

		return this.isValidInsightKind(kind)
			.then(() => this.isValidID(id))
			.then(() => this.isIDExist(id) ? Promise.reject("The id already exists") : Promise.resolve())
			.then(() =>  zip.loadAsync(content, {base64: true}))
			.then((base64Data) => {
				base64Data.folder("courses")?.forEach((relativePath, file) => {
					// console.log(file);
					asyncJobs.push(file.async("string"));
				});
			})
			.then(() => Promise.all(asyncJobs).then((classes) => this.parseClasses(classes)))
			.then(() => {
				try {
					if(this.sections.length !== 0) {
						this.insightDataList.push(new InsightData(id, kind, this.sections.length, this.sections));
						return fs.outputJson(pathToRootData,  this.insightDataList)
							.then(() =>  Promise.resolve(this.getAddedIDs()))
							.catch(() =>  Promise.reject(new InsightError("There was an error writing to disk")));
					}
					return Promise.reject(new InsightError("No sections were found in the inputted file"));
				} catch(Exception) {
					console.log(Exception);
					return Promise.reject("An error occurred while writing to to disk");
				}
			})
			.catch((err) => {
				// console.log(err);
				return Promise.reject(new InsightError(err));
			});
	}
	public isValidInsightKind(kind: InsightDatasetKind): Promise<void> {
		if(kind === InsightDatasetKind.Sections) {
			return Promise.resolve();
		}
		return Promise.reject(new InsightError("There is currently no support for that kind of dataset."));
	}
	public getAddedIDs(): string[] {
		let addedIDs = [];
		for(const dataset of this.insightDataList) {
			addedIDs.push(dataset.metaData.id);
		}
		return addedIDs;
	}
	public isValidID(id: string): Promise<string> {
		if (id.trim().length === 0) { // blank id or id is all whitespace
			return Promise.reject(new InsightError("The ID must contain non white space characters"));
		} else if(id.includes("_")) { // id has an underscore
			return Promise.reject(new InsightError("The ID can't contain any underscores \"_\""));
		}
		return Promise.resolve("");
	}
	public isValidSection(section: any): boolean {
		let isValid = true;
		for(const requiredKey of validSectionKeys) {
			isValid = isValid &&
				Object.prototype.hasOwnProperty.call(section,requiredKey);
		}
		return isValid;
	}
	public parseClasses(classes: any): Promise<void> {
		try {
			for(const AClass of classes) {
				try {
					let classObject = JSON.parse(AClass);
					if(classObject.result.length !== 0) { // for the ones with results key that maps to empty
						// Promise.reject(new InsightError("There are no valid sections"));
						for(const section of classObject.result) {
							if(this.isValidSection(section)) {
								this.sections.push(new InsightDatasetSection(
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
								));
							}
						}
					}
				} catch(Error) {
					// sometimes classes arg has an element that is filled with null characters mostly found in
					// cases where validClass or validSection i.e. custom file I made with one section or one class
				}
			}
			return Promise.resolve();
		} catch (Exception) {
			return Promise.reject(new InsightError("There was a problem parsing the json"));
		}
	}
	public isIDExist(id: string) {
		for(const dataset of this.insightDataList) { // id already exists
			if (dataset.metaData.id === id) {
				return true;
			}
		}
		return false;
	}

	public removeDataset(id: string): Promise<string> {
		return this.isValidID(id)
			.then(() =>  {
				if(this.isIDExist(id)) {
					return Promise.resolve(id);
				}
				return Promise.reject(new NotFoundError("Can't remove the ID because it's not added"));
			})
			.then(() => {
				for(const index in this.insightDataList) {
					if(this.insightDataList[index].metaData.id === id) {
						this.insightDataList.splice(Number(index), 1);
						return fs.outputJson(pathToRootData,  this.insightDataList)
							.then(() =>  Promise.resolve(id))
							.catch(() =>  {
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
		for(const insightData of this.insightDataList) {
			addedDatasets.push(insightData.metaData);
		}
		return Promise.resolve(addedDatasets);
	}
	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}


}

// let facade = new InsightFacade();
// const validDataset = fs.readFileSync(pathToArchives + data).toString("base64");
// facade.addDataset("dataset", validDataset, InsightDatasetKind.Sections)
// 	.then(() => facade.addDataset("class", validDataset, InsightDatasetKind.Sections))
// 	.catch((err) => console.log("error"));

