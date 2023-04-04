import './App.css';
import {Button, Col, Row, Alert} from "react-bootstrap";
import styled from 'styled-components'
import OptionComponent from "./components/OptionComponent";
import SelectorComponent from "./components/SelectorComponent";
import TableComponent from "./components/TableComponent";
import WhereComponents, {RowWrapper} from "./components/WhereComponents";
import SortComponent from "./components/SortComponent";
import ErrorComponent from "./components/ErrorComponent";
import {useEffect, useState} from "react";
import {COLUMNS, KEYS, OPTIONS, ORDER, ROOMS_FIELD_NAMES, SECTION_FIELD_NAMES, WHERE} from "./util/Constants";
import {capitalize} from "./util/Functions";
import {render} from "@testing-library/react";
import {COLUMNS, KEYS, OPTIONS, ORDER, SECTION_FIELD_NAMES, WHERE} from "./util/Constants";

export const Wrapper = styled(Col)`
	margin: 2em 3em 2em 3em;
`
export const QueryBuilderDiv = styled(Row)`
	display: block;
`
const ButtonWrapper = styled(Row)`
	width: 100%;
	margin: 2em 0em 2em 0em;
`
const baseQuery = {
	"WHERE": {

	},
	"OPTIONS": {
		"COLUMNS": [
			"sections_title",
			"sections_avg",
			"sections_dept"
		],
		"ORDER": {
			"dir": "DOWN",
			"keys": [
				"sections_avg"
			]
		}
	}
}

function App() {
	const [query, setQuery] = useState({}) // the giant ass query
	const [dataset, setDataset] = useState("sections"); // either "room" or "sections"
	const [columns, setColumns] = useState([]); // array of strings that are columns we want in result
	const [sortOptions, setSortOptions] = useState({}); // query sort options. i.e. {"dir": "DOWN", "keys": ["sections_dept]}
	const [queryResult, setQueryResult] = useState([]); // a list of InsightResult
	const [errorMSG, setErrorMSG] = useState("");
	const [where, setWhere] = useState({}); // an object that is the content of the where {"IS": {"sections_dept": "CPSC"}}

	useEffect(() => {
		console.log(`query = ${query}`);
		console.log(`dataset = ${dataset}`);
		console.log(`columns = ${columns}`);
		console.log(`sortOptions = ${JSON.stringify(sortOptions)}`);
		console.log(`where = ${JSON.stringify(where)}`);
		buildQuery();
	}, [dataset, columns, sortOptions, where]);

	useEffect( () => {
	}, [queryResult]);

	function buildQuery() {
		let userQuery = JSON.parse(JSON.stringify(baseQuery));
		let userSortOptions = JSON.parse(JSON.stringify(sortOptions));

		userQuery[WHERE] = where;
		userQuery[OPTIONS][COLUMNS] = columns.map((column) => dataset + "_" + column);
		userQuery[OPTIONS][ORDER] = sortOptions;
		setQuery(userQuery);
		console.log("the query = " + JSON.stringify(userQuery));
	}





	function submitQuery() {
		setErrorMSG("");
		fetch('http://localhost:4321/query', {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(query)
		}).then((response) => {
			console.log("The response is: " + JSON.stringify(response));
			console.log("The response has type: " + typeof response);
			//@TODO add error message for invalid query
			return Promise.resolve(response.json());
		}).then((data) => {
			if(data.error) {
				console.log("ERROR The data is: " + JSON.stringify(data)); //data.result is an array of insight result
				return Promise.reject(data.error);
			}
			console.log("The data has keys: " + Object.keys(data));
			console.log("The data is: " + data.result); //data.result is an array of insight result
			console.log("The data has type: " + typeof data);
			setQueryResult(data.result);
		}).catch((error) => {
			//	alert("ERROR: "+ error);
			setErrorMSG(error);
			console.log(error);
		});
	}

	/*if(errorFound){
		return(ErrorComponent blah blah blah );
	}*/
  return (

	<Wrapper>
			<QueryBuilderDiv md={5} className="square border border-4 rounded-start">
				<SelectorComponent setColumns={setColumns} setDataset={setDataset} dataset={dataset}></SelectorComponent>
				<OptionComponent setColumns={setColumns} columns={columns} dataset={dataset}></OptionComponent>
				<WhereComponents setWhere={setWhere} dataset={dataset} columns={columns}></WhereComponents>
				<SortComponent setSort={setSortOptions} dataset={dataset} columns={columns}></SortComponent>
				<ButtonWrapper setQueryResult={setQueryResult}>
					<Button onClick={submitQuery} variant="primary"> Submit </Button>
				</ButtonWrapper>
			</QueryBuilderDiv>

			<QueryBuilderDiv md={7}>
				{
					(errorMSG !== "")? <ErrorComponent errorType = {errorMSG}/>:
						<TableComponent queryResult={queryResult}></TableComponent>
				}
			</QueryBuilderDiv>
	</Wrapper>
  );
}

export default App;


