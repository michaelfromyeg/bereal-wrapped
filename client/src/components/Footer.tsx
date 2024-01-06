import React from "react";

interface Props {
  version: string;
}

const Footer: React.FC<Props> = (props: Props) => {
  const { version } = props;

  return (
    <footer className="text-center">
      <div className="flex justify-center items-center space-x-1">
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
        {version && (
          <>
            <span>|</span>
            <div className="mb-0">version {version}</div>
          </>
        )}
        {/*
          <span>|</span>
          <a
            href="https://yourdonationlink.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-300"
          >
            Donate
          </a>
        */}
      </div>
    </footer>
  );
};

export default Footer;
