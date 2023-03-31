import React from 'react';
import Form from "react-bootstrap/Form";
import {COMPARATOR, SECTION_FIELD_NAMES} from "../util/Constants";
import {Col, Row} from "react-bootstrap";
import {RowWrapper} from "./WhereComponents";


const SortComponent = () => {
	return (
		<RowWrapper>
			<Col>
				<Form.Label htmlFor="disabledSelect">Select Field to Order On:</Form.Label>
				<Form.Select size="md">
					{SECTION_FIELD_NAMES.map(fieldName => {
						return <option> {fieldName} </option>
					})}
				</Form.Select>
			</Col>
			<Col>
				<Form.Label htmlFor="disabledSelect">Order Direction:</Form.Label>
				<Form.Select size="md">
					<option> Ascending </option>
					<option> Descending </option>
				</Form.Select>
			</Col>
		</RowWrapper>
	);
};

export default SortComponent;
