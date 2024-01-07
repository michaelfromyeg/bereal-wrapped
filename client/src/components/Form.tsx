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
  countryCode: string;
  phoneNumber: string;

  otpSession: string;

  token: string;
  berealToken: string;
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

const Footer: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);

  const [stage, setStage] = useState<Stage>("phoneInput");

  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("");

  const [otpCode, setOtpCode] = useState<string>("");
  const [otpSession, setOtpSession] = useState<any | null>(null);

  const [token, setToken] = useState<string>("");
  const [berealToken, setBerealToken] = useState<string>("");

  const [year, setYear] = useState<Option | null>(YEARS[1]);
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

      setToken(sessionData.token);
      setBerealToken(sessionData.berealToken);

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
        otp_session: otpSession,
        otp_code: otpCode,
        phone: `${countryCode}${phoneNumber}`,
      });

      setToken(response.data?.token);
      setBerealToken(response.data?.bereal_token);

      const sessionData: Session = {
        countryCode,
        phoneNumber,
        token: response.data?.token,
        berealToken: response.data?.berealToken,
        otpSession,
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
        params: {
          phone: `${countryCode}${phoneNumber}`,
          berealToken,
        },
      });

      if (response.status === 401) {
        showErrorToast("Please refresh the page and try again.");
        setStage("phoneInput");
        return;
      }

      setTaskId(response.data?.taskId);

      setStage("processing");
    } catch (error) {
      console.error("Error submitting settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: any) => {
    if (event.key === "Enter") {
      event.preventDefault();
      switch (stage) {
        case "phoneInput":
          handlePhoneSubmit();
          break;
        case "otpInput":
          handleOtpSubmit();
          break;
        case "settings":
          handleSettingsSubmit();
          break;
        default:
          break;
      }
    }
  };

  const videoUrl = `${BASE_URL}/video/${videoFilename}?phone=${countryCode}${phoneNumber}&berealToken=${berealToken}`;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-auto my-6">
      <h1 className="text-4xl font-bold text-center mb-3">BeReal. Recap.</h1>
      <p className="text-center max-w-sm mb-3">
        Create a recap video of your BeReals. Only uses your phone number and
        does not store any information. Videos are deleted after 24 hours and
        only accessible by you!
      </p>
      <p className="text-center max-w-sm mb-6">
        If you get an error, refresh the page and try again. If errors persist,
        feel free to make an issue on GitHub.
      </p>
      <div className="w-full">
        {stage === "phoneInput" && (
          <>
            <CountryCode setCountryCode={setCountryCode} />
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Phone Number
            </label>
            <input
              type="text"
              id="phoneNumber"
              className="block w-full p-2 mt-1 mb-4 border border-gray-300 rounded-md"
              placeholder="e.g., 7806809634"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="w-full py-2 mb-4 text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePhoneSubmit}
              disabled={loading}
            >
              Send verification code
            </button>
          </>
        )}
        {stage === "otpInput" && (
          <>
            <label
              htmlFor="otpCode"
              className="block text-sm font-medium text-gray-700"
            >
              Verification Code (e.g., 123456)
            </label>
            <input
              className="block w-full p-2 mt-1 mb-4 border border-gray-300 rounded-md"
              type="text"
              id="otpCode"
              placeholder="OTP"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="w-full py-2 mb-4 text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleOtpSubmit}
              disabled={loading}
            >
              Validate verification code
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
            phone={`${countryCode}${phoneNumber}`}
            berealToken={berealToken}
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
              onClick={() => (window.location.href = videoUrl)}
            >
              Download your video
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Footer;
