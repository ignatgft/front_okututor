import { BrowserRouter, Route, Routes } from "react-router-dom"
import PgMain from "./pages/PgMain"
import Register from "../src/components/AuthRegister/Register"
import Auth from "../src/components/AuthRegister/Auth"

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<PgMain/>}/>
        <Route path="/register" element={<Register />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
