import React, { useMemo } from "react";
import { isSecondHalfOfYear } from "../utils/helpers";

const Header: React.FC = () => {
  const displayYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return isSecondHalfOfYear() ? currentYear : currentYear - 1;
  }, []);

  return (
    <div className="text-center mb-6 md:max-w-md max-w-xs">
      <h1 className="text-4xl font-bold mb-1 text-white">BeReal, Wrapped.</h1>
      <h2 className="text-xl text-white">
        Generate a recap video from your {displayYear} BeReals!
      </h2>
      <h3 className="text-md text-white">a.k.a, 📸➡️📺❗</h3>
    </div>
  );
};

export default Header;
