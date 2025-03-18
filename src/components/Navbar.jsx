import "../styles/Navbar.css";

function Navbar() {

    return (
      <>
        <nav class="navbar">
            <div class="logo">OKUTUTOR <span class="logo-icon">📚</span></div>
            <ul class="nav-links">
                <li><a href="#" class="active">Home</a></li>
                <li><a href="#">find Tutor</a></li>
                <li><a href="#">for Tutors</a></li>
                <li><a href="#">About us</a></li>
            </ul>
            <div class="auth-buttons">
                <button class="login-btn">Log in</button>
                <button class="signup-btn">Sign up</button>
            </div>
            <div class="hamburger">&#9776;</div>
        </nav>
      </>
    )
  }
  
  export default Navbar
  