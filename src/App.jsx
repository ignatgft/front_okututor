import { BrowserRouter, Route, Routes } from "react-router-dom"
import PgMain from "./pages/PgMain"

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<PgMain/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
