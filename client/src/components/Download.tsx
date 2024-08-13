import React from "react";
import { useFormContext } from "../context/FormContext";
import { BASE_URL } from "../utils/constants";

interface Props {}

const Download: React.FC<Props> = () => {
  const { countryCode, phoneNumber, berealToken, videoFilename } =
    useFormContext();

  const videoUrl = `${BASE_URL}/video/${videoFilename}?phone=${countryCode}${phoneNumber}&berealToken=${berealToken}`;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = videoUrl;
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
        <source src={videoUrl} type="video/mp4" /> Your browser does not support
        the video tag. The download button should work though!
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
