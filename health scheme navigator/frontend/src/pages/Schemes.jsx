import { useEffect, useMemo, useState } from "react";

import {
  Search,
  ArrowRight,
  GraduationCap,
  HeartPulse,
  Tractor,
  Users,
  Briefcase,
  Home as HomeIcon,
  ClipboardList,
  LoaderCircle,
  ExternalLink,
} from "lucide-react";

import { getAllSchemes } from "../services/schemeService";
import SmartRecommendations from "../components/SmartRecommendations.jsx";

// ==========================================
// CATEGORY ICON
// ==========================================

const getCategoryIcon = (category) => {
  const value = String(category || "").toLowerCase();

  if (
    value.includes("student") ||
    value.includes("education")
  ) {
    return GraduationCap;
  }

  if (
    value.includes("farmer") ||
    value.includes("agriculture")
  ) {
    return Tractor;
  }

  if (
    value.includes("woman") ||
    value.includes("women")
  ) {
    return Users;
  }

  if (value.includes("senior")) {
    return Users;
  }

  if (
    value.includes("employment") ||
    value.includes("skill")
  ) {
    return Briefcase;
  }

  if (
    value.includes("health") ||
    value.includes("medical")
  ) {
    return HeartPulse;
  }

  if (
    value.includes("housing") ||
    value.includes("home")
  ) {
    return HomeIcon;
  }

  return ClipboardList;
};


// ==========================================
// COMPONENT
// ==========================================

