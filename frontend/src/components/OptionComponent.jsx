import React, {useEffect, useState} from 'react';
import {SECTION_FIELD_NAMES} from "../util/Constants";
import {ButtonGroup, Col, Row, ToggleButton, ToggleButtonGroup} from "react-bootstrap";
import styled from "styled-components";
import Form from "react-bootstrap/Form";
import {getDatasetFields} from "../util/Functions";

const ToggleButtonWrapper = styled(ToggleButton)`
	width: 8em;

`
styled(Row)`
	justify-content: space-between;
`;
const ButtonGroupWrapper = styled(ButtonGroup)`
	justify-content: space-between;
	width: 100%;
`

const Wrapper = styled.div`
	width: 100%;
	margin-bottom: 2em;
`


let colArr =[];

export function getSelectedColumns(){
	return colArr;
}
const handleColChange = (event) => {
	// alert(Object.keys(event));
	if(event.currentTarget.checked){
		if(!getSelectedColumns().includes(event.target.defaultValue)){
			colArr.push(event.target.defaultValue);
		}
	} else{
		let index = colArr.indexOf(event.target.defaultValue)
		if(index !== -1){
			colArr.splice(index,1);
		}
	}
}
const OptionComponent = (props) => { // <OptionComponent setColumns={setColumns} columns={columns} dataset={dataset}></OptionComponent>
	//some sort've setter or usestate that decides between rooms_field_names depending on what's selected
	const [value, setValue] = useState(getDatasetFields(props.dataset).map((element) => false));
	useEffect(() => {
		// console.log(props.columns);
		setValue(props.columns.map((element) => false));
		// console.log("value is " + value);
	}, [props.dataset]);

	const handleChange = (val, index) => {
		colArr = [...props.columns];
		handleColChange(val); //addds to the array
		let updatedValue = [...value]; //records whether the field has een selected
		updatedValue[index] = !value[index]; //sets it to the opposite
		// console.log("WE ARE SETTING IT TO " + updatedValue);
		setValue(updatedValue); //
		// console.log("THE COL ARR IS " + colArr);
		props.setColumns(colArr);
		// console.log(props.dataset);
	};

	return (
		<Wrapper>
			<Row>
				<Form.Label htmlFor="disabledSelect">Choose the Fields to Include in the result:</Form.Label>
			</Row>
			<ButtonGroupWrapper>
				{getDatasetFields(props.dataset).map((fieldName,index) => {
					return<>
							<ToggleButtonWrapper
								type="checkbox"
								id={`tbg-btn-${index}`}
								value={fieldName}
								variant="outline-primary"
								checked={value[index]}
								onChange={(e) => handleChange(e, index)}
							>
							{fieldName.toUpperCase().slice(0,1) + fieldName.slice(1,fieldName.length).toLowerCase()}
							</ToggleButtonWrapper>

					</>
				})}
			</ButtonGroupWrapper>
		</Wrapper>
	);
};

export default OptionComponent;
/*<InputGroup.Checkbox aria-label="Checkbox for following text input" />
					<p> {fieldNames} </p>*/
