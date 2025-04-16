import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Download from "./components/Download";
import Footer from "./components/Footer";
import Header from "./components/Header";
import OtpInput from "./components/OtpInput";
import PhoneInput from "./components/PhoneInput";
import Processing from "./components/Processing";
import Settings from "./components/Settings";
import { FormProvider } from "./context/FormContext";

import { useThrottledToast } from "./hooks/useThrottledToast";
import axios from "./utils/axios";
import { BASE_URL } from "./utils/constants";

interface StatusResponse {
  version: string;
}

const App: React.FC = () => {
  const throttledToast = useThrottledToast();

  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const getStatus = async () => {
      try {
        const response = await axios.get<StatusResponse>(`${BASE_URL}/status`);
        console.log("response", response);
        setVersion(response.data.version);
      } catch (error) {
        // NOTE: cannot use `useError` here, since `navigate` cannot
        // be used outside main app context
        console.error(error);
        throttledToast(
          "The server seems down. Please try again later!",
          "error"
        );
      }
    };

    getStatus();
  }, [throttledToast]);

  return (
    <BrowserRouter>
      <div className="flex flex-col items-center justify-center min-h-screen py-8">
        <Header />
        <div className="w-screen p-6 flex flex-col items-center justify-center rounded-lg md:max-w-md max-w-xs mx-auto bg-subtle-radial text-white border border-1 border-white">
          <FormProvider>
            <Routes>
              <Route path="/" element={<PhoneInput />} />
              <Route path="/otp" element={<OtpInput />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/processing" element={<Processing />} />
              <Route path="/download" element={<Download />} />
            </Routes>
          </FormProvider>
        </div>
        <Footer version={version} />
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
};

export default App;
