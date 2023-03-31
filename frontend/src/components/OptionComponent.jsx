import React, {useState} from 'react';
import {SECTION_FIELD_NAMES} from "../util/Constants";
import {ButtonGroup, Col, Row, ToggleButton, ToggleButtonGroup} from "react-bootstrap";
import styled from "styled-components";
import Form from "react-bootstrap/Form";

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

function getSelectedColumns() {
	return colArr;
}
const handleColChange = (event) => {
	// alert(Object.keys(event));
	if(event.currentTarget.checked){
		// console.log("you checked:" + event.target.defaultValue);
		if(!getSelectedColumns().includes(event.target.defaultValue)){
			colArr.push(event.target.defaultValue);
		}
	} else{
		let index = colArr.indexOf(event.target.defaultValue)
		if(index !== -1){
			// console.log("you unchecked: " + event.target.defaultValue);
			colArr.splice(index,1);
		}
	}
	console.log(colArr);

}
const OptionComponent = () => {
	//some sort've setter or usestate that decides between rooms_field_names depending on what's selected
	const [value, setValue] = useState([]);
	const handleChange = (val, index) => {
		console.log(`val = ${val}`);
		console.log(`index = ${index}`);
		handleColChange(val);
		let updatedValue = value.map(element => element);
		updatedValue[index] = !value[index];
		setValue(updatedValue);
	};

	return (
		// <ButtonToolbarWrapper>
		<Wrapper>
			<Row>
				<Form.Label htmlFor="disabledSelect">Choose the Fields to Include in the result:</Form.Label>
			</Row>
			<ButtonGroupWrapper>
				{SECTION_FIELD_NAMES.map((fieldName,index) => {
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
		// </ButtonToolbarWrapper>
	);
};

export default OptionComponent;
/*<InputGroup.Checkbox aria-label="Checkbox for following text input" />
					<p> {fieldNames} </p>*/
