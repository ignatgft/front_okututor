import { BrowserRouter, Route, Routes } from "react-router-dom"
import PgMain from "./pages/PgMain"
import Profile from "./pages/PgProfile"
import Course from "./pages/PgCourse"
import CourseView from "./pages/PgCourseView"

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PgMain/>}/>
        <Route path="/profile" element={<Profile/>}/>
        <Route path="/course" element={<Course/>}/>
        <Route path="/course/:courseId" element={<CourseView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
