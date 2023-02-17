import {InsightDatasetSection, InsightError} from "./IInsightFacade";
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
		for (const AClass of classes) {
			try {
				let classObject = JSON.parse(AClass);
				if (classObject.result.length !== 0) {
					// for the ones with results key that maps to empty
					// Promise.reject(new InsightError("There are no valid sections"));
					for (const section of classObject.result) {
						if (isValidSection(section)) {
							let year = section.Section === "overall" ? 1900 : parseInt(section.Year, 10);
							sections.push(
								new InsightDatasetSection(
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
 * Verifies that a section object is valid. A valid section is one that has all the required keys: ( "id",
 * "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit")
 * REQUIRES: None
 * MODIFIES: None
 * EFFECTS: Returns true if the object is valid and false otherwise.
 **/
export function isValidSection(section: any): boolean {
	let isValid = true;
	for (const requiredKey of REQUIRED_SECTION_KEYS) {
		isValid = isValid && Object.prototype.hasOwnProperty.call(section, requiredKey);
	}
	return isValid;
}
