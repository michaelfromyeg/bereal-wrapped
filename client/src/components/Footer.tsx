import React from "react";

interface Props {
  version: string | null;
}

const Footer: React.FC<Props> = (props: Props) => {
  const { version } = props;

  return (
    <footer className="flex flex-col justify-center items-center gap-4 mt-6">
      <div className="text-center text-white">
        <p className="max-w-sm">
          If you get an error, refresh the page and try again. If errors
          persist, feel free to{" "}
          <a
            href="https://github.com/michaelfromyeg/bereal-wrapped/issues/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            make an issue on GitHub
          </a>
          .
        </p>
      </div>
      <div className="flex flex-row justify-center items-center space-x-1 text-white">
        <a
          className="text-link hover:text-link-dark focus:outline-none focus:ring-2 focus:ring-link focus:ring-opacity-50"
          href="https://michaeldemar.co"
          target="_blank"
          rel="noopener noreferrer"
        >
          by Michael DeMarco
        </a>
        <span>•</span>
        <a
          className="text-link hover:text-link-dark focus:outline-none focus:ring-2 focus:ring-link focus:ring-opacity-50"
          href="https://buymeacoffee.com/michaelfromyeg"
          target="_blank"
          rel="noopener noreferrer"
        >
          buy me a coffee
        </a>
        <span>•</span>
        <a
          className="text-link hover:text-link-dark focus:outline-none focus:ring-2 focus:ring-link focus:ring-opacity-50"
          href="https://github.com/michaelfromyeg/bereal-wrapped"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        {version && (
          <>
            <span>•</span>
            <div className="mb-0">version {version}</div>
          </>
        )}
      </div>
    </footer>
  );
};

export default Footer;
