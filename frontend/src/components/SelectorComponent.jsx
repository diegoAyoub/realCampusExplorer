import React from 'react'
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
const SelectorComponent = (props) => {
	return (
		<DropdownButton id="dropdown-basic-button" title="Choose Dataset">
			<Dropdown.Item href="#/action-1">Sections</Dropdown.Item>
			<Dropdown.Item href="#/action-3">Rooms</Dropdown.Item>
		</DropdownButton>
	)
}
export default SelectorComponent
