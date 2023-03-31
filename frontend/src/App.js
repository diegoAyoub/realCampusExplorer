import './App.css';
import {Button, Col, Row} from "react-bootstrap";
import styled from 'styled-components'
import OptionComponent from "./components/OptionComponent";
import SelectorComponent from "./components/SelectorComponent";
import TableComponent from "./components/TableComponent";
import WhereComponents, {RowWrapper} from "./components/WhereComponents";
import SortComponent from "./components/SortComponent";

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

function App() {
  return (
	<Wrapper>
			<QueryBuilderDiv md={5} className="square border border-4 rounded-start">
				<SelectorComponent></SelectorComponent>
				<OptionComponent></OptionComponent>
				<WhereComponents></WhereComponents>
				<SortComponent></SortComponent>
				<ButtonWrapper>
					<Button variant="primary"> Submit </Button>
				</ButtonWrapper>
			</QueryBuilderDiv>

			<QueryBuilderDiv md={7}>
				<TableComponent></TableComponent>
			</QueryBuilderDiv>
	</Wrapper>
  );
}

export default App;


