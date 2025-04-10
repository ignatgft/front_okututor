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
        <HeroSection/>
        <Category/>
        <PopTutor/>
        <HowItWorks/>
        <ForTutors/>
        <Footer/>
      </>
    )
  }
  
  export default PgMain
  