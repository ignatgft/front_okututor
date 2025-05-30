import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { scroller } from "react-scroll";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
        <HeroSection onLogin={() => setIsAuthOpen(true)}/>
      </section>

      <section id="category">
        <Category onLogin={() => setIsAuthOpen(true)}/>
      </section>

      <section id="find-tutor">
        <PopTutor />
      </section>

      <HowItWorks />

      <section id="for-tutors">
        <ForTutors onLogin={() => setIsAuthOpen(true)} />
      </section>

      <section id="about-us">
        <Footer />
      </section>

      {/* Auth Modal */}
      <section id="auth" className="inter">
        <Auth
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onOpenRegister={openRegisterFromAuth}
        />
      </section>

      {/* Register Modal */}
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
