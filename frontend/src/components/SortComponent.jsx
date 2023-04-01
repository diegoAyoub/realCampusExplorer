import React, {useEffect, useState} from 'react';
import Form from "react-bootstrap/Form";
import {COMPARATOR, DIR, KEYS, ORDER, SECTION_FIELD_NAMES} from "../util/Constants";
import {Col, Row} from "react-bootstrap";
import {RowWrapper} from "./WhereComponents";
import {getDatasetFields} from "../App";
import {capitalize} from "../util/Functions";


const SortComponent = (props) => {
	const [selectedField, setSelectedField] = useState("");
	const [selectedDirection, setSelectedDirection] = useState("UP");


	useEffect(() => {
		let order = {}
		order[DIR] = selectedDirection
		order[KEYS] = [selectedField];
		props.setSort(order);
		// setSelectedField(props.dataset + "_" + selectedField);
	}, [selectedField, selectedDirection]);

	useEffect(() => {
		let order = {}
		order[DIR] = selectedDirection
		order[KEYS] = [selectedField];
		props.setSort(order);
		setSelectedField(props.dataset + "_" + props.columns[0]);
	}, [props.columns]);

	return (
		<RowWrapper>
			<Col>
				<Form.Label htmlFor="disabledSelect">Select Field to Order On:</Form.Label>
				<Form.Select value={selectedField} size="md" onChange={(e) => {
					console.log("the field is " + e.target.value);
					setSelectedField(e.target.value);
				}}>
					{
						props.columns.map((fieldName, index) => {
							return <option key={index} value={props.dataset + "_" + fieldName}>
								{capitalize(fieldName)}
							</option>
						})
					}
				</Form.Select>
			</Col>
			<Col>
				<Form.Label htmlFor="disabledSelect">Order Direction:</Form.Label>
				<Form.Select value={selectedDirection} size="md" onChange={(e) => {
					console.log("the order direction is " + e.currentTarget.value);
					setSelectedDirection(e.target.value);
				}}>
					<option value="DOWN"> Ascending </option>
					<option value="UP"> Descending </option>
				</Form.Select>
			</Col>
		</RowWrapper>
	);
};

export default SortComponent;
