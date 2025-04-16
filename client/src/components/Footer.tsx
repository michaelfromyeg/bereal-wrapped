import React, { useEffect, useState } from "react";

interface Props {
  version: string | null;
}

const Footer: React.FC<Props> = (props: Props) => {
  const { version } = props;

  const [isLarge, setIsLarge] = useState<boolean>(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsLarge(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isLarge]);

  return (
    <footer className="mt-6 px-4 text-center">
      <div className="max-w-4xl mx-auto">
        <div className="text-white mb-4">
          <p className="max-w-sm mx-auto">
            If you get an error, refresh the page and try again. If errors
            persist, feel free to{" "}
            <a
              href="https://github.com/michaelfromyeg/bereal-wrapped/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-dark focus:outline-none focus:ring-2 focus:ring-link focus:ring-opacity-50"
            >
              make an issue on GitHub
            </a>
            .
          </p>
        </div>
        <div className="flex flex-col items-center lg:flex-row lg:justify-center text-white space-y-2 lg:space-y-0">
          <a
            className="text-link hover:text-link-dark focus:outline-none focus:ring-2 focus:ring-link focus:ring-opacity-50 lg:relative lg:px-4 first:pl-0 last:pr-0"
            href="https://michaeldemar.co"
            target="_blank"
            rel="noopener noreferrer"
          >
            by Michael DeMarco
          </a>
          {isLarge && <span className="text-white lg:px-0">{`•`}</span>}
          <a
            className="text-link hover:text-link-dark focus:outline-none focus:ring-2 focus:ring-link focus:ring-opacity-50 lg:relative lg:px-4 first:pl-0 last:pr-0"
            href="https://buymeacoffee.com/michaelfromyeg"
            target="_blank"
            rel="noopener noreferrer"
          >
            buy me a coffee
          </a>
          {isLarge && <span className="text-white lg:px-0">{`•`}</span>}
          <a
            className="text-link hover:text-link-dark focus:outline-none focus:ring-2 focus:ring-link focus:ring-opacity-50 lg:relative lg:px-4 first:pl-0 last:pr-0"
            href="https://github.com/michaelfromyeg/bereal-wrapped"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          {version && (
            <>
              {isLarge && <span className="text-white lg:px-0">{`•`}</span>}
              <div className="lg:relative lg:px-4 first:pl-0 last:pr-0">
                version {version}
              </div>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
