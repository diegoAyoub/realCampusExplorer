import React, {useEffect, useState} from 'react';
import Form from "react-bootstrap/Form";
import {COMPARATOR, DIR, KEYS, ORDER, SECTION_FIELD_NAMES} from "../util/Constants";
import {Col, Row} from "react-bootstrap";
import {RowWrapper} from "./WhereComponents";
import {getDatasetFields} from "../App";
import {capitalize} from "../util/Functions";
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button';
import {render} from "@testing-library/react";

const ErrorComponent = (props) => {
	const [show, setShow] = useState(true);

	if (show) {
		return (<>
			<Alert variant="danger" onClose={() => setShow(false)} dismissible>
				<Alert.Heading>Oh snap! You got an error!</Alert.Heading>
				<p>
					{props.errorType}
				</p>
			</Alert>
			</>
		);
	}
	return <Button onClick={() => setShow(true)}>Show Alert</Button>;
}

//render(<ErrorComponent />);

export default ErrorComponent;
