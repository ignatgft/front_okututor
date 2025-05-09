import Navbar from "../components/Navbar"
import HeroSection from "../components/HomeSection/HeroSection"
import Category from "../components/HomeSection/Category"
import PopTutor from "../components/HomeSection/PopTutor"
import HowItWorks from "../components/HomeSection/HowItWorks"
import ForTutors from "../components/HomeSection/ForTutors"
import Footer from "../components/HomeSection/Footer"

function PgMain() {

    return (
      <>
        <Navbar/>
        <section id="hero">
          <HeroSection/>
        </section>
        <section id="category">
          <Category/>
        </section>
        <section id="find-tutor">
          <PopTutor/>
        </section>
        <HowItWorks/>
        <section id="for-tutors">
          <ForTutors/>
        </section>
        <section id="about-us">
          <Footer/>
        </section>
      </>
    )
  }
  
  export default PgMain
  