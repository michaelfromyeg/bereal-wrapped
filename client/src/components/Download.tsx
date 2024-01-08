import React from "react";

interface Props {
  href: string;
}

const Download: React.FC<Props> = (props) => {
  const { href } = props;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = href;
    link.download = "recap.mp4";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      className="w-full py-2 mb-4 text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={handleDownload}
    >
      Download your video
    </button>
  );
};

export default Download;
