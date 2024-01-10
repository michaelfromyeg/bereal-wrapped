import React from "react";

const Header: React.FC = () => {
  return (
    <div className="text-center mb-6 md:max-w-md max-w-xs">
      <h1 className="text-4xl font-bold mb-1 text-white">BeReal, Wrapped.</h1>
      <h2 className="text-xl text-white">
        Generate a recap video from your 2023 BeReals!
      </h2>
      <h3 className="text-md text-white">a.k.a, 📸➡️📺❗</h3>
    </div>
  );
};

export default Header;
