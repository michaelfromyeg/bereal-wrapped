const IS_PRODUCTION = process.env.NODE_ENV === "production";
const BASE_URL = IS_PRODUCTION
  ? "https://api.bereal.michaeldemar.co"
  : "http://localhost:5000";

export { IS_PRODUCTION, BASE_URL };
