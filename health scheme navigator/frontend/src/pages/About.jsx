import { Link } from "react-router-dom";
import {
  Search,
  ShieldCheck,
  Users,
  Bell,
  ArrowRight
} from "lucide-react";

function About() {
  return (
    <div className="about-page">

      {/* HERO */}

      <section className="about-hero">

        <span className="section-label">
          ABOUT SCHEMESATHI
        </span>

        <h1>
          Making Government Schemes
          <span>Easy to Discover</span>
        </h1>

        <p>
          SchemeSathi is designed to make it easier for
          citizens to discover government schemes and
          benefits that may be relevant to them.
        </p>

      </section>


      {/* MISSION */}

      <section className="about-mission">

        <div className="about-mission-text">

          <span className="section-label">
            OUR MISSION
          </span>

          <h2>
            One Platform.
            <br />
            Easier Access.
          </h2>

          <p>
            Government schemes and welfare programs are
            often available across different departments,
            websites and portals.
          </p>

          <p>
            SchemeSathi aims to simplify the discovery
            process by bringing relevant scheme information
            together in one easy-to-use platform.
          </p>

        </div>


        <div className="mission-card">

          <Search size={40} />

          <h3>
            Discover Better
          </h3>

          <p>
            Search and explore schemes based on
            your needs and category.
          </p>

        </div>

      </section>


      {/* HOW IT WORKS */}

      <section className="how-section">

        <div className="about-section-heading">

          <span className="section-label">
            HOW IT WORKS
          </span>

          <h2>
            Finding Schemes Made Simple
          </h2>

          <p>
            SchemeSathi is designed around a simple
            three-step discovery experience.
          </p>

        </div>


        <div className="how-grid">


          <div className="how-card">

            <div className="how-number">
              01
            </div>

            <Search size={28} />

            <h3>
              Discover
            </h3>

            <p>
              Search and browse government schemes
              by category or keyword.
            </p>

          </div>


          <div className="how-card">

            <div className="how-number">
              02
            </div>

            <Users size={28} />

            <h3>
              Find What Fits
            </h3>

            <p>
              Explore schemes based on your personal
              needs and eligibility.
            </p>

          </div>


          <div className="how-card">

            <div className="how-number">
              03
            </div>

            <ShieldCheck size={28} />

            <h3>
              Verify & Apply
            </h3>

            <p>
              Check official government information
              before applying.
            </p>

          </div>

        </div>

      </section>


      {/* FEATURES */}

      <section className="about-features">

        <div className="about-section-heading">

          <span className="section-label">
            OUR APPROACH
          </span>

          <h2>
            Built Around Your Needs
          </h2>

        </div>


        <div className="feature-grid">


          <div className="about-feature-card">

            <div className="about-feature-icon">
              <Search size={24} />
            </div>

            <h3>
              Easy Discovery
            </h3>

            <p>
              Find relevant government schemes
              without searching multiple websites.
            </p>

          </div>


          <div className="about-feature-card">

            <div className="about-feature-icon">
              <ShieldCheck size={24} />
            </div>

            <h3>
              Information First
            </h3>

            <p>
              Understand eligibility, benefits and
              required documents in one place.
            </p>

          </div>


          <div className="about-feature-card">

            <div className="about-feature-icon">
              <Bell size={24} />
            </div>

            <h3>
              Stay Informed
            </h3>

            <p>
              Discover new schemes and opportunities
              that may be relevant to you.
            </p>

          </div>

        </div>

      </section>


      {/* DISCLAIMER */}

      <section className="about-disclaimer">

        <ShieldCheck size={32} />

        <div>

          <h3>
            Important Information
          </h3>

          <p>
            SchemeSathi is intended to help users discover
            and understand government schemes. Information
            may change over time. Always verify the latest
            eligibility requirements, deadlines and application
            process on the official government website before
            applying.
          </p>

        </div>

      </section>


      {/* CTA */}

      <section className="about-cta">

        <h2>
          Ready to Find Your Schemes?
        </h2>

        <p>
          Explore government schemes or discover
          opportunities that may be relevant to you.
        </p>

        <div className="about-cta-buttons">

          <Link
            to="/schemes"
            className="cta-button"
          >
            Explore Schemes
            <ArrowRight size={18} />
          </Link>

          <Link
            to="/find-schemes"
            className="about-secondary-button"
          >
            Find My Schemes
          </Link>

        </div>

      </section>

    </div>
  );
}

export default About;