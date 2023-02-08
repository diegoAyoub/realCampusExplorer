//	This file will have a lot of the query helper functions, this file is essentially the query engine //
import {
	IInsightFacade,
	InsightData,
	InsightDataset,
	InsightDatasetKind,
	InsightDatasetSection,
	InsightError,
	InsightResult, NotFoundError
} from "./IInsightFacade";

import * as InFa from "./InsightFacade";
import * as fs from "fs-extra";
import * as zip from "jszip";
import JSZip from "jszip";

const COMPARATORLOGIC = ["AND","OR", "LT","GT","EQ","IS","NOT"];

export class QueryEngine {

	public dataset: InsightData[];
	public queryJson: any;
	public qryID: string = "";


	constructor(data: InsightData[], qryJson: unknown){
		this.dataset = data;
		this.queryJson = qryJson as any;
	}

	public validateQuery(): boolean {
		//	check if the query is in an input section like in the tests [TESTING PURPOSES ONLY I THINK]
       	if (Object.prototype.hasOwnProperty.call(this.queryJson,"input")){
        	this.queryJson = this.queryJson["input"];
		}
		 //	check if there is a where block
		let isWhere: boolean = Object.prototype.hasOwnProperty.call(this.queryJson,"WHERE");
		if(!isWhere){
        	return false; //	Promise.reject(new InsightError("Invalid query lang: WHERE"));
		}
        //	check if there is an options block or return error
		let isOptions: boolean = Object.prototype.hasOwnProperty.call(this.queryJson,"OPTIONS");

		if(!isOptions){
        	return false; //	Promise.reject(new InsightError("Invalid query lang: OPTIONS"));
		}
		return true;
	}
	// Recursion through where sub block, explores each layer of camparators until section ID and column is found. Then
	//	returns true if valid. false otherwise
	public validateWhere(whereBlock: any): boolean{
		let conditionVal: any;
		for(let key in whereBlock){
			let whereKey: string = key;
			let whereVal = whereBlock[key] as any;
			if(COMPARATORLOGIC.includes(whereKey)) {
				return this.validateWhere(whereKey);
			} else {
				conditionVal = whereVal;
				//	GET ID
				let keyArr = whereKey.split("_");
				let queryID: string = keyArr[0];
				let conditionCol: string = keyArr[1];

				if(!this.isIdExist(queryID) || !this.isValidId(queryID)) {

					return false; // Promise.reject(new InsightError("Query ID is not valid or does not exist"));
				}
				//	ELSE
			}
		}
		return true;
	}

	public filterMComparator(comparator: string, col: string, value: string): InsightDatasetSection[]{

		let filteredList: InsightDatasetSection[] = [];
		let sections: InsightDatasetSection[]  = this.dataset[0].data;

		switch(comparator){
			case "GT": {
				//	do something
				for(const currClass of sections){
					if(this.getColVal(currClass,col) > value) {
						// ADD TO LIST
						filteredList.push(currClass);
					}
				}
				break;
			}
			case "LT":{
				for(const currClass of sections){
					if(this.getColVal(currClass,col) < value) {
						// ADD TO LIST
						filteredList.push(currClass);
					}
				}
				break;
			}
			case "EQ":{
				for(const currClass of sections){
					if(this.getColVal(currClass,col) === value) {
						// ADD TO LIST
						filteredList.push(currClass);
					}
				}
				break;
			}
		}
    	// return Promise.resolve("");
		return filteredList;
	}

	public getColVal(section: any, colName: string): string | number {
		switch(colName){
			case "uuid":{
				return section["uuid"];
			}
			case "id": {
				return section["id"];
			}
			case "title":{
				return section["title"];
			}
			case "instructor":{
				return section["instructor"];
			}
			case "dept": {
				return section["dept"];
			}
			case "year": {
				return section["year"];
			}
			case "avg": {
				return section["avg"];
			}
			case "pass": {
				return section["pass"];
			}
			case "fail": {
				return section["fail"];
			}
			case "audit": {
				return section["audit"];
			}

			// @TODO might need a default case sending back an error here
		}
		return "cmon now";
	}

	public filterAND(classes: InsightDatasetSection[]): string{
		// if(classes.length)
		for(let i = 1; i < classes.length; i++){
			console.log("yerr");
		}

		return "";
	}

	public isIdExist(id: string): boolean {
		for(const dataset of this.dataset) {
			if (dataset.metaData.id === id) {
				return true;
			}
		}
		return false;
	}

	public isValidId(id: string): Promise<string> {
		if (id.trim().length === 0) { // blank id or id is all whitespace
			return Promise.reject(new InsightError("The ID must contain non white space characters"));
		} else if(id.includes("_")) { // id has an underscore
			return Promise.reject(new InsightError("The ID can't contain any underscores \"_\""));
		}
		return Promise.resolve("");
	}

}


