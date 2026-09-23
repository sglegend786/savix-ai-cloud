import { Link } from "react-router-dom";
import {
  GraduationCap,
  Tractor,
  Heart,
  Users,
  Home,
  Briefcase,
  Accessibility,
  Stethoscope,
  ArrowRight,
} from "lucide-react";

import schemes from "../data/schemes";

const categories = [
  {
    name: "Students",
    icon: GraduationCap,
    tag: "student",
    description:
      "Scholarships, education support and student welfare schemes.",
  },
  {
    name: "Farmers",
    icon: Tractor,
    tag: "farmer",
    description:
      "Agriculture, farming and financial support schemes.",
  },
  {
    name: "Women",
    icon: Heart,
    tag: "women",
    description:
      "Women welfare, financial assistance and support schemes.",
  },
  {
    name: "Senior Citizens",
    icon: Users,
    tag: "senior",
    description:
      "Welfare and support schemes for senior citizens.",
  },
  {
    name: "Housing",
    icon: Home,
    tag: "housing",
    description:
      "Housing and home assistance schemes.",
  },
  {
    name: "Employment",
    icon: Briefcase,
    tag: "employment",
    description:
      "Employment, jobs and skill development schemes.",
  },
  {
    name: "Persons with Disabilities",
    icon: Accessibility,
    tag: "disability",
    description:
      "Support and welfare schemes for persons with disabilities.",
  },
  {
    name: "Healthcare",
    icon: Stethoscope,
    tag: "health",
    description:
      "Healthcare and medical assistance schemes.",
  },
];

function Categories() {
  return (
    <div className="categories-page">

      {/* HERO */}

      <section className="categories-hero">

        <span className="section-label">
          EXPLORE GOVERNMENT SCHEMES
        </span>

        <h1>
          Find Schemes by Category
        </h1>

        <p>
          Explore government schemes based on your needs,
          profession and eligibility.
        </p>

      </section>


      {/* CATEGORIES */}

      <section className="categories-section">

        <div className="categories-grid">

          {categories.map((category) => {

            const Icon = category.icon;

            const categorySchemes =
              schemes.filter((scheme) =>
                scheme.tags?.includes(category.tag)
              );

            return (

              <Link
                key={category.tag}
                to={`/categories/${category.tag}`}
                className="category-card"
              >

                <div className="category-icon">

                  <Icon size={28} />

                </div>


                <div className="category-content">

                  <h2>
                    {category.name}
                  </h2>

                  <p>
                    {category.description}
                  </p>

                  <span className="scheme-count">

                    {categorySchemes.length}{" "}

                    {categorySchemes.length === 1
                      ? "Scheme"
                      : "Schemes"}

                  </span>

                </div>


                <ArrowRight
                  className="category-arrow"
                  size={20}
                />

              </Link>

            );

          })}

        </div>

      </section>

    </div>
  );
}

export default Categories;