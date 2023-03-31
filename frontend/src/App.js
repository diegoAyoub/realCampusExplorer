import './App.css';
import {Col, Container, Row} from "react-bootstrap";
import styled from 'styled-components'
import OptionComponent from "./components/OptionComponent";
import SelectorComponent from "./components/SelectorComponent";
import TableComponent from "./components/TableComponent";

const Wrapper = styled(Row)`
	margin-left: 2em;
	margin-right: 2em;
`

function App() {
  return (
	<Wrapper>
			<Col md={5}>
				<SelectorComponent></SelectorComponent>
				<OptionComponent></OptionComponent>
			</Col>
			<Col md={7}>
				<TableComponent></TableComponent>
			</Col>
	</Wrapper>
  );
}

export default App;


