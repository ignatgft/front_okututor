import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useState } from "react";
import PgMain from "./pages/PgMain";
import Profile from "./pages/PgProfile";
import Course from "./pages/PgCourse";
import CourseView from "./pages/PgCourseView";
import PgAuditorium from "./pages/PgAuditorium"; // <--- добавлено
import Auth from "./components/AuthRegister/Auth";
import Register from "./components/AuthRegister/Register";

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);

  const handleAuthOpen = (path = null) => {
    setRedirectPath(path);
    setIsAuthOpen(true);
  };

  const handleAuthClose = () => {
    setIsAuthOpen(false);
    setRedirectPath(null);
  };

const handleAuthSuccess = (navigate) => {
  if (redirectPath) {
    navigate(redirectPath); // Переход на сохраненный путь
  }
  handleAuthClose();
};


  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <PgMain 
              onAuthOpen={handleAuthOpen} 
              onRegisterOpen={() => setIsRegisterOpen(true)}
            />
          } 
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/course" element={<Course />} />
        <Route path="/course/:courseId" element={<CourseView />} />
        <Route path="/auditorium" element={<PgAuditorium />} /> {/* новый маршрут */}
      </Routes>

      {/* Модальные окна авторизации и регистрации */}
      <Auth 
        isOpen={isAuthOpen} 
        onClose={handleAuthClose} 
        onSuccess={handleAuthSuccess} 
      />
      <Register 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onAuthOpen={() => setIsAuthOpen(true)}
      />
    </BrowserRouter>
  );
}

export default App;
