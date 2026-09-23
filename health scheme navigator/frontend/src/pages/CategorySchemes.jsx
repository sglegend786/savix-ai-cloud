import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ExternalLink,
  Search,
  LoaderCircle,
  ClipboardList,
} from "lucide-react";

import { getAllSchemes } from "../services/schemeService";


// ==========================================
// CATEGORY NORMALIZER
// ==========================================

const normalizeCategory = (value) => {

  const category =
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ");


  const categoryMap = {

    farmer: "farmers",
    farmers: "farmers",

    student: "students",
    students: "students",

    woman: "women",
    women: "women",

    senior: "senior citizens",
    "senior citizen":
      "senior citizens",
    "senior citizens":
      "senior citizens",

    employment: "employment",

    healthcare: "healthcare",
    health: "healthcare",
    "health care": "healthcare",

    housing: "housing",
    home: "housing",

    disability:
      "persons with disabilities",

    disabilities:
      "persons with disabilities",

    "person with disability":
      "persons with disabilities",

    "persons with disability":
      "persons with disabilities",

    "persons with disabilities":
      "persons with disabilities",

  };


  return (
    categoryMap[category] ||
    category
  );

};


// ==========================================
// COMPONENT
// ==========================================

function CategorySchemes() {

  const { tag } = useParams();


  const [schemes, setSchemes] =
    useState([]);


  const [search, setSearch] =
    useState("");


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  // ==========================================
  // SELECTED CATEGORY
  // ==========================================

  const selectedCategory = useMemo(
    () => {

      return normalizeCategory(
        tag
      );

    },
    [tag]
  );


  // ==========================================
  // DISPLAY CATEGORY NAME
  // ==========================================

  const displayCategory =
    selectedCategory
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");


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
          "All schemes received:",
          data
        );


        setSchemes(
          Array.isArray(data)
            ? data
            : []
        );


      } catch (err) {

        console.error(
          "Failed to load category schemes:",
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
  // FILTER CATEGORY + SEARCH
  // ==========================================

  const filteredSchemes =
    useMemo(() => {

      const searchText =
        search
          .toLowerCase()
          .trim();


      return schemes.filter(
        (scheme) => {


          // -------------------------------
          // SCHEME CATEGORY
          // -------------------------------

          const schemeCategory =
            normalizeCategory(
              scheme.category
            );


          // -------------------------------
          // CATEGORY MATCH
          // -------------------------------

          const categoryMatch =

            schemeCategory ===
            selectedCategory;


          // -------------------------------
          // SEARCH
          // -------------------------------

          const nameMatch =

            String(
              scheme.name || ""
            )
              .toLowerCase()
              .includes(
                searchText
              );


          const descriptionMatch =

            String(
              scheme.description || ""
            )
              .toLowerCase()
              .includes(
                searchText
              );


          const tagsMatch =

            Array.isArray(
              scheme.tags
            )

            &&

            scheme.tags.some(
              (tag) =>
                String(tag)
                  .toLowerCase()
                  .includes(
                    searchText
                  )
            );


          const searchMatch =

            searchText === ""

            ||

            nameMatch

            ||

            descriptionMatch

            ||

            tagsMatch;


          return (

            categoryMatch

            &&

            searchMatch

          );

        }
      );

    },
    [
      schemes,
      selectedCategory,
      search,
    ]
  );


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="category-schemes-page">

        <section className="category-schemes-header">

          <div className="category-header-content">

            <Link
              to="/categories"
              className="category-back-link"
            >

              <ArrowLeft size={18} />

              Back to Categories

            </Link>


            <span className="section-label">

              GOVERNMENT SCHEME CATEGORY

            </span>


            <h1>

              {displayCategory}

            </h1>


            <p>

              Explore government schemes
              available under the{" "}

              <strong>
                {displayCategory}
              </strong>{" "}

              category.

            </p>


            <div className="category-search">

              <Search size={22} />

              <input
                type="text"
                placeholder="Search schemes in this category..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

        </section>


        <section className="category-schemes-results">

          <div className="category-loading">

            <LoaderCircle
              size={42}
              className="loading-spinner"
            />

            <h3>
              Loading Schemes...
            </h3>

            <p>
              Please wait while we fetch
              schemes for this category.
            </p>

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

      <div className="category-schemes-page">

        <section className="category-schemes-results">

          <div className="category-error">

            <ClipboardList
              size={45}
            />

            <h2>
              Unable to Load Schemes
            </h2>

            <p>
              {error}
            </p>


            <button
              onClick={() =>
                window.location.reload()
              }
              className="try-again-button"
            >

              Try Again

            </button>

          </div>

        </section>

      </div>

    );

  }


  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (

    <div className="category-schemes-page">


      {/* =====================================
          HEADER
      ====================================== */}

      <section className="category-schemes-header">

        <div className="category-header-content">


          {/* BACK */}

          <Link
            to="/categories"
            className="category-back-link"
          >

            <ArrowLeft size={18} />

            Back to Categories

          </Link>


          {/* LABEL */}

          <span className="section-label">

            GOVERNMENT SCHEME CATEGORY

          </span>


          {/* CATEGORY */}

          <h1>

            {displayCategory}

          </h1>


          {/* DESCRIPTION */}

          <p>

            Explore government schemes
            available under the{" "}

            <strong>
              {displayCategory}
            </strong>{" "}

            category.

          </p>


          {/* SEARCH */}

          <div className="category-search">

            <Search size={22} />

            <input
              type="text"
              placeholder="Search schemes in this category..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

        </div>

      </section>



      {/* =====================================
          RESULTS
      ====================================== */}

      <section className="category-schemes-results">


        {/* RESULTS HEADER */}

        <div className="category-results-header">

          <h2>

            {displayCategory} Schemes

          </h2>


          <span>

            {filteredSchemes.length}{" "}

            {filteredSchemes.length === 1
              ? "scheme"
              : "schemes"}{" "}

            found

          </span>

        </div>



        {/* =================================
            NO RESULTS
        ================================== */}

        {filteredSchemes.length === 0 ? (

          <div className="category-no-schemes">

            <Search size={48} />


            <h3>

              No Schemes Found

            </h3>


            <p>

              {search

                ? `No schemes found matching "${search}" in the ${displayCategory} category.`

                : `No government schemes were found in the ${displayCategory} category.`

              }

            </p>


            {search && (

              <button
                className="clear-search-button"
                onClick={() =>
                  setSearch("")
                }
              >

                Clear Search

              </button>

            )}

          </div>

        ) : (


          /* =================================
              SCHEME GRID
          ================================== */

          <div className="category-schemes-grid">

            {filteredSchemes.map(
              (scheme) => {

                const schemeId =
                  scheme._id ||
                  scheme.id;


                return (

                  <div
                    className="category-scheme-card"
                    key={schemeId}
                  >


                    {/* CARD TOP */}

                    <div className="category-scheme-card-top">

                      <div className="category-scheme-icon">

                        <ClipboardList
                          size={25}
                        />

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

                      <div className="category-scheme-tags">

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
                        className="category-view-details"
                      >

                        Visit Official Website

                        <ExternalLink
                          size={17}
                        />

                      </a>

                    ) : (

                      <button
                        className="category-view-details disabled"
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


export default CategorySchemes;