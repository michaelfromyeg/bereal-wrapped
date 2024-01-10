import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import axios from "axios";

import Footer from "./Footer";
import Form from "./Form";
import Header from "./Header";

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
    <div className="flex flex-col items-center justify-center min-h-screen py-8">
      <Header />
      <Form />
      <Footer version={version} />
      <ToastContainer />
    </div>
  );
};

export default App;
