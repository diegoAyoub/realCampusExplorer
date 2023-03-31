import React, {useState} from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import {SECTION_FIELD_NAMES, ROOMS_FIELD_NAMES} from "../util/Constants";
import {Row, ToggleButton, ToggleButtonGroup} from "react-bootstrap";
import styled from "styled-components";

const ToggleButtonWrapper = styled(ToggleButton)`
	width: 6rem;
	margin-right: 0.5rem;
`

const ToggleButtonGroupWrapper = styled(ToggleButtonGroup)`
	display: flex;
	justify-content: center;
`
const OptionComponent = () => {
	//some sort've setter or usestate that decides between rooms_field_names depending on what's selected
	const [value, setValue] = useState([]);
	const handleChange = (val) => {setValue(val); alert(value)};

	return (
			<ToggleButtonGroupWrapper type="checkbox" value={value} onChange={handleChange}>
				{SECTION_FIELD_NAMES.map((fieldName,index) => {
					return<>
						{/*<InputGroup.Checkbox aria-label="Checkbox for following text input" />*/}
						{/*<p> {fieldNames.toUpperCase().slice(0,1) + fieldNames.slice(1,fieldNames.length).toLowerCase()} </p>*/}

						{/*<Form.Check type='checkbox' id={`check-api-${fieldName}`}>*/}
						{/*	<Form.Check.Input type='checkbox' isValid />*/}
						{/*	<Form.Check.Label>{`${fieldName}`}</Form.Check.Label>*/}
						{/*</Form.Check>*/}
							<ToggleButtonWrapper
								type="checkbox"
								id={`tbg-btn-${index}`}
								value={index}
								checked={value.includes(index)}
								variant="secondary"
								onChange={(e) => handleChange(e.currentTarget.value)}
							>
							{fieldName.toUpperCase().slice(0,1) + fieldName.slice(1,fieldName.length).toLowerCase() + value}
							</ToggleButtonWrapper>

					</>
				})}
			</ToggleButtonGroupWrapper>
	);
};

export default OptionComponent;
