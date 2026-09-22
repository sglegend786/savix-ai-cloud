import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import Scheme from "./models/Scheme.js";
import schemes from "./seed/schemes.js";

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log("Clearing old schemes...");

    await Scheme.deleteMany({});

    console.log("Adding government schemes...");

    await Scheme.insertMany(schemes);

    console.log(
      `${schemes.length} schemes added successfully!`
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "Database seeding failed:",
      error.message
    );

    process.exit(1);
  }
};

seedDatabase();