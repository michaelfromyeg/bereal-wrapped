import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import axios from "axios";

import Footer from "./Footer";
import Form from "./Form";

import "../styles/App.css";

import { BASE_URL } from "../utils";

const App: React.FC = () => {
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    const getStatus = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/status`);

        const data = response.data;

        console.log(data);

        setVersion(data.version);
      } catch (error) {
        console.error(error);

        toast.error(
          "There seems to be an issue with the server. Try again later.",
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          }
        );
      }
    };

    getStatus();
  }, []);

  return (
    <div className="flex flex-col items-center">
      <Form />
      <Footer version={version} />
      <ToastContainer />
    </div>
  );
};

export default App;
