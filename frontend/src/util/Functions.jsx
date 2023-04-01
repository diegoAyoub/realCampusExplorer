import {EQ, GT, IS, LT, NUMBER_FIELDS, ROOMS_FIELD_NAMES, SECTION_FIELD_NAMES} from "./Constants";

export function capitalize(input) {
	return input.charAt(0).toUpperCase() + input.slice(1);
}

export function getDatasetFields(datasetKind) {
	if(capitalize(datasetKind) === "Sections") {
		return SECTION_FIELD_NAMES;
	} else {
		// console.log("the dataset is: " + datasetKind);
		return ROOMS_FIELD_NAMES;
	}
}

export function getMatchingFilters(field) {
	if(NUMBER_FIELDS.includes(field.toLowerCase())) {
		return [LT, GT, EQ];
	} else {
		return [IS];
	}
}

export function getMatchingInputType(field) {
	if(NUMBER_FIELDS.includes(field.toLowerCase())) {
		return "number";
	} else {
		return "text";
	}
}

export function formatTableHeadings(heading) {
	return capitalize(heading.split("_")[1]);
}
