import React, {useEffect, useState} from 'react';
import Form from 'react-bootstrap/Form';
import {Col, Row} from "react-bootstrap";
import {COMPARATOR, IS, LT, NUMBER_FIELDS, SECTION_FIELD_NAMES, STRING_FIELDS} from "../util/Constants";
import styled from "styled-components";
import {getSelectedColumns} from "./OptionComponent";
import {capitalize, getDatasetFields, getMatchingFilters, getMatchingInputType} from "../util/Functions";

export const RowWrapper = styled(Row)`
	width: 100%;
	margin-top: 1em;
	margin-bottom: 2em;
	padding-right: 0;
	padding-left: 0;
	margin-left: 0.05em;
`
export const ColWrapper = styled(Col)`

`

const WhereComponents = (props) => {
	const [selectedField, setSelectedField] = useState("");
	const [selectedFilter, setSelectedFilter] = useState("");
	const [selectedValue, setSelectedValue] = useState("");

	useEffect(() => {
		let filter = selectedFilter;
		let dataset = props.dataset.toLowerCase();
		console.log("selected field is: "+selectedField);
		let key = dataset + "_" + selectedField
		let value = selectedValue;
		(NUMBER_FIELDS.includes(selectedField) && filter === IS)?setSelectedFilter(LT): filter = selectedFilter;
		let where = {};
		where[filter] = {};
		where[filter][key] = NUMBER_FIELDS.includes(selectedField)? Number(value) : value;
		console.log("where check: " + where);
		props.setWhere(where);
	}, [selectedField, selectedFilter, selectedValue]);

	useEffect(() => {
		const x = setSelectedField(props.columns[0]? props.columns[0]: "");
		//	const x = 	setSelectedField(props.columns[0]);
		console.log("whereComponent Cols: " + props.columns[0] + " , selected field: " + selectedField);
		setSelectedFilter(NUMBER_FIELDS.includes(selectedField)? LT : IS); //@TODO CUMMMMMM
		setSelectedValue("");

	}, [props.columns])

	return (
			<RowWrapper>
				<ColWrapper md={4}>
					<Form.Label htmlFor="disabledSelect">Field:</Form.Label>
					<Form.Select value={selectedField} size="md" onChange={(e) => {
						STRING_FIELDS.includes(e.target.value)? setSelectedFilter(IS): setSelectedFilter(LT);
						setSelectedField(e.target.value);
					}}>
						{props.columns.map(fieldName => {
							return <option value={fieldName}> {capitalize(fieldName)} </option>
						})}
					</Form.Select>
				</ColWrapper>

				<ColWrapper md={3}>
					<Form.Label htmlFor="disabledSelect">Filter:</Form.Label>
					<Form.Select value={selectedFilter} size="md" onChange={(e) => {
						// console.log("the filter is " + e.target.value);
						setSelectedFilter(e.target.value);
					}}>
						{getMatchingFilters(selectedField).map(comparator => {
							return <option value={comparator}> {comparator} </option>
						})}
					</Form.Select>
				</ColWrapper>

				<ColWrapper md={5}>
					<Form.Label>Enter a Value:</Form.Label>
					<Form.Control value={selectedValue} type={getMatchingInputType(selectedField)} onChange={(e) => {
						setSelectedValue(e.target.value);
					}} required/>
				</ColWrapper>
			</RowWrapper>
	);
};

export default WhereComponents;
