/*
 * This is the primary high-level API for the project. In this folder there should be:
 * A class called InsightFacade, this should be in a file called InsightFacade.ts.
 * You should not change this interface at all or the test suite will not work.
 */

export enum InsightDatasetKind {
	Sections = "sections",
	Rooms = "rooms",
}

// id: number,
// 	course: string | number,
// 	title: string,
// 	professor: string,
// 	subject: string,
// 	year: string | number,
// 	avg: string | number,
// 	pass: string | number,
// 	fail: string | number,
export class InsightData {
	public metaData: InsightDataset;
	public data: any[] | null; // @todo: maybe make it any[] so that can use prefixjson or nah?
	constructor(id: string, kind: InsightDatasetKind, numRows: number, data?: any[]) {
		this.metaData = {} as InsightDataset;
		this.metaData.id = id;
		this.metaData.kind = kind;
		this.metaData.numRows = numRows;
		if(typeof data !== "undefined") {
			this.data = data;
		} else {
			this.data = null;
		}
	}
	public addNumRows(numRows: number) {
		this.metaData.numRows = numRows;
	};
	public addDataset(dataset: InsightDatasetSection[]) {
		this.data = dataset;
	}
}
export class InsightDatasetSection {
	// public datasetID: string;
	public uuid: string;
	public id: string;
	public title: string;
	public instructor: string;
	public dept: string;
	public year: string;
	public avg: string;
	public pass: string;
	public fail: string;
	public audit: string;
	constructor(
		// datasetID: string,
		id: string,
		course: string,
		title: string,
		professor: string,
		subject: string,
		year: string,
		avg: string,
		pass: string,
		fail: string,
		audit: string) {
		// this.datasetID = datasetID;
		this.uuid = id;
		this.id = course;
		this.title = title;
		this.instructor = professor;
		this.dept = subject;
		this.year = year;
		this.avg = avg;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;

	}

	public prefixJSON(datasetID: string): any {
		let keyUUID = datasetID + "_" + "uuid";
		let keyCourse = datasetID + "_" + "id";
		let keyTitle = datasetID + "_" + "title";
		let keyProfessor = datasetID + "_" + "instructor";
		let keySubject = datasetID + "_" + "dept";
		let keyYear = datasetID + "_" + "year";
		let keyAvg = datasetID + "_" + "avg";
		let keyPass = datasetID + "_" + "pass";
		let keyFail = datasetID + "_" + "fail";
		let keyAudit = datasetID + "_" + "audit";

		return {
			[keyUUID]: this.uuid,
			[keyCourse]: this.id,
			[keyTitle]: this.title,
			[keyProfessor]: this.instructor,
			[keySubject]: this.dept,
			[keyYear]: this.year,
			[keyAvg]: this.avg,
			[keyPass]: this.pass,
			[keyFail]: this.fail,
			[keyAudit]: this.audit,
		};
	}
}

export interface InsightDataset {
	id: string;
	kind: InsightDatasetKind;
	numRows: number;
}

export interface InsightResult {
	[key: string]: string | number;
}

export class InsightError extends Error {
	constructor(message?: string) {
		super(message);
		Error.captureStackTrace(this, InsightError);
	}
}

export class NotFoundError extends Error {
	constructor(message?: string) {
		super(message);
		Error.captureStackTrace(this, NotFoundError);
	}
}

export class ResultTooLargeError extends Error {
	constructor(message?: string) {
		super(message);
		Error.captureStackTrace(this, ResultTooLargeError);
	}
}

export interface IInsightFacade {
	/**
	 * Add a dataset to insightUBC.
	 *
	 * @param id  The id of the dataset being added. Follows the format /^[^_]+$/
	 * @param content  The base64 content of the dataset. This content should be in the form of a serialized zip file.
	 * @param kind  The kind of the dataset
	 *
	 * @return Promise <string[]>
	 *
	 * The promise should fulfill on a successful add, reject for any failures.
	 * The promise should fulfill with a string array,
	 * containing the ids of all currently added datasets upon a successful add.
	 * The promise should reject with an InsightError describing the error.
	 *
	 * An id is invalid if it contains an underscore, or is only whitespace characters.
	 * If id is the same as the id of an already added dataset, the dataset should be rejected and not saved.
	 *
	 * After receiving the dataset, it should be processed into a data structure of
	 * your design. The processed data structure should be persisted to disk; your
	 * system should be able to load this persisted value into memory for answering
	 * queries.
	 *
	 * Ultimately, a dataset must be added or loaded from disk before queries can
	 * be successfully answered.
	 */
	addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]>;

	/**
	 * Remove a dataset from insightUBC.
	 *
	 * @param id  The id of the dataset to remove. Follows the format /^[^_]+$/
	 *
	 * @return Promise <string>
	 *
	 * The promise should fulfill upon a successful removal, reject on any error.
	 * Attempting to remove a dataset that hasn't been added yet counts as an error.
	 *
	 * An id is invalid if it contains an underscore, or is only whitespace characters.
	 *
	 * The promise should fulfill the id of the dataset that was removed.
	 * The promise should reject with a NotFoundError (if a valid id was not yet added)
	 * or an InsightError (invalid id or any other source of failure) describing the error.
	 *
	 * This will delete both disk and memory caches for the dataset for the id meaning
	 * that subsequent queries for that id should fail unless a new addDataset happens first.
	 */
	removeDataset(id: string): Promise<string>;

	/**
	 * Perform a query on insightUBC.
	 *
	 * @param query  The query to be performed.
	 *
	 * If a query is incorrectly formatted, references a dataset not added (in memory or on disk),
	 * or references multiple datasets, it should be rejected.
	 *
	 * @return Promise <InsightResult[]>
	 *
	 * The promise should fulfill with an array of results.
	 * The promise should reject with a ResultTooLargeError (if the query returns too many results)
	 * or an InsightError (for any other source of failure) describing the error.
	 */
	performQuery(query: unknown): Promise<InsightResult[]>;

	/**
	 * List all currently added datasets, their types, and number of rows.
	 *
	 * @return Promise <InsightDataset[]>
	 * The promise should fulfill an array of currently added InsightDatasets, and will only fulfill.
	 */
	listDatasets(): Promise<InsightDataset[]>;
}
