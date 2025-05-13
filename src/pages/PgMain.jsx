import Navbar from "../components/Navbar";
import HeroSection from "../components/HomeSection/HeroSection";
import Category from "../components/HomeSection/Category";
import PopTutor from "../components/HomeSection/PopTutor";
import HowItWorks from "../components/HomeSection/HowItWorks";
import ForTutors from "../components/HomeSection/ForTutors";
import Footer from "../components/HomeSection/Footer";

const PgMain = ({ onAuthOpen, onRegisterOpen }) => {
  return (
    <>
      <Navbar onLogin={() => onAuthOpen()} onSignup={onRegisterOpen} />

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
        <ForTutors onAuthOpen={onAuthOpen} />
      </section>

      <section id="about-us">
        <Footer />
      </section>
    </>
  );
};

export default PgMain;
