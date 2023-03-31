import React from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

import {SECTION_FIELD_NAMES} from "../util/Constants";

let colArr =[];

function getSelectedColumns() {
	return colArr;
}
const handleColChange = (event) => {
	if(event.target.checked){
		// console.log("you checked:" + event.target.defaultValue);
		if(!colArr.includes(event.target.defaultValue)){
			colArr.push(event.target.defaultValue);
		}
	} else{
		let index = colArr.indexOf(event.target.defaultValue)
		if(index != -1){
			// console.log("you unchecked: " + event.target.defaultValue);
			colArr.splice(index,1);
		}
	}

}
const OptionComponent = () => {
	return (
		 <>
			{SECTION_FIELD_NAMES.map(fieldName => {
				return<>
					<div className="form-check">
						<input
							className="form-check-input"
							type="checkbox"
							defaultValue= {fieldName}
							id="flexCheckDefault"
							onChange = {handleColChange}
						/>
						<label className="form-check-label" htmlFor="flexCheckDefault">
							{fieldName}
						</label>
					</div>
				</>
			})}
		</>
	);
};

export default OptionComponent;
/*<InputGroup.Checkbox aria-label="Checkbox for following text input" />
					<p> {fieldNames} </p>*/
