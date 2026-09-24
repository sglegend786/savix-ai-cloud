import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ExternalLink,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  LoaderCircle,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useContext } from "react";
import { getNewSchemes, getActiveSchemes } from "../services/schemeService";
import { AuthContext } from "../context/AuthContext";


// ==========================================
// API URL
// ==========================================

const API_URL = "/api/schemes/schemes";


// ==========================================
// HOME COMPONENT
// ==========================================

function Home() {
  const { user } = useContext(AuthContext);

  // ========================================
  // STATES
  // ========================================

  const [latestSchemes, setLatestSchemes] =
    useState([]);

  const [loadingLatest, setLoadingLatest] =
    useState(true);

  const [latestError, setLatestError] =
    useState("");


  // ========================================
  // FETCH NEW SCHEMES (visibleUntil filtered)
  // ========================================

  useEffect(() => {

    const fetchLatestSchemes = async () => {

      try {

        setLoadingLatest(true);

        setLatestError("");


        const response = await fetch(
          `${API_URL}/new`
        );


        if (!response.ok) {

          throw new Error(
            "Failed to fetch latest schemes"
          );

        }


        const result =
          await response.json();


        console.log(
          "Latest schemes received:",
          result
        );


        setLatestSchemes(
          Array.isArray(result.data)
            ? result.data
            : []
        );


      } catch (error) {

        console.error(
          "Error loading latest schemes:",
          error
        );


        setLatestError(
          "Unable to load latest schemes."
        );


      } finally {

        setLoadingLatest(false);

      }

    };


    fetchLatestSchemes();

  }, []);


  // ========================================
  // OPEN OFFICIAL WEBSITE
  // ========================================

  const handleSchemeClick = (scheme) => {

    if (scheme.link) {

      window.open(
        scheme.link,
        "_blank",
        "noopener,noreferrer"
      );

      return;

    }


    // If official link is unavailable,
    // open internal scheme details page

    window.location.href =
      `/scheme/${scheme._id}`;

  };


  // ========================================
  // DUPLICATE SCHEMES FOR INFINITE TICKER
  // ========================================

  const tickerSchemes = [
    ...latestSchemes,
    ...latestSchemes,
  ];


  return (

    <div className="home-page">

      {/* =================================
          NEW SCHEMES SECTION
      ================================== */}

      <section className="latest-schemes-ticker-section">


        {/* TICKER HEADER */}

        <div className="latest-ticker-label">

          <div className="latest-ticker-label-icon">

            <Bell size={17} />

          </div>


          <span>
            New Government Schemes
          </span>

        </div>



        {/* TICKER */}

        <div className="latest-schemes-ticker">


          {loadingLatest ? (

            <div className="ticker-loading">

              <LoaderCircle
                size={18}
                className="loading-spinner"
              />

              <span>
                Loading latest government schemes...
              </span>

            </div>

          ) : latestError ? (

            <div className="ticker-error">

              {latestError}

            </div>

          ) : latestSchemes.length === 0 ? (

            <div className="ticker-empty">

              No new government schemes available.

            </div>

          ) : (

            <div className="ticker-track">

                {tickerSchemes
                  .filter(scheme => {
                    if (!scheme.eligibility || scheme.eligibility.length === 0) return true;
                    if (!user || !user.gender) return true;
                    return scheme.eligibility.includes(user.gender.toLowerCase());
                  })
                  .map((scheme, index) => (

                  <button
                    key={`${scheme._id}-${index}`}
                    className="ticker-scheme-item"
                    onClick={() =>
                      handleSchemeClick(
                        scheme
                      )
                    }
                    title={
                      scheme.link
                        ? "Visit Official Website"
                        : "View Scheme Details"
                    }
                  >


                    <Sparkles
                      size={16}
                    />


                    <strong>

                      NEW:

                    </strong>


                    <span>

                      {scheme.name}

                    </span>


                    <span className="ticker-category">

                      {scheme.category &&
                        ` • ${scheme.category}`}

                    </span>


                    <ExternalLink
                      size={14}
                    />


                    <span className="ticker-separator">

                      ✦

                    </span>


                  </button>

                ))}

            </div>

          )}

        </div>

      </section>



      {/* ======================================
          HERO SECTION
      ======================================= */}

      <section className="home-hero">


        <div className="home-hero-content">


          <span className="home-badge">

            <Sparkles size={16} />

            Your Guide to Government Schemes

          </span>


          <h1>

            Discover Government Schemes

            <br />

            Made for <span>You</span>

          </h1>


          <p>

            Find the right government schemes,
            benefits and opportunities based on
            your needs, eligibility and category.

          </p>


          {/* HERO ACTIONS */}

          <div className="home-hero-actions">


            <Link
              to="/find-schemes"
              className="primary-home-button"
            >

              <Search size={19} />

              Find Schemes

              <ArrowRight size={18} />

            </Link>


            <Link
              to="/schemes"
              className="secondary-home-button"
            >

              Explore All Schemes

              <ArrowRight size={18} />

            </Link>


          </div>


        </div>



        {/* HERO VISUAL */}

        <div className="home-hero-visual">


          <div className="hero-floating-card hero-card-one">

            <CheckCircle2 size={20} />

            <div>

              <strong>
                Easy to Find
              </strong>

              <span>
                Search by category
              </span>

            </div>

          </div>



          <div className="hero-main-card">

            <div className="hero-main-icon">

              <ShieldCheck size={40} />

            </div>


            <h3>
              Government Schemes
            </h3>


            <p>
              Trusted information in one place.
            </p>


            <div className="hero-card-stats">

              <div>

                <strong>
                  100+
                </strong>

                <span>
                  Schemes
                </span>

              </div>


              <div>

                <strong>
                  7+
                </strong>

                <span>
                  Categories
                </span>

              </div>


              <div>

                <strong>
                  24/7
                </strong>

                <span>
                  Access
                </span>

              </div>

            </div>

          </div>



          <div className="hero-floating-card hero-card-two">

            <Users size={20} />

            <div>

              <strong>
                For Everyone
              </strong>

              <span>
                Citizens across India
              </span>

            </div>

          </div>


        </div>

      </section>



      {/* ======================================
          LATEST SCHEMES PREVIEW
      ======================================= */}

      {latestSchemes.length > 0 && (

        <section className="home-latest-section">


          <div className="home-section-heading">


            <div>

              <span className="section-label">

                LATEST UPDATES

              </span>


              <h2>

                Recently Added Schemes

              </h2>


              <p>

                Explore the latest government
                schemes added to SchemeSathi.

              </p>

            </div>


            <Link
              to="/schemes"
              className="view-all-schemes"
            >

              View All

              <ArrowRight size={17} />

            </Link>


          </div>



          <div className="home-latest-grid">

            {latestSchemes
              .slice(0, 4)
              .map((scheme) => (

                <div
                  className="home-latest-card"
                  key={scheme._id}
                >


                  <div className="latest-card-top">


                    <div className="latest-card-icon">

                      <Sparkles size={21} />

                    </div>


                    <span>

                      {scheme.category ||
                        "Government"}

                    </span>


                  </div>



                  <h3>

                    {scheme.name}

                  </h3>



                  <p>

                    {scheme.description ||
                      "New government scheme providing support to eligible beneficiaries."}

                  </p>



                  <button
                    className="latest-card-link"
                    onClick={() =>
                      handleSchemeClick(
                        scheme
                      )
                    }
                  >

                    {scheme.link
                      ? "Visit Official Website"
                      : "View Details"}

                    <ExternalLink
                      size={16}
                    />

                  </button>


                </div>

              ))}

          </div>

        </section>

      )}



      {/* ======================================
          WHY SCHEME SATHI
      ======================================= */}

      <section className="home-features-section">


        <div className="home-section-heading centered">

          <span className="section-label">

            WHY SCHEME SATHI

          </span>


          <h2>

            Everything You Need in One Place

          </h2>


          <p>

            Find and explore government schemes
            without searching through multiple websites.

          </p>

        </div>



        <div className="home-features-grid">


          <div className="home-feature-card">

            <div className="home-feature-icon">

              <Search size={25} />

            </div>


            <h3>

              Easy Discovery

            </h3>


            <p>

              Quickly search and discover schemes
              based on your needs.

            </p>

          </div>



          <div className="home-feature-card">

            <div className="home-feature-icon">

              <ShieldCheck size={25} />

            </div>


            <h3>

              Trusted Information

            </h3>


            <p>

              Get important scheme information
              and official links in one place.

            </p>

          </div>



          <div className="home-feature-card">

            <div className="home-feature-icon">

              <Users size={25} />

            </div>


            <h3>

              For Every Citizen

            </h3>


            <p>

              Explore schemes for students,
              farmers, women, senior citizens
              and more.

            </p>

          </div>


        </div>

      </section>


    </div>

  );

}


export default Home;
