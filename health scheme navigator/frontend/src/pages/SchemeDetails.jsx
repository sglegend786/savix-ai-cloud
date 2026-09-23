import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  ExternalLink,
  ClipboardList,
  Gift,
  Info,
  Sparkles,
  X,
} from "lucide-react";

import { getSchemeById } from "../services/schemeService";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import axios from "axios";


function SchemeDetails() {

  // ==========================================
  // GET ID FROM URL
  // Example:
  // /scheme/6a6d9cca8a3f89ee4e047692
  // ==========================================

  const { id } = useParams();


  // ==========================================
  // STATE
  // ==========================================

  const { token } = useContext(AuthContext);
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [aiEligibility, setAiEligibility] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const checkAiEligibility = async () => {
    if (!token) return;
    setAiLoading(true);
    try {
      const res = await axios.post(`/api/ai/eligibility/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiEligibility(res.data.data);
    } catch (err) {
      console.error("AI Eligibility check failed", err);
    } finally {
      setAiLoading(false);
    }
  };


  // ==========================================
  // FETCH SCHEME FROM BACKEND
  // ==========================================

  useEffect(() => {

    const fetchScheme = async () => {

      try {

        setLoading(true);

        setError("");

        // DEBUG: Check URL ID
        console.log(
          "Scheme ID from URL:",
          id
        );


        // Fetch scheme from backend
        const data =
          await getSchemeById(id);


        // DEBUG: Check backend response
        console.log(
          "Scheme data received from backend:",
          data
        );


        // Check if backend returned data
        if (!data) {

          throw new Error(
            "Scheme data not found"
          );

        }


        // Store scheme data
        setScheme(data);


      } catch (err) {

        console.error(
          "Failed to load scheme:",
          err
        );


        setError(
          "Unable to load this government scheme."
        );


        setScheme(null);


      } finally {

        setLoading(false);

      }

    };


    // Only fetch if ID exists
    if (id) {

      fetchScheme();

    } else {

      console.error(
        "No scheme ID found in URL"
      );

      setError(
        "Invalid scheme ID."
      );

      setLoading(false);

    }

  }, [id]);


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="scheme-not-found">

        <div className="not-found-icon">

          <Info size={35} />

        </div>


        <h1>
          Loading Scheme...
        </h1>


        <p>

          Please wait while we load
          the scheme details.

        </p>

      </div>

    );

  }


  // ==========================================
  // ERROR / NOT FOUND
  // ==========================================

  if (error || !scheme) {

    return (

      <div className="scheme-not-found">

        <div className="not-found-icon">

          <Info size={35} />

        </div>


        <h1>
          Scheme Not Found
        </h1>


        <p>

          {error ||
            "Sorry, we couldn't find the government scheme you are looking for."}

        </p>


        <Link
          to="/categories"
          className="back-home-button"
        >

          <ArrowLeft size={18} />

          Back to Categories

        </Link>

      </div>

    );

  }


  // ==========================================
  // SCHEME DETAILS PAGE
  // ==========================================

  return (

    <div className="scheme-details-page">


      {/* =================================
          HERO
      ================================== */}

      <section className="scheme-details-hero">

        <div className="scheme-hero-container">


          {/* BACK BUTTON */}

          <Link
            to="/categories"
            className="scheme-back-button"
          >

            <ArrowLeft size={18} />

            Back to Categories

          </Link>


          {/* SCHEME HEADER */}

          <div className="scheme-header">


            <div className="scheme-header-icon">

              <ClipboardList size={38} />

            </div>


            <div className="scheme-header-content">


              <span className="scheme-category-badge">

                {scheme.category ||
                  "Government Scheme"}

              </span>


              <h1>

                {scheme.name}

              </h1>


              <p>

                {scheme.description ||
                  "Government support scheme designed to provide assistance to eligible beneficiaries."}

              </p>


            </div>

          </div>

        </div>

      </section>



      {/* =================================
          MAIN CONTENT
      ================================== */}

      <main className="scheme-details-container">


        {/* =================================
            LEFT CONTENT
        ================================== */}

        <div className="scheme-main-content">


          {/* ABOUT */}

          <section className="scheme-detail-card">


            <div className="scheme-card-title">


              <div className="scheme-title-icon">

                <Info size={21} />

              </div>


              <h2>

                About This Scheme

              </h2>


            </div>


            <p>

              {scheme.about ||
                scheme.description ||
                "Information about this scheme is available on the official government portal."}

            </p>


          </section>



          {/* BENEFITS */}

          <section className="scheme-detail-card">


            <div className="scheme-card-title">


              <div className="scheme-title-icon">

                <Gift size={21} />

              </div>


              <h2>

                Key Benefits

              </h2>


            </div>


            {Array.isArray(scheme.benefits) &&
            scheme.benefits.length > 0 ? (

              <div className="scheme-benefits-list">


                {scheme.benefits.map(
                  (benefit, index) => (

                    <div
                      className="scheme-benefit-item"
                      key={index}
                    >

                      <CheckCircle2 size={18} />

                      <span>

                        {benefit}

                      </span>

                    </div>

                  )
                )}


              </div>

            ) : (

              <p>

                Benefits information is available
                on the official government portal.

              </p>

            )}


          </section>



          {/* ELIGIBILITY */}

          <section className="scheme-detail-card">


            <div className="scheme-card-title">


              <div className="scheme-title-icon">

                <CheckCircle2 size={21} />

              </div>


              <h2>

                Eligibility

              </h2>


            </div>


            {Array.isArray(scheme.eligibility) &&
            scheme.eligibility.length > 0 ? (

              <div className="scheme-eligibility-list">


                {scheme.eligibility.map(
                  (item, index) => (

                    <div
                      className="scheme-eligibility-item"
                      key={index}
                    >

                      <CheckCircle2 size={17} />

                      <span>

                        {item}

                      </span>

                    </div>

                  )
                )}


              </div>

            ) : (

              <p>

                Please visit the official government
                website for complete eligibility details.

              </p>

            )}


          </section>



          {/* DOCUMENTS */}

          <section className="scheme-detail-card">


            <div className="scheme-card-title">


              <div className="scheme-title-icon">

                <FileText size={21} />

              </div>


              <h2>

                Documents Required

              </h2>


            </div>


            {Array.isArray(scheme.documents) &&
            scheme.documents.length > 0 ? (

              <div className="scheme-documents-grid">


                {scheme.documents.map(
                  (document, index) => (

                    <div
                      className="scheme-document-item"
                      key={index}
                    >

                      <FileText size={17} />

                      <span>

                        {document}

                      </span>

                    </div>

                  )
                )}


              </div>

            ) : (

              <p>

                Required documents depend on the
                scheme and applicant.

              </p>

            )}


          </section>



          {/* HOW TO APPLY */}

          <section className="scheme-detail-card">


            <div className="scheme-card-title">


              <div className="scheme-title-icon">

                <ClipboardList size={21} />

              </div>


              <h2>

                How to Apply

              </h2>


            </div>


            {Array.isArray(scheme.howToApply) &&
            scheme.howToApply.length > 0 ? (

              <div className="scheme-steps">


                {scheme.howToApply.map(
                  (step, index) => (

                    <div
                      className="scheme-step"
                      key={index}
                    >


                      <div className="scheme-step-number">

                        {index + 1}

                      </div>


                      <div className="scheme-step-content">


                        <h3>

                          Step {index + 1}

                        </h3>


                        <p>

                          {step}

                        </p>


                      </div>


                    </div>

                  )
                )}


              </div>

            ) : (

              <p>

                Please visit the official government
                portal for application instructions.

              </p>

            )}


          </section>


        </div>



        {/* =================================
            RIGHT SIDEBAR
        ================================== */}

        <aside className="scheme-sidebar">

          {/* AI ELIGIBILITY ADVISOR */}
          <div className="scheme-apply-card ai-advisor-card" style={{ marginBottom: '24px', border: '1px solid #3f7c54', background: '#f0f8f2' }}>
            <div className="apply-card-icon" style={{ background: '#3f7c54', color: 'white' }}>
              <Sparkles size={22} />
            </div>
            <h2 style={{ color: '#17221b' }}>AI Eligibility Advisor</h2>
            
            {!aiEligibility && !aiLoading && (
              <>
                <p>Check if you are eligible for this scheme based on your profile instantly.</p>
                <button 
                  onClick={checkAiEligibility}
                  className="official-website-button" 
                  style={{ background: '#3f7c54', border: 'none' }}
                >
                  Check Eligibility
                </button>
              </>
            )}

            {aiLoading && (
              <p style={{ fontStyle: 'italic', color: '#6b8071' }}>Analyzing your profile...</p>
            )}

            {aiEligibility && (
              <div className="ai-result" style={{ marginTop: '16px', textAlign: 'left' }}>
                <h3 style={{ color: aiEligibility.eligible ? '#3f7c54' : '#e74c3c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {aiEligibility.eligible ? <CheckCircle2 size={18}/> : <X size={18}/>}
                  {aiEligibility.eligible ? 'You are Eligible!' : 'Not Eligible'}
                </h3>
                <p style={{ marginTop: '8px', fontSize: '14px', lineHeight: '1.5', color: '#17221b' }}>
                  {aiEligibility.reason}
                </p>
                {aiEligibility.missingDocuments && aiEligibility.missingDocuments.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <strong style={{ fontSize: '13px' }}>Missing Documents:</strong>
                    <ul style={{ paddingLeft: '20px', marginTop: '4px', fontSize: '13px', color: '#e74c3c' }}>
                      {aiEligibility.missingDocuments.map((doc, idx) => <li key={idx}>{doc}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>


          {/* APPLY CARD */}

          <div className="scheme-apply-card">


            <div className="apply-card-icon">

              <ExternalLink size={22} />

            </div>


            <h2>

              Interested in this Scheme?

            </h2>


            <p>

              Visit the official government website
              to check the latest information and
              apply for this scheme.

            </p>


            {scheme.link ? (

              <a
                href={scheme.link}
                target="_blank"
                rel="noopener noreferrer"
                className="official-website-button"
              >

                Visit Official Website

                <ExternalLink size={17} />

              </a>

            ) : (

              <button
                className="official-website-button disabled"
                disabled
              >

                Official Link Coming Soon

              </button>

            )}


            <div className="official-warning">


              <CheckCircle2 size={16} />


              <span>

                Always verify the latest information
                on the official government portal.

              </span>


            </div>


          </div>



          {/* QUICK INFO */}

          <div className="scheme-quick-info">


            <h3>

              Scheme Information

            </h3>


            <div className="quick-info-item">


              <span>

                Category

              </span>


              <strong>

                {scheme.category ||
                  "Government"}

              </strong>


            </div>


            {scheme.department && (

              <div className="quick-info-item">


                <span>

                  Department

                </span>


                <strong>

                  {scheme.department}

                </strong>


              </div>

            )}


            {scheme.source && (

              <div className="quick-info-item">


                <span>

                  Source

                </span>


                <strong>

                  {scheme.source}

                </strong>


              </div>

            )}


          </div>


        </aside>


      </main>


    </div>

  );

}


export default SchemeDetails;