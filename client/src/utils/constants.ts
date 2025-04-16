import { Options } from "react-select";
import { generateYearOptions } from "./helpers";
import { Option } from "./types";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const BASE_URL = IS_PRODUCTION
  ? "https://api.bereal.michaeldemar.co"
  : "http://localhost:5000";

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const MODES: Options<Option> = [
  {
    value: "classic",
    label: "Classic (30 seconds)",
    searchLabels: ["classic", "30 seconds"],
  },
  {
    value: "modern",
    label: "Full",
    searchLabels: ["modern", "full"],
  },
];

export const YEARS: Options<Option> = generateYearOptions();
