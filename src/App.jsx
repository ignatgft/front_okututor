import { BrowserRouter, Route, Routes } from "react-router-dom";
import PgMain from "./pages/PgMain";
import Profile from "./pages/PgProfile";
import Course from "./pages/PgCourse";
import CourseView from "./pages/PgCourseView";
import Auth from "./components/AuthRegister/Auth";
import Register from "./components/AuthRegister/Register";
import { useState } from "react";

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const openRegisterFromAuth = () => {
    setIsAuthOpen(false);
    setIsRegisterOpen(true);
  };

  const openAuthFromRegister = () => {
    setIsRegisterOpen(false);
    setIsAuthOpen(true);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PgMain
              onLogin={() => setIsAuthOpen(true)}
              onSignup={() => setIsRegisterOpen(true)}
            />
          }
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/course" element={<Course />} />
        <Route path="/course/:courseId" element={<CourseView />} />
      </Routes>

      {/* Модальные окна авторизации и регистрации */}
      <Auth
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenRegister={openRegisterFromAuth}
      />
      <Register
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onOpenAuth={openAuthFromRegister}
      />
    </BrowserRouter>
  );
}

export default App;
