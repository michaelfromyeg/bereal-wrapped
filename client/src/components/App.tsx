import axios from "axios";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { FormProvider } from "../context/FormContext";
import Download from "./Download";
import Footer from "./Footer";
import Header from "./Header";
import OtpInput from "./OtpInput";
import PhoneInput from "./PhoneInput";
import Processing from "./Processing";
import Settings from "./Settings";

import { useThrottledToast } from "../hooks/useThrottledToast";
import { BASE_URL } from "../utils/constants";

const App: React.FC = () => {
  const [version, setVersion] = useState<string | null>(null);

  const throttledToast = useThrottledToast();

  useEffect(() => {
    const getStatus = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/status`);

        const data = response.data;

        console.log(data);

        setVersion(data.version);
      } catch (error) {
        console.error(error);

        throttledToast(
          "There seems to be an issue with the server. Try again later.",
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
            {/* <Form /> */}
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
