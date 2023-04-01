import React, {useEffect, useState} from 'react';
import {Row, Table} from "react-bootstrap";
import {RowWrapper} from "./SelectorComponent";
import styled from "styled-components";
import {capitalize, formatTableHeadings} from "../util/Functions";

const TableWrapper = styled(Table)`
	margin: 2em 0em 2em 0em;

`
const TableComponent = (props) => {
	const [result, setResults] = useState([]);

	useEffect(() => {
		setResults(props.queryResult);
	}, [props.queryResult]);

	return (
			<TableWrapper striped bordered hover primary>
				<thead>
					<tr>
						{
							(result?.length > 0) && Object.keys(result?.[0]).map((fieldname, index) => {
								return <th key={index + "heading"}>{formatTableHeadings(fieldname)}</th>
							})
						}
					</tr>
				</thead>
				<tbody>
					{
						(result?.length > 0) && result.map((entry) => Object.values(entry)).map(element => {
							return <tr>
								{
									element.map((field, index) => {
										return <td key={index}>{capitalize(String(field))}</td>
									})
								}
							</tr>
						})
					}
				</tbody>
			</TableWrapper>
	);
};

export default TableComponent;
