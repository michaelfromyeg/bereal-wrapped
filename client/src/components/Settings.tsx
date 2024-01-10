import { useState } from "react";
import Select from "react-select";

import { customStyles } from "./CountryCode";
import { Option, YEARS, MODES, MAX_FILE_SIZE } from "../utils/constants";

interface Props {
  setYear: React.Dispatch<React.SetStateAction<Option | null>>;
  setMode: React.Dispatch<React.SetStateAction<Option | null>>;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  handleSettingsSubmit: () => void;
  year: Option | null;
  mode: Option | null;
  file: File | null;
}

const Settings: React.FC<Props> = (props) => {
  const { setYear, setMode, setFile, handleSettingsSubmit, year, mode, file } =
    props;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);

  const validateAndSubmitSettings = async () => {
    setError("");
    setLoading(true);

    try {
      if (!year) {
        setError("Please select a year.");
      } else if (!mode) {
        setError("Please select a mode.");
      } else if (file && file.size > MAX_FILE_SIZE) {
        setError("File size must be less than 100 MB.");
      } else {
        await handleSettingsSubmit();
      }
    } catch (error) {
      // this is unexpected; it means an error was thrown *in validation* or by handleSettingsSubmit; just log it
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <label htmlFor="year" className="block mb-2 text-sm">
        Year*
      </label>
      <Select
        id="year"
        value={year}
        onChange={(option) => setYear(option)}
        options={YEARS}
        styles={customStyles}
        className="basic-single mb-3"
      />
      {/* TODO(michaelfromyeg): this needs some styling work */}
      <label htmlFor="song" className="block mb-2 text-sm">
        Song (if blank, there's a default song!)
      </label>
      <input
        className="block w-full p-2 mt-1 mb-3 border border-white rounded-md file:mr-3 file:p-1 file:text-sm file:bg-white file:border-0 cursor-pointer"
        type="file"
        id="song"
        accept=".wav"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <label htmlFor="mode" className="block mb-2 text-sm">
        Mode*
      </label>
      <Select
        id="mode"
        value={mode}
        onChange={(option) => setMode(option)}
        className="basic-single mb-3"
        classNamePrefix="select"
        options={MODES}
        styles={customStyles}
      />
      {error && (
        <div className="text-center text-red-500 text-sm mb-3">{error}</div>
      )}
      <button
        className="w-full mt-6 p-2 bg-white text-[#0f0f0f] font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={validateAndSubmitSettings}
        disabled={loading}
      >
        Submit
      </button>
    </div>
  );
};

export default Settings;
