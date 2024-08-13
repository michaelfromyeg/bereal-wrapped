import { useState } from "react";
import Select from "react-select";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "../context/FormContext";
import { SomeError, useError } from "../hooks/useError";
import { useThrottledToast } from "../hooks/useThrottledToast";
import { BASE_URL, MAX_FILE_SIZE, MODES, YEARS } from "../utils/constants";
import { customStyles } from "./CountryCode";

interface VideoResponse {
  taskId: string;
}

interface ErrorResponse {
  message: string;
}

interface Props {}

const Settings: React.FC<Props> = () => {
  const {
    countryCode,
    phoneNumber,
    berealToken,
    token,
    setYear,
    setDisplayDate,
    setMode,
    setFile,
    setDisableMusic,
    year,
    displayDate,
    mode,
    file,
    disableMusic,
    setTaskId,
  } = useFormContext();
  const navigate = useNavigate();
  const throttledToast = useThrottledToast();

  const [loading, setLoading] = useState<boolean>(false);
  const { error, setError } = useError(
    "An unexpected error occurred in creating your video. Please refresh the page and try again."
  );

  // assumes year and mode are set
  const handleSettingsSubmit = async (): Promise<void> => {
    const formData = new FormData();

    if (!year || !mode) {
      return;
    }

    formData.append("token", token);
    formData.append("year", year.value);
    formData.append("displayDate", displayDate ? "true" : "false");
    formData.append("mode", mode.value);

    // if left blank, a default song is used
    if (file) {
      formData.append("file", file);
    }

    formData.append("disableMusic", disableMusic ? "true" : "false");

    try {
      const response = await axios.post<VideoResponse>(
        `${BASE_URL}/video`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          params: {
            phone: `${countryCode}${phoneNumber}`,
            berealToken,
          },
        }
      );

      if (response.status === 401) {
        setError(
          "An unexpected error occurred in creating your video. Please refresh the page and try again."
        );
        navigate("/");
        return;
      }

      setTaskId(response.data.taskId);
      navigate("processing");
    } catch (error) {
      setError(error as SomeError);
    }
  };

  const validateAndSubmitSettings = async () => {
    setError(null);
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
      <label htmlFor="song" className="block mb-2 text-sm">
        Custom Song (.wav) (if blank,{" "}
        <a
          className="text-link hover:text-link-dark focus:outline-none focus:ring-2 focus:ring-link focus:ring-opacity-50"
          href="https://youtube.com/watch?v=dX3k_QDnzHE"
          target="_blank"
          rel="noreferrer"
        >
          Midnight City
        </a>{" "}
        by M83 will be used)
      </label>
      {/* TODO(michaelfromyeg): the file input needs some styling work */}
      <input
        className="block w-full p-2 mt-1 mb-3 border border-white rounded-md file:mr-3 file:p-1 file:text-sm file:bg-white file:border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        type="file"
        id="song"
        accept=".wav"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        disabled={disableMusic}
      />
      {/* TODO(michaelfromyeg): a checkbox to enable displaying dates */}
      <div className="flex items-center justify-center mb-3">
        <label htmlFor="disableMusic" className="text-sm mr-2">
          Disable Music
        </label>
        <input
          id="disableMusic"
          type="checkbox"
          checked={disableMusic}
          onChange={(e) => setDisableMusic(e.target.checked)}
        />
        <label htmlFor="displayDate" className="text-sm mx-2">
          Include Date
        </label>
        <input
          id="displayDate"
          type="checkbox"
          checked={displayDate}
          onChange={(e) => setDisplayDate(e.target.checked)}
        />
      </div>
      {error && typeof error === "string" && (
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
