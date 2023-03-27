import {InsightDatasetRoom, InsightDatasetSection, InsightError, IndexHtmRoomData} from "./IInsightFacade";
import JSZip from "jszip";
import * as zip from "jszip";
import {parse, defaultTreeAdapter} from "parse5";
import {ChildNode, Document, Element, ParentNode, TextNode} from "parse5/dist/tree-adapters/default";
import {
	ANCHOR_VALUES,
	CLASS_ADDRESS,
	CLASS_LINK,
	CLASS_SHORTNAME,
	TD_VALUES,
	CLASS_FULLNAME, CLASS_ROOM_NUMBER, CLASS_ROOM_CAPACITY, CLASS_ROOM_TYPE, CLASS_ROOM_FURNITURE, BASE_URL_GEOLOCATION
} from "./Constants";

import http from "http";
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

export async function handleReadingRooms(content: string, dataset: InsightDatasetRoom[]): Promise<void>{
	try {
		let asyncFileReadJobs: any[] = [];
		let asyncGetLotAndLatJobs: any[] = [];
		let base64Data: JSZip = await zip.loadAsync(content, {base64: true});
		let htmlContent = await base64Data.file("index.htm")?.async("string");
		let document: Document = parse(htmlContent as string);

		let buildingData: Set<IndexHtmRoomData> = new Set<IndexHtmRoomData>();
		traverseIndexHtmForValidRooms(defaultTreeAdapter.getChildNodes(document), buildingData);
		let buildingDataArray = Array.from(buildingData);
		buildingData.forEach((validBuilding) => {
			asyncGetLotAndLatJobs.push(getLonAndLat(validBuilding));
		});
		await Promise.all(asyncGetLotAndLatJobs);
		let buildingsWithLonAndLat = buildingDataArray.filter((room) => room.lat);
		buildingsWithLonAndLat.forEach( (validBuilding) => {
			asyncFileReadJobs.push(readValidRooms(validBuilding, base64Data, dataset)); // does readValidRooms wait till the recursion is done tho
		});
		await Promise.all(asyncFileReadJobs);
		if(dataset.length < 1) {
			return Promise.reject(new InsightError("NO room datasets"));
		}
	} catch(error) {
		// console.log(error);
		return Promise.reject("there was an error");
	}
}

async function readValidRooms(validBuilding: IndexHtmRoomData, base64Data: JSZip, dataset: InsightDatasetRoom[]) {
	let htmlContent = await base64Data.file(validBuilding.relativeFileLink)?.async("string");
	let document: Document = parse(htmlContent as string);
	parseValidRooms(validBuilding, defaultTreeAdapter.getChildNodes(document), dataset);
}
function parseValidRooms(validRoomsData: IndexHtmRoomData, children: ChildNode[], dataset: InsightDatasetRoom[]): void {
	// console.log("YESSS I\"M IN");
	if(children) {
		// console.log("PROGRESS");
		for(let childnode of children) {
			if(childnode.nodeName === "tr" && childnode.parentNode?.nodeName === "tbody") {
				let childNodes: ChildNode[] = defaultTreeAdapter.getChildNodes(childnode as ParentNode);
				let roomNumber = traverseTableRow(childNodes, CLASS_ROOM_NUMBER);
				let roomSeats = traverseTableRow(childNodes, CLASS_ROOM_CAPACITY);
				let roomType = traverseTableRow(childNodes, CLASS_ROOM_TYPE);
				let roomFurniture = traverseTableRow(childNodes, CLASS_ROOM_FURNITURE);
				let roomHref = traverseTableRow(childNodes, CLASS_LINK);
				dataset.push(new InsightDatasetRoom(
					validRoomsData.fullname,
					validRoomsData.shortname,
					validRoomsData.address,
					validRoomsData.lat,
					validRoomsData.lon,
					roomNumber,
					+roomSeats,
					roomType,
					roomFurniture,
					roomHref
				));
			}
			parseValidRooms(validRoomsData, defaultTreeAdapter.getChildNodes(childnode as ParentNode), dataset);
		}
	}
}

function traverseIndexHtmForValidRooms(children: ChildNode[], buildingData: Set<IndexHtmRoomData>): void {

	if (children) {
		for (let childnode of children) {
			if (childnode.nodeName === "tr" && childnode.parentNode?.nodeName === "tbody") {
				let childNodes: ChildNode[] = defaultTreeAdapter.getChildNodes(childnode as ParentNode);
				let indexHtmData = {} as IndexHtmRoomData;
				indexHtmData.fullname = traverseTableRow(childNodes, CLASS_FULLNAME);
				indexHtmData.shortname = traverseTableRow(childNodes, CLASS_SHORTNAME);
				indexHtmData.relativeFileLink = traverseTableRow(childNodes, CLASS_LINK).substring(2);
				indexHtmData.address = traverseTableRow(childNodes, CLASS_ADDRESS);
				buildingData.add(indexHtmData);
			}
			traverseIndexHtmForValidRooms(defaultTreeAdapter.getChildNodes(childnode as ParentNode), buildingData);
		}
	}
}

function traverseTableRow(children: ChildNode[], classIdentifier: string): string {
	if (children) {
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

async function getLonAndLat(roomData: IndexHtmRoomData): Promise<any> {
	// let addressComponents = roomData.address.split(" ");
	let urlEncodedAddress = encodeURIComponent(roomData.address);
	let endpoint = BASE_URL_GEOLOCATION + urlEncodedAddress;
	let result = await waitForRequest(endpoint);
	if(result.error) {
		return Promise.resolve;
	}
	roomData.lon = result.lon;
	roomData.lat = result.lat;
	return Promise.resolve();
}

function waitForRequest(endpoint: string): Promise<any> {
	return new Promise((resolve, reject) => {
		http.get(endpoint, (result) => {
			let rawData = "";
			result.on("data", (chunk) => {
				rawData += chunk;
			});
			result.on("end", () => {
				const parsedData = JSON.parse(rawData);
				resolve(parsedData);
			});
			result.on("error",() => {
				reject();
			});
		});
	});
}

