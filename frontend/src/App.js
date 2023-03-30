import logo from './logo.svg';
import './App.css';
import {Button} from "react-bootstrap";
import OptionComponent from "./components/OptionComponent";
import SelectorComponent from "./components/SelectorComponent";

function App() {
  return (
    <div className="App">
		<OptionComponent></OptionComponent>
		<SelectorComponent></SelectorComponent>
    </div>
  );
}

export default App;
