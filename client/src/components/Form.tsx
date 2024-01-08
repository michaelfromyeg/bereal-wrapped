import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

import PhoneInput from "./PhoneInput";
import Processing from "./Processing";

import { BASE_URL, Option, YEARS, MODES } from "../utils";
import OtpInput from "./OtpInput";
import Settings from "./Settings";
import Download from "./Download";

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

const Form: React.FC = () => {
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

    try {
      localStorage.removeItem("session");

      const response = await axios.post(`${BASE_URL}/request-otp`, {
        phone: `${countryCode}${phoneNumber}`,
      });

      setOtpSession(response.data?.otpSession);
      setStage("otpInput");
    } catch (error) {
      console.error("Error sending OTP:", error);
    }
  };

  const handleOtpSubmit = async () => {
    try {
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
          <PhoneInput
            setCountryCode={setCountryCode}
            setPhoneNumber={setPhoneNumber}
            phoneNumber={phoneNumber}
            handlePhoneSubmit={handlePhoneSubmit}
            handleKeyDown={handleKeyDown}
          />
        )}
        {stage === "otpInput" && (
          <OtpInput
            otpCode={otpCode}
            setOtpCode={setOtpCode}
            handleOtpSubmit={handleOtpSubmit}
            handleKeyDown={handleKeyDown}
          />
        )}
        {stage === "settings" && (
          <Settings
            setYear={setYear}
            setMode={setMode}
            setFile={setFile}
            handleSettingsSubmit={handleSettingsSubmit}
            year={year}
            mode={mode}
            file={file}
          />
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
            <Download href={videoUrl} />
          </>
        )}
      </div>
    </div>
  );
};

export default Form;
