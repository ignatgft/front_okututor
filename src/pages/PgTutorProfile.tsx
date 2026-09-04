// migrated to TSX — minimal strict types (controlled)
import PgTutorProfileContent from "../components/TutorProfileContent";
import Navbar from "../components/Navbar";

function PgTutorProfile() {
  return (
    <>
      <Navbar />
      <PgTutorProfileContent />
    </>
  );
}

export default PgTutorProfile;