function Schemes() {

  const [schemes, setSchemes] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================
  // FETCH ALL SCHEMES
  // ==========================================

  useEffect(() => {

    const fetchSchemes = async () => {

      try {

        setLoading(true);

        setError("");

        const data =
          await getAllSchemes();

        console.log(
          "All schemes received from backend:",
          data
        );

        setSchemes(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {

        console.error(
          "Failed to load schemes:",
          err
        );

        setError(
          "Unable to load government schemes. Please check whether the backend server is running."
        );

      } finally {

        setLoading(false);

      }

    };


    fetchSchemes();

  }, []);


  // ==========================================
  // GET UNIQUE CATEGORIES
  // ==========================================

  const categories = useMemo(() => {

    const uniqueCategories = [
      ...new Set(
        schemes
          .map(
            (scheme) =>
              scheme.category
          )
          .filter(Boolean)
      ),
    ];

    return [
      "All",
      ...uniqueCategories,
    ];

  }, [schemes]);


  // ==========================================
  // SEARCH + CATEGORY FILTER
  // ==========================================

  const filteredSchemes = useMemo(() => {

    const searchText =
      search
        .toLowerCase()
        .trim();


    return schemes.filter(
      (scheme) => {

        const matchesSearch =

          String(
            scheme.name || ""
          )
            .toLowerCase()
            .includes(searchText)

          ||

          String(
            scheme.description || ""
          )
            .toLowerCase()
            .includes(searchText)

          ||

          String(
            scheme.category || ""
          )
            .toLowerCase()
            .includes(searchText)

          ||

          (
            Array.isArray(
              scheme.tags
            )

            &&

            scheme.tags.some(
              (tag) =>
                String(tag)
                  .toLowerCase()
                  .includes(searchText)
            )
          );


        const matchesCategory =

          selectedCategory === "All"

          ||

          String(
            scheme.category || ""
          )
            .toLowerCase() ===
          selectedCategory.toLowerCase();


        return (
          matchesSearch &&
          matchesCategory
        );

      }
    );

  }, [
    schemes,
    search,
    selectedCategory,
  ]);


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="schemes-page">

        <section className="schemes-header">

          <span className="section-label">
            GOVERNMENT SCHEME DIRECTORY
          </span>

          <h1>
            Loading Government Schemes
          </h1>

          <p>
            Please wait while we load
            the latest schemes.
          </p>

          <div className="schemes-loading">

            <LoaderCircle
              size={40}
              className="loading-spinner"
            />

          </div>

        </section>

      </div>

    );

  }


  // ==========================================
  // ERROR
  // ==========================================

  if (error) {

    return (

      <div className="schemes-page">

        <section className="schemes-header">

          <span className="section-label">
            GOVERNMENT SCHEME DIRECTORY
          </span>

          <h1>
            Unable to Load Schemes
          </h1>

          <p>
            {error}
          </p>

          <button
            className="try-again-button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>

        </section>

      </div>

    );

  }


  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (

    <div className="schemes-page">


      {/* ==================================
          HEADER
      ================================== */}

      <section className="schemes-header">

        <span className="section-label">

          GOVERNMENT SCHEME DIRECTORY

        </span>


        <h1>

          Explore Government Schemes

        </h1>


        <p>

          Discover government schemes,
          benefits and opportunities
          available for citizens across India.

        </p>


        {/* SEARCH */}

        <div className="schemes-search">

          <Search size={22} />

          <input
            type="text"
            placeholder="Search schemes..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

      </section>

      {/* ==================================
          SMART RECOMMENDATIONS (AI)
      ================================== */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
        <SmartRecommendations />
      </section>

      {/* ==================================
          CATEGORY FILTER
      ================================== */}

      <section className="category-filter">

        {categories.map(
          (category) => (

            <button
              key={category}
              className={
                selectedCategory === category
                  ? "active-filter"
                  : ""
              }
              onClick={() =>
                setSelectedCategory(
                  category
                )
              }
            >

              {category}

            </button>

          )
        )}

      </section>



      {/* ==================================
          RESULTS
      ================================== */}

      <section className="schemes-results">

        <div className="results-header">

          <h2>

            {selectedCategory === "All"
              ? "All Schemes"
              : selectedCategory}

          </h2>


          <span>

            {filteredSchemes.length}{" "}

            {filteredSchemes.length === 1
              ? "scheme"
              : "schemes"}{" "}

            found

          </span>

        </div>



        {/* NO RESULTS */}

        {filteredSchemes.length === 0 ? (

          <div className="no-schemes">

            <Search size={45} />

            <h3>
              No Schemes Found
            </h3>

            <p>
              Try another search term
              or category.
            </p>

          </div>

        ) : (

          <div className="schemes-grid">

            {filteredSchemes.map(
              (scheme) => {

                const Icon =
                  getCategoryIcon(
                    scheme.category
                  );


                return (

                  <div
                    className="scheme-card"
                    key={
                      scheme._id ||
                      scheme.id
                    }
                  >


                    {/* CARD TOP */}

                    <div className="scheme-card-top">

                      <div className="scheme-icon">

                        <Icon size={25} />

                      </div>


                      <span>

                        {scheme.category ||
                          "Government"}

                      </span>

                    </div>



                    {/* NAME */}

                    <h3>

                      {scheme.name ||
                        "Government Scheme"}

                    </h3>



                    {/* DESCRIPTION */}

                    <p>

                      {scheme.description ||
                        "Government scheme providing support to eligible beneficiaries."}

                    </p>



                    {/* TAGS */}

                    {Array.isArray(
                      scheme.tags
                    ) &&
                    scheme.tags.length > 0 && (

                      <div className="scheme-tags">

                        {scheme.tags
                          .slice(0, 3)
                          .map(
                            (
                              tag,
                              index
                            ) => (

                              <span
                                key={index}
                              >

                                #{tag}

                              </span>

                            )
                          )}

                      </div>

                    )}



                    {/* OFFICIAL WEBSITE */}

                    {scheme.link ? (

                      <a
                        href={scheme.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-details"
                      >

                        Visit Official Website

                        <ExternalLink
                          size={17}
                        />

                      </a>

                    ) : (

                      <button
                        className="view-details disabled"
                        disabled
                      >

                        Official Website Unavailable

                      </button>

                    )}

                  </div>

                );

              }

            )}

          </div>

        )}

      </section>

    </div>

  );

}


export default Schemes;