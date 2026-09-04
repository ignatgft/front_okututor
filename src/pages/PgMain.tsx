// migrated to TSX — minimal strict types (controlled)
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { scroller } from "react-scroll";

import Navbar from "../components/Navbar";
import HeroSection from "../components/HomeSection/HeroSection";
import Category from "../components/HomeSection/Category";
import PopTutor from "../components/HomeSection/PopTutor";
import HowItWorks from "../components/HomeSection/HowItWorks";
import ForTutors from "../components/HomeSection/ForTutors";
import Footer from "../components/HomeSection/Footer";

function PgMain() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.target) {
      scroller.scrollTo(location.state.target, {
        smooth: true,
        duration: 500,
      });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  return (
    <>
      <Navbar />

      <main id="main-content">
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
          <ForTutors />
        </section>

        <section id="about-us">
          <Footer />
        </section>
      </main>
    </>
  );
}

export default PgMain;