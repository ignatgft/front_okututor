import { BrowserRouter, Route, Routes } from "react-router-dom"
import PgMain from "./pages/PgMain"
import Profile from "./pages/PgProfile"

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PgMain/>}/>
        <Route path="/profile" element={<Profile/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
