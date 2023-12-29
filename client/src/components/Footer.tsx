import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full text-center p-4 absolute bottom-0 left-0">
      <div className="flex justify-center items-center space-x-4">
        <div className="mb-0">a project from Michael DeMarco</div>
        <span>|</span>
        <a
          href="https://github.com/michaelfromyeg/bereal-wrapped"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-300"
        >
          GitHub
        </a>
        {/* <span>|</span>
        <a
          href="https://yourdonationlink.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-300"
        >
          Donate
        </a> */}
      </div>
    </footer>
  );
};

export default Footer;
