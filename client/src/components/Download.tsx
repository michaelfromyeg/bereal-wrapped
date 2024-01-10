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
    <>
      <video
        controls
        playsInline
        muted
        disablePictureInPicture
        disableRemotePlayback
        loop
        autoPlay
      >
        <source src={href} type="video/mp4" /> Your browser does not support the
        video tag. The download button should work though!
      </video>

      <button
        className="w-full mt-6 p-2 bg-white text-[#0f0f0f] font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleDownload}
      >
        Download your video
      </button>
    </>
  );
};

export default Download;
