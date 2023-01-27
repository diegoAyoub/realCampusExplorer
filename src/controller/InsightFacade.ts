import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightResult} from "./IInsightFacade";
import * as fs from "fs-extra";
import * as zip from "jszip";

const pathToArchives = "../../test/resources/archives/";
const data = "pair.zip";
const validSectionKeys = ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];


/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
		const dataset = fs.readFileSync(pathToArchives + data).toString("base64");
		this.addDataset("sections", dataset, InsightDatasetKind.Sections)
			.then(() => console.log("Great everything worked"))
			.catch(() => console.log("Rejecting AddDataset because returning \"Not Implemented\""));
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let sections: any[] = [];
		zip.loadAsync(content, {base64: true})
			.then((parsedData) => {
				parsedData.folder("courses")?.forEach((relativePath, file) => {
					file.async("text")
						.then((fileContent) => {
							let aClass = JSON.parse(fileContent);
							console.log(aClass);
						})
						.catch(() => console.log("error"));
				}); // read the async cookbook maybe use Promise.all() or something and once its good then I can use everythin in the promise array or osmething like that ???
			})
			// .then((jsonData) => console.log(jsonData))
			.catch((err) => console.log("fatal error occurred!"));
		// console.log(sections);
		return Promise.reject("Not implemented.");
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

let x = new InsightFacade();

