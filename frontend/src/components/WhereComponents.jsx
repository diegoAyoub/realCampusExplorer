import React from 'react';
import Form from 'react-bootstrap/Form';
import {Col, Row} from "react-bootstrap";
import {COMPARATOR, SECTION_FIELD_NAMES} from "../util/Constants";
import styled from "styled-components";

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

const WhereComponents = () => {
	return (
			<RowWrapper>
				<ColWrapper md={4}>
					<Form.Label htmlFor="disabledSelect">Field:</Form.Label>
					<Form.Select size="md">
						{SECTION_FIELD_NAMES.map(fieldName => {
							return <option> {fieldName} </option>
						})}
					</Form.Select>
				</ColWrapper>

				<ColWrapper md={3}>
					<Form.Label htmlFor="disabledSelect">Filter:</Form.Label>
					<Form.Select size="md">
						{COMPARATOR.map(comparator => {
							return <option> {comparator} </option>
						})}
					</Form.Select>
				</ColWrapper>

				<ColWrapper md={5}>
					<Form.Label>Enter a Value:</Form.Label>
					<Form.Control type="email"/>
				</ColWrapper>
			</RowWrapper>
	);
};

export default WhereComponents;
