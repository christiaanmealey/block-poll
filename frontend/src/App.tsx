
import { BrowserRouter as Router, Route, Routes, Link} from 'react-router-dom';

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import "./App.css";

function App() {
  
  return (
    <div className='app'>
      <Router>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
