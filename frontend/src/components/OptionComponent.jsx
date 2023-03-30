import React from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import {SECTION_FIELD_NAMES} from "../util/Constants";
const OptionComponent = () => {
	return (
		<>
			{SECTION_FIELD_NAMES.map(fieldNames => {
				return<>
					<InputGroup.Checkbox aria-label="Checkbox for following text input" />
					<p> {fieldNames} </p>
				</>
			})}
		</>
	);
};

export default OptionComponent;
