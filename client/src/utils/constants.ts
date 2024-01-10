import { Options } from "react-select";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const BASE_URL = IS_PRODUCTION
  ? "https://api.bereal.michaeldemar.co"
  : "http://localhost:5000";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export interface Option {
  value: string;
  label: string;
}

const MODES: Options<Option> = [
  {
    value: "classic",
    label: "Classic (30 seconds)",
  },
  {
    value: "modern",
    label: "Full",
  },
];

const YEARS: Options<Option> = [
  {
    value: "2024",
    label: "2024",
  },
  {
    value: "2023",
    label: "2023",
  },
  {
    value: "2022",
    label: "2022",
  },
  {
    value: "2021",
    label: "2021",
  },
  {
    value: "2020",
    label: "2020",
  },
];

export { IS_PRODUCTION, BASE_URL, MAX_FILE_SIZE, MODES, YEARS };
