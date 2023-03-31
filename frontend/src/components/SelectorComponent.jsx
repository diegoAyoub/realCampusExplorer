import React, {useState} from 'react'
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import {ButtonGroup, Row, ToggleButton} from "react-bootstrap";
import * as radios from "react-bootstrap/ElementChildren";
import styled from "styled-components";
import Form from "react-bootstrap/Form";

const StyledButtonGroup = styled(ButtonGroup)`
	width: 100%;
	margin: 0em 0em 2em 0;
`

const FirstRowWrapper = styled.div`
	width: 100%;
	padding-top: 1em;
`

const SelectorComponent = (props) => {
	const [checked, setChecked] = useState(false);
	const [radioValue, setRadioValue] = useState('2');
	const radios = [
		{ name: 'Sections', value: '2' },
		{ name: 'Rooms', value: '3' },
	];

	return (
		<FirstRowWrapper>
			{/*<DropdownButton id="dropdown-basic-button" title="Choose Dataset">*/}
			{/*	<Dropdown.Item href="#/action-1">Sections</Dropdown.Item>*/}
			{/*	<Dropdown.Item href="#/action-3">Rooms</Dropdown.Item>*/}
			{/*</DropdownButton>*/}
			<Form.Label htmlFor="disabledSelect">Choose a dataset:</Form.Label>
			<StyledButtonGroup>
				{radios.map((radio, idx) => (
					<ToggleButton
						key={idx}
						id={`radio-${idx}`}
						type="radio"
						variant={idx % 2 ? 'outline-primary' : 'outline-primary'}
						name="radio"
						value={radio.value}
						checked={radioValue === radio.value}
						onChange={(e) => setRadioValue(e.currentTarget.value)}
					>
						{radio.name}
					</ToggleButton>
				))}
			</StyledButtonGroup>
		</FirstRowWrapper>
	)
}
export default SelectorComponent
