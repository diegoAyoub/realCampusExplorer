import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightResult,
	InsightDatasetSection,
	InsightData
} from "./IInsightFacade";
import * as fs from "fs-extra";
import * as zip from "jszip";

const pathToArchives = "../../test/resources/archives/";
const pathToRootData = "../../../../data/";
const data = "pair.zip";
const validSectionKeys = ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public insightData: InsightData[];
	public sections: InsightDatasetSection[] = [];
	constructor() {
		console.log("InsightFacadeImpl::init()");
		this.insightData = [];
		this.sections = [];
		const dataset = fs.readFileSync(pathToArchives + data).toString("base64");
		this.addDataset("sections", dataset, InsightDatasetKind.Sections)
			.then(() => {
				console.log("Great everything worked1");
				return this.addDataset("sections", dataset, InsightDatasetKind.Sections);
			})
			.then(() => console.log("wtf it shouldn't have gotten here"))
			.catch(() => console.log("good it rejected "));
		// console.log("done");
	}
	// @todo: Go through spec for what needs to be done once a valid section is found (special cases)
	// make it so that we can read from a file and parse it into InsightData[]
	// make promise rejections have good error msgs
	// POTENTIAL CHANGE: INITIALIZE AN ELEMENT OF INSIGHTDATA[] RIGHT AWAY WITH AN ID AND INSIGHTDATASETKIND SO THAT
	// WHEN OTHER ASYNCRONOUS CALLS ARE MADE WITH THE SAME ID THEY'D SEE IT AND RESOLVE WITH REJECTED PROMISE.
	// CURRENTLY CONCURRENT CALLS ARE PASSING THE !THIS.ISVALIDID CHECK
	// ADDRESS THE GIT BOT IMPLICIT ANY: WHATEVER MSG
	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let asyncJobs: any[] = [];
		if(!this.isValidID(id)) {
			return Promise.reject("this id is invalid");
		}

		return zip.loadAsync(content, {base64: true})
			.then((parsedData) => Promise.resolve(parsedData))
			.then((base64Data) => {
				base64Data.folder("courses")?.forEach((relativePath, file) => {
					asyncJobs.push(file.async("text"));
				});
			})
			.then(() => {
				return Promise.all(asyncJobs)
					.then((classes) => this.parseClasses(classes));
			})
			.then(() => {
				try {
					let incomingInsightData = new InsightData(id, kind, this.sections.length, this.sections); // creates insightdataa
					this.insightData.push(incomingInsightData);
					fs.outputJsonSync(pathToRootData + id,  incomingInsightData.data);
					return Promise.resolve(this.getAddedIDs());
				} catch(Exception) {
					return Promise.reject("An error occurred while writing to to disk");
				}
			})
			.catch(() => Promise.reject(["rejected"]));
	}
	public getAddedIDs(): string[] {
		let addedIDs = [];
		for(const dataset of this.insightData) {
			addedIDs.push(dataset.id);
		}
		return addedIDs;
	}
	public isValidID(id: string): boolean {
		if (id.length === 0) { // blank id
			return false;
		}
		for(const dataset of this.insightData) { // id already exists
			if (dataset.id === id) {
				return false;
			}
		}
		return !id.includes("_");  // contains an underscore
	}
	public isValidSection(section: any): boolean {
		let isValid = true;
		for(const requiredKey of validSectionKeys) {
			isValid = isValid &&
				Object.prototype.hasOwnProperty.call(section,requiredKey);
		}
		return isValid;
	}
	public parseClasses(classes: any): void {
		for(const AClass of classes) {
			let classObject = JSON.parse(AClass);
			if(classObject.result.length !== 0) { // for the ones with results key that maps to empty
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
		}
	}

	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}


}

new InsightFacade();

