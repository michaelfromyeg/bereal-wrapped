import { useState } from "react";
import Select from "react-select";

import { Option, YEARS, MODES, MAX_FILE_SIZE } from "../utils";

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <label htmlFor="year" className="block text-sm font-medium text-gray-700">
        Year
      </label>
      <Select
        id="year"
        value={year}
        onChange={(option) => setYear(option)}
        options={YEARS}
        className="basic-single mb-4"
      />
      <label htmlFor="song" className="block text-sm font-medium text-gray-700">
        Song (if blank, there's a default song!)
      </label>
      <input
        className="block w-full p-2 mt-1 mb-4 border border-gray-300 rounded-md"
        type="file"
        id="song"
        accept=".wav"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <label htmlFor="mode" className="block text-sm font-medium text-gray-700">
        Mode
      </label>
      <Select
        id="mode"
        value={mode}
        onChange={(option) => setMode(option)}
        className="basic-single mb-4"
        classNamePrefix="select"
        options={MODES}
      />
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <button
        className="w-full py-2 mb-4 text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={validateAndSubmitSettings}
        disabled={loading}
      >
        Submit
      </button>
    </>
  );
};

export default Settings;
