import React from "react";
import { ToastContainer } from "react-toastify";

import Footer from "./Footer";
import Form from "./Form";

import "../styles/App.css";

const App: React.FC = () => {
  return (
    <div>
      <Form />
      <Footer />
      <ToastContainer />
    </div>
  );
};

export default App;
