import React, { useEffect, useState } from "react";
import Select, { Options } from "react-select";
import { toast } from "react-toastify";
import axios from "axios";

import CountryCode from "./CountryCode";
import Processing from "./Processing";

import { BASE_URL } from "../utils";

axios.defaults.withCredentials = true;

type Stage =
  | "phoneInput"
  | "otpInput"
  | "settings"
  | "processing"
  | "videoDisplay";

interface Session {
  otpSession: string;
  token: string;
  countryCode: string;
  phoneNumber: string;
}

interface Option {
  value: string;
  label: string;
}

const MODES: Options<Option> = [
  {
    value: "classic",
    label: "Classic (30 seconds)",
  },
  {
    value: "full",
    label: "Full",
  },
];

const YEARS: Options<Option> = [
  {
    value: "2023",
    label: "2023",
  },
  {
    value: "2022",
    label: "2022",
  },
];

const Footer: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);

  const [stage, setStage] = useState<Stage>("phoneInput");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [otpSession, setOtpSession] = useState<any | null>(null);
  const [token, setToken] = useState<string>("");
  const [year, setYear] = useState<Option | null>(YEARS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Option | null>(MODES[0]);

  const [taskId, setTaskId] = useState<string>("");
  const [videoFilename, setVideoFilename] = useState<string>("");

  const showErrorToast = (errorMessage: string) => {
    toast.error(errorMessage, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        setError(error);
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    if (error) {
      let errorMessage = "An error occurred";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = `Error: ${error.response.data.message}`;
      } else if (error.request) {
        errorMessage = "No response received from server";
      } else if (error && error.message) {
        errorMessage = error.message;
      }

      showErrorToast(errorMessage);
      localStorage.removeItem("session");
      setStage("phoneInput");
    }
  }, [error]);

  const handlePhoneSubmit = async () => {
    const session = localStorage.getItem("session");
    let sessionData: Session | null = session ? JSON.parse(session) : null;

    if (
      sessionData &&
      sessionData.countryCode === countryCode &&
      sessionData.phoneNumber === phoneNumber
    ) {
      setCountryCode(sessionData.countryCode);
      setPhoneNumber(sessionData.phoneNumber);
      setOtpSession(sessionData.otpSession);

      setStage("settings");
      return;
    }

    setLoading(true);
    localStorage.removeItem("session");

    try {
      const response = await axios.post(`${BASE_URL}/request-otp`, {
        phone: `${countryCode}${phoneNumber}`,
      });

      setOtpSession(response.data?.otpSession);
      setStage("otpInput");
    } catch (error) {
      console.error("Error sending OTP:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/validate-otp`, {
        phone: `${countryCode}${phoneNumber}`,
        otp_session: otpSession,
        otp_code: otpCode,
      });

      setToken(response.data?.token);

      const sessionData: Session = {
        otpSession,
        token: response.data?.token,
        countryCode,
        phoneNumber,
      };

      localStorage.setItem("session", JSON.stringify(sessionData));

      setStage("settings");
    } catch (error) {
      console.error("Error validating OTP:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSubmit = async () => {
    const formData = new FormData();
    formData.append("phone", `${countryCode}${phoneNumber}`);
    formData.append("token", token);

    formData.append("year", year?.value || "");
    formData.append("mode", mode?.value || "");

    // if left blank, a default song is used
    if (file) {
      formData.append("file", file);
    }

    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/video`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setTaskId(response.data?.taskId);

      setStage("processing");
    } catch (error) {
      console.error("Error submitting settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-auto my-6">
      <h1 className="text-4xl font-bold text-center mb-3">BeReal. Recap.</h1>
      <p className="text-center max-w-sm mb-3">
        Create a 2022-style recap for 2022 or 2023. Needs your phone number.
        More information on GitHub.
      </p>
      <p className="text-center max-w-sm mb-6">
        The app is admittedly a bit flakey, so try to follow instructions
        carefully, and if you get an error, refresh the page and try again. If
        errors persist, feel free to make an issue on GitHub.
      </p>
      <div className="w-full">
        {stage === "phoneInput" && (
          <>
            <CountryCode setCountryCode={setCountryCode} />
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Phone Number (e.g., 7801234567)
            </label>
            <input
              type="text"
              id="phoneNumber"
              className="block w-full p-2 mt-1 mb-4 border border-gray-300 rounded-md"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button
              className="w-full py-2 mb-4 text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePhoneSubmit}
              disabled={loading}
            >
              Send OTP
            </button>
          </>
        )}
        {stage === "otpInput" && (
          <>
            <label
              htmlFor="otpCode"
              className="block text-sm font-medium text-gray-700"
            >
              One-Time Password (e.g., 123456)
            </label>
            <input
              className="block w-full p-2 mt-1 mb-4 border border-gray-300 rounded-md"
              type="text"
              id="otpCode"
              placeholder="OTP"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
            />
            <button
              className="w-full py-2 mb-4 text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleOtpSubmit}
              disabled={loading}
            >
              Validate OTP
            </button>
          </>
        )}
        {stage === "settings" && (
          <>
            <label
              htmlFor="year"
              className="block text-sm font-medium text-gray-700"
            >
              Year
            </label>
            <Select
              id="year"
              value={year}
              onChange={(option) => setYear(option)}
              options={YEARS}
              className="basic-single mb-4"
            />
            <label
              htmlFor="song"
              className="block text-sm font-medium text-gray-700"
            >
              Song (if blank, there's a default song!)
            </label>
            <input
              className="block w-full p-2 mt-1 mb-4 border border-gray-300 rounded-md"
              type="file"
              id="song"
              accept=".wav"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <label
              htmlFor="mode"
              className="block text-sm font-medium text-gray-700"
            >
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
            <button
              className="w-full py-2 mb-4 text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSettingsSubmit}
              disabled={loading}
            >
              Submit
            </button>
          </>
        )}
        {stage === "processing" && (
          <Processing
            taskId={taskId}
            setResult={setVideoFilename}
            setError={setError}
            setStage={setStage}
          />
        )}
        {stage === "videoDisplay" && (
          <>
            {/* TODO(michaelfromyeg): enable video previews */}
            {/*
              <video controls>
                <source src={videoUrl} type="video/mp4" />{" "}
                Your browser does not support the video tag. The download button
                should work though!
              </video>
            */}
            <button
              className="w-full py-2 mb-4 text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() =>
                (window.location.href = `${BASE_URL}/video/${videoFilename}`)
              }
            >
              Download Video
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Footer;
