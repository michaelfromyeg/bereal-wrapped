import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

type Stage = "phoneInput" | "otpInput" | "settings" | "videoDisplay";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const BASE_URL = IS_PRODUCTION
  ? "https://bereal-api.michaeldemar.co"
  : "http://localhost:5000";

const Footer: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);

  const [stage, setStage] = useState<Stage>("phoneInput");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [otpSession, setOtpSession] = useState<any | null>(null);
  const [token, setToken] = useState<string>("");
  const [year, setYear] = useState<string>("2023");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<string>("classic");
  const [videoUrl, setVideoUrl] = useState<string>("");

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
      // Handle the error with showErrorToast and other logic
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
    let sessionData = session ? JSON.parse(session) : null;

    if (sessionData && sessionData.phone === `${countryCode}${phoneNumber}`) {
      setOtpSession(sessionData.otpSession);
      return;
    }

    setLoading(true);
    localStorage.removeItem("session");

    try {
      const response = await axios.post(`${BASE_URL}/request-otp`, {
        phone: `${countryCode}${phoneNumber}`,
      });

      console.log(response.data);

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

      console.log(response.data);

      setToken(response.data?.token);

      const sessionData = {
        otpSession,
        token: response.data?.token,
        phone: `${countryCode}${phoneNumber}`,
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

    formData.append("year", year);
    formData.append("mode", mode);

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

      // setVideoUrl(response.data.videoUrl);
      const videoUrl = `${BASE_URL}/video/${response.data?.videoUrl}`;
      console.log({ videoUrl });

      setVideoUrl(videoUrl);
      setStage("videoDisplay");
    } catch (error) {
      console.error("Error submitting settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1 className="text-4xl font-bold text-center mb-3">BeReal. Recap.</h1>
      <p className="text-center mb-3">
        Create a 2022-style recap for 2022 or 2023. Needs your phone number.
        More information on GitHub.
      </p>
      <p className="text-center mb-6">
        The app is admittedly a bit flakey, so try to follow instructions
        carefully, and if you get an error, refresh the page and try again. If
        errors persist, feel free to make an issue on GitHub.
      </p>
      <div>
        {stage === "phoneInput" && (
          <>
            <label
              htmlFor="countryCode"
              className="block text-sm font-medium text-gray-700"
            >
              Country Code (e.g., 1)
            </label>
            <input
              type="text"
              id="countryCode"
              placeholder="Country Code"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            />
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Phone Number (e.g., 7801234567)
            </label>
            <input
              type="text"
              id="phoneNumber"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button onClick={handlePhoneSubmit} disabled={loading}>
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
              type="text"
              id="otpCode"
              placeholder="OTP"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
            />
            <button onClick={handleOtpSubmit} disabled={loading}>
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
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
            <label
              htmlFor="song"
              className="block text-sm font-medium text-gray-700"
            >
              Song (if blank, there's a default song!)
            </label>
            <input
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
            <select
              id="mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="classic">Classic (30 seconds)</option>
              <option value="full">Full</option>
            </select>
            <button onClick={handleSettingsSubmit} disabled={loading}>
              Submit
            </button>
          </>
        )}
        {stage === "videoDisplay" && (
          <>
            {/* TODO(michaelfromyeg): enable video previews */}
            {/* <video controls>
              <source src={videoUrl} type="video/mp4" />{" "}
              Your browser does not support the video tag. The download button
              should work though!
            </video> */}
            <button onClick={() => (window.location.href = videoUrl)}>
              Download Video
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Footer;
