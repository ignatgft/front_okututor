import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { scroller } from "react-scroll";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HomeSection/HeroSection";
import Category from "../components/HomeSection/Category";
import PopTutor from "../components/HomeSection/PopTutor";
import HowItWorks from "../components/HomeSection/HowItWorks";
import ForTutors from "../components/HomeSection/ForTutors";
import Footer from "../components/HomeSection/Footer";
import Auth from "../components/AuthRegister/Auth";
import Register from "../components/AuthRegister/Register";

function PgMain() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const location = useLocation();

  const openRegisterFromAuth = () => {
    setIsAuthOpen(false);
    setIsRegisterOpen(true);
  };

  const openAuthFromRegister = () => {
    setIsRegisterOpen(false);
    setIsAuthOpen(true);
  };

  useEffect(() => {
    if (location.state?.target) {
      scroller.scrollTo(location.state.target, {
        smooth: true,
        duration: 500,
      });
    }
  }, [location.state]);

  return (
    <>
      <Navbar
        onLogin={() => setIsAuthOpen(true)}
        onSignup={() => setIsRegisterOpen(true)}
      />

      <section id="hero">
        <HeroSection />
      </section>

      <section id="category">
        <Category />
      </section>

      <section id="find-tutor">
        <PopTutor />
      </section>

      <HowItWorks />

      <section id="for-tutors">
        {/* Передаем onLogin в ForTutors */}
        <ForTutors onLogin={() => setIsAuthOpen(true)} />
      </section>

      <section id="about-us">
        <Footer />
      </section>

      {/* Секция для модального окна авторизации */}
      <section id="auth" className="inter">
        <Auth
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onOpenRegister={openRegisterFromAuth}
        />
      </section>

      {/* Секция для модального окна регистрации */}
      <section id="register" className="inter">
        <Register
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onOpenAuth={openAuthFromRegister}
        />
      </section>
    </>
  );
}

export default PgMain;
