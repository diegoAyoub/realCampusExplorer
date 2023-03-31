import React from 'react';
import {Row, Table} from "react-bootstrap";
import {RowWrapper} from "./SelectorComponent";
import styled from "styled-components";

const TableWrapper = styled(Table)`
	margin: 2em 0em 2em 0em;

`
const TableComponent = () => {
	return (

			<TableWrapper striped bordered hover primary>
				<thead>
				<tr>
					<th>#</th>
					<th>First Name</th>
					<th>Last Name</th>
					<th>Username</th>
				</tr>
				</thead>
				<tbody>
				<tr>
					<td>1</td>
					<td>Mark</td>
					<td>Otto</td>
					<td>@mdo</td>
				</tr>
				<tr>
					<td>2</td>
					<td>Jacob</td>
					<td>Thornton</td>
					<td>@fat</td>
				</tr>
				<tr>
					<td>3</td>
					<td>Larry the Bird</td>
					<td>@twitter</td>
					<td>@twitter</td>
				</tr>
				</tbody>
			</TableWrapper>
	);
};

export default TableComponent;
