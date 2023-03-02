import {InsightDataset, InsightDatasetRoom, InsightDatasetSection, InsightError, InsightResult} from "./IInsightFacade";
import JSZip from "jszip";
import * as zip from "jszip";
import {parse, defaultTreeAdapter, DefaultTreeAdapterMap} from "parse5";
import * as fs from "fs";
import {ChildNode, Document, Element, ParentNode, TextNode} from "parse5/dist/tree-adapters/default";
import {Attribute} from "parse5/dist/common/token";
import {
	ANCHOR_VALUES,
	CLASS_ADDRESS,
	CLASS_LINK,
	CLASS_SHORTNAME,
	TD_VALUES,
	CLASS_FULLNAME
} from "./Constants";
import base = Mocha.reporters.base;
const REQUIRED_SECTION_KEYS = ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];
/**
 * Reads a stringified version of an object (i.e. "{"avg": 50}") and converts it to an InsightDatasetSection
 * REQUIRES: the string to be a valid object that contains a "results" key
 * MODIFIES: this.section (maybe change this later)
 * EFFECTS: Returns a promise that rejects if an error is encountered, otherwise returns a resolved promise.
 * Valid sections found in the object under the results key are added to this.section.
 **/
export function parseClasses(classes: any, sections: InsightDatasetSection[]): Promise<void> {
	try {
		for(const AClass of classes) {
			try {
				let classObject = JSON.parse(AClass);
				if(classObject.result.length !== 0) {
					for(const section of classObject.result) {
						if(isValidSection(section)) {
							let year = section.Section === "overall" ? 1900 : parseInt(section.Year, 10);
							sections.push(new InsightDatasetSection(
								section.id.toString(),
								section.Course,
								section.Title,
								section.Professor,
								section.Subject,
								year,
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

/**
 * Verifies that a section object is valid. A valid section is one that has all the required keys: ( "id",
 * "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit")
 * REQUIRES: None
 * MODIFIES: None
 * EFFECTS: Returns true if the object is valid and false otherwise.
 **/
export function isValidSection(section: any): boolean {
	let isValid = true;
	for(const requiredKey of REQUIRED_SECTION_KEYS) {
		isValid = isValid && Object.prototype.hasOwnProperty.call(section, requiredKey);
	}
	return isValid;
}

export async function handleReadingSection(content: string, dataset: InsightDatasetSection[]): Promise<void> {
	let asyncJobs: any[] = [];
	let base64Data: JSZip = await zip.loadAsync(content, {base64: true});
	base64Data.folder("courses")?.forEach((relativePath, file) => {
		asyncJobs.push(file.async("string"));
	});
	return Promise.all(asyncJobs).then((classes) => parseClasses(classes, dataset));
}

export async function handleReadingRooms(content: string, dataset: InsightDatasetSection[]): Promise<void>{
	try {
		// console.log("hey were here!");
		let validBuildingsToParseList: string[] = [];
		let asyncJobs: any[] = [];
		let base64Data: JSZip = await zip.loadAsync(content, {base64: true});
		let htmlContent = await base64Data.file("index.htm")?.async("string");
		let document: Document = parse(htmlContent as string);
		// let pathToBuildingFiles: Set<InsightDatasetRoom> = new Set<InsightDatasetRoom>();
		let buildingData: Set<string[]> = new Set<string[]>();
		// traverseDocumentForBuildings(defaultTreeAdapter.getChildNodes(document), buildingData, base64Data);
		console.log(buildingData);
		return Promise.resolve();

	} catch(error) {
		return Promise.reject("there was an error");
	}
}
/*
async function traverseDocumentForBuildings(children: ChildNode[], buildingData: Set<string[]>, base64Data: JSZip): void {
	let roomShortName: string = "";
	let roomFullName: string = "";
	let roomAddress: string = "";
	let fileLink: string = "";
	if (children) {
		for (let childnode of children) {
			if (childnode.nodeName === "tr") {
				let childNodes: ChildNode[] = defaultTreeAdapter.getChildNodes(childnode as ParentNode);
				roomShortName = traverseTableRow(childNodes, CLASS_SHORTNAME);
				roomFullName = traverseTableRow(childNodes, CLASS_FULLNAME);
				roomAddress = traverseTableRow(childNodes, CLASS_ADDRESS);
				fileLink = traverseTableRow(childNodes, CLASS_LINK);
				console.log("roomShortName = " + roomShortName);
				console.log("roomFullName = " + roomFullName);
				console.log("roomAddress = " + roomAddress);
				console.log("fileLink = " + fileLink);
				let htmlContent = await base64Data.file(fileLink)?.async("string"); // maybe push promises that'll eventually resolve or something and map them to a insightdatasetroom
				console.log();
			}
			traverseDocumentForBuildings(defaultTreeAdapter.getChildNodes(childnode as ParentNode), buildingData);
		}
	}
}

function traverseTableRow(children: ChildNode[], classIdentifier: string): string {
	if (children) {
		let buildingInfoInIndex: string[] = [];
		for(let childnode of children) {
			if(childnode.nodeName === "td") {
				let buildingInfoComponent = getValueFromTdTag(childnode, classIdentifier);
				if(buildingInfoComponent !== "") {
					return buildingInfoComponent.trim();
				}
			}
		}
	}
	return "";
}
function getValueFromTdTag(child: ChildNode, classIdentifier: string): string {
	let attributes = defaultTreeAdapter.getAttrList(child as Element);
	for(let attribute of attributes) {
		if(attribute.value.includes(classIdentifier) && attribute.name === "class") {
			if(TD_VALUES.includes(classIdentifier)) {
				return getBuildingInfo(child);
			} else if(ANCHOR_VALUES.includes(classIdentifier)) {
				if (classIdentifier === CLASS_LINK) {
					return parseAnchor(child, "href");
				} else {
					return parseAnchor(child, "value");
				}
			}
		}
	}
	return "";
}

function getBuildingInfo(child: ChildNode): string {
	if (child) {
		let children: ChildNode[]  = defaultTreeAdapter.getChildNodes(child as ParentNode);
		for(const aChild of children) {
			let test: string = defaultTreeAdapter.getTextNodeContent(aChild as TextNode);
			return test;
		}
	}
	return "";
}

// given a TD childnode it parses either the href or the thing surrounded by the anchor tags.
function parseAnchor(child: ChildNode, wantedVal: string): string {
	if(wantedVal === "href") {
		let children = defaultTreeAdapter.getChildNodes(child as ParentNode);
		for(let aChild of children) {
			if(aChild.nodeName === "a") {
				let attributes = defaultTreeAdapter.getAttrList(aChild as Element);
				for(let attribute of attributes) {
					if(attribute.name === "href") {
						return attribute.value;
					}
				}
			}
		}
	} else if(wantedVal === "value") {
		let children = defaultTreeAdapter.getChildNodes(child as ParentNode);
		for(let aChild of children) {
			if(aChild.nodeName === "a") {
				let moreChildren = defaultTreeAdapter.getChildNodes(aChild as ParentNode);
				for(let anotherChild of moreChildren) {
					return "value" in anotherChild ? anotherChild.value : "";
				}
			}
		}
	}
	return "";
}

//
// function tableContainsBuildingInfo(children: ChildNode[]): boolean {
// 	for(let childnode of children) {
// 		if(childnode.nodeName === "#text") {
// 			return (childnode as ParentNode).value
// 		}
// 	}
// }
*/
