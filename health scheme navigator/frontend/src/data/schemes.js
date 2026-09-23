import {
  GraduationCap,
  Tractor,
  Heart,
  Users,
  Home,
  Briefcase,
  Accessibility,
  Stethoscope,
} from "lucide-react";

const schemes = [
  {
    id: "student-scholarship",
    name: "Student Scholarship Support",
    category: "Students",
    icon: GraduationCap,

    level: "Central",

    description:
      "Financial assistance for eligible students to support their education.",

    benefits: [
      "Financial support for education",
      "Helps reduce education expenses",
      "Support for eligible students",
    ],

    eligibility: [
      "Applicant should be a student",
      "Applicant must satisfy applicable income criteria",
      "Additional eligibility conditions may apply",
    ],

    documents: [
      "Aadhaar Card",
      "Income Certificate",
      "Student ID",
      "Bank Account Details",
      "Passport Size Photograph",
    ],

    application:
      "Visit the official government portal and check the latest eligibility requirements before applying.",

    officialLink:
      "https://www.india.gov.in/",

    tags: [
      "student",
      "education",
      "scholarship",
    ],
  },


  {
    id: "farmer-assistance",
    name: "Farmer Financial Assistance",
    category: "Farmers",
    icon: Tractor,

    level: "Central",

    description:
      "Financial assistance and support for eligible farmers.",

    benefits: [
      "Financial assistance",
      "Support for agricultural activities",
      "Help improve farming livelihood",
    ],

    eligibility: [
      "Applicant should be an eligible farmer",
      "Applicant must satisfy applicable scheme conditions",
      "Additional conditions may apply",
    ],

    documents: [
      "Aadhaar Card",
      "Land Records",
      "Bank Account Details",
      "Income Certificate",
    ],

    application:
      "Visit the official government portal and check the latest application procedure.",

    officialLink:
      "https://www.india.gov.in/",

    tags: [
      "farmer",
      "agriculture",
      "kisan",
    ],
  },


  {
    id: "women-support",
    name: "Women Welfare Support",
    category: "Women",
    icon: Heart,

    level: "Central",

    description:
      "Support programs designed to assist eligible women.",

    benefits: [
      "Financial assistance",
      "Welfare support",
      "Support for eligible women",
    ],

    eligibility: [
      "Applicant should satisfy applicable eligibility criteria",
      "Income conditions may apply",
      "Additional scheme-specific conditions may apply",
    ],

    documents: [
      "Aadhaar Card",
      "Income Certificate",
      "Bank Account Details",
      "Address Proof",
    ],

    application:
      "Check the official government portal for the latest application information.",

    officialLink:
      "https://www.india.gov.in/",

    tags: [
      "women",
      "female",
      "welfare",
    ],
  },


  {
    id: "senior-citizen-support",
    name: "Senior Citizen Welfare",
    category: "Senior Citizens",
    icon: Users,

    level: "Central",

    description:
      "Welfare and support programs for eligible senior citizens.",

    benefits: [
      "Support for senior citizens",
      "Welfare assistance",
      "Financial and social support",
    ],

    eligibility: [
      "Applicant must meet applicable age criteria",
      "Applicant must satisfy scheme-specific requirements",
      "Additional conditions may apply",
    ],

    documents: [
      "Aadhaar Card",
      "Age Proof",
      "Address Proof",
      "Bank Account Details",
    ],

    application:
      "Visit the official government portal to check the latest application procedure.",

    officialLink:
      "https://www.india.gov.in/",

    tags: [
      "senior",
      "elderly",
      "old age",
    ],
  },


  {
    id: "housing-support",
    name: "Housing Support",
    category: "Housing",
    icon: Home,

    level: "Central",

    description:
      "Housing assistance programs for eligible individuals and families.",

    benefits: [
      "Housing assistance",
      "Support for eligible families",
      "Help with housing needs",
    ],

    eligibility: [
      "Applicant must satisfy applicable housing criteria",
      "Income and family conditions may apply",
      "Additional conditions may vary",
    ],

    documents: [
      "Aadhaar Card",
      "Income Certificate",
      "Address Proof",
      "Bank Account Details",
    ],

    application:
      "Check the official government portal for current application details.",

    officialLink:
      "https://www.india.gov.in/",

    tags: [
      "housing",
      "home",
      "house",
    ],
  },


  {
    id: "employment-support",
    name: "Employment Support",
    category: "Employment",
    icon: Briefcase,

    level: "Central",

    description:
      "Employment and skill development support for eligible individuals.",

    benefits: [
      "Employment opportunities",
      "Skill development support",
      "Career assistance",
    ],

    eligibility: [
      "Applicant must satisfy applicable employment criteria",
      "Age and qualification conditions may apply",
      "Additional conditions may vary",
    ],

    documents: [
      "Aadhaar Card",
      "Educational Certificates",
      "Address Proof",
      "Bank Account Details",
    ],

    application:
      "Visit the official government portal and verify the latest application process.",

    officialLink:
      "https://www.india.gov.in/",

    tags: [
      "job",
      "employment",
      "skill",
    ],
  },


  {
    id: "disability-support",
    name: "Disability Support",
    category: "Persons with Disabilities",
    icon: Accessibility,

    level: "Central",

    description:
      "Support programs for eligible persons with disabilities.",

    benefits: [
      "Financial assistance",
      "Accessibility support",
      "Welfare assistance",
    ],

    eligibility: [
      "Applicant must meet applicable disability criteria",
      "Valid disability documentation may be required",
      "Additional conditions may apply",
    ],

    documents: [
      "Aadhaar Card",
      "Disability Certificate",
      "Income Certificate",
      "Bank Account Details",
    ],

    application:
      "Check the official government portal for the latest eligibility and application process.",

    officialLink:
      "https://www.india.gov.in/",

    tags: [
      "disability",
      "pwd",
      "divyang",
    ],
  },


  {
    id: "health-support",
    name: "Health Support",
    category: "Healthcare",
    icon: Stethoscope,

    level: "Central",

    description:
      "Healthcare assistance programs for eligible individuals and families.",

    benefits: [
      "Healthcare support",
      "Medical assistance",
      "Support for eligible families",
    ],

    eligibility: [
      "Eligibility depends on the applicable scheme",
      "Income and family conditions may apply",
      "Additional requirements may apply",
    ],

    documents: [
      "Aadhaar Card",
      "Address Proof",
      "Income Certificate",
      "Other applicable documents",
    ],

    application:
      "Visit the official government portal and verify the current eligibility requirements.",

    officialLink:
      "https://www.india.gov.in/",

   tags: [
  "student",
  "education",
  "scholarship",
], 
  },
];

export default schemes;