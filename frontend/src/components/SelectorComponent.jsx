import React, {useState} from 'react'
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import {ButtonGroup, Row, ToggleButton} from "react-bootstrap";
import * as radios from "react-bootstrap/ElementChildren";
import styled from "styled-components";

const RowWrapper = styled(Row)`
	padding-top: 1rem;
	padding-bottom: 1rem;
`
const StyledButtonGroup = styled(ButtonGroup)`
	padding-left: 0px;
	padding-right: 0px;
`

const SelectorComponent = (props) => {
	const [checked, setChecked] = useState(false);
	const [radioValue, setRadioValue] = useState('2');
	const radios = [
		{ name: 'Sections', value: '2' },
		{ name: 'Rooms', value: '3' },
	];

	return (
		<RowWrapper>
			{/*<DropdownButton id="dropdown-basic-button" title="Choose Dataset">*/}
			{/*	<Dropdown.Item href="#/action-1">Sections</Dropdown.Item>*/}
			{/*	<Dropdown.Item href="#/action-3">Rooms</Dropdown.Item>*/}
			{/*</DropdownButton>*/}
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
		</RowWrapper>
	)
}
export default SelectorComponent
