import React, { useCallback, useEffect, useMemo } from "react";
import { useFormContext } from "../context/FormContext";
import { useError } from "../hooks/useError";
import axios from "../utils/axios";
import { BASE_URL } from "../utils/constants";

interface ErrorResponse {
  message: string;
}

const Download: React.FC = () => {
  const { countryCode, phoneNumber, berealToken, videoFilename, reset } =
    useFormContext();
  const { setErrorAndNavigate } = useError<ErrorResponse>(
    "Failed to download video. Try again later."
  );

  const videoUrl = useMemo(
    () =>
      `${BASE_URL}/video/${videoFilename}?phone=${countryCode}${phoneNumber}&berealToken=${berealToken}`,
    [berealToken, countryCode, phoneNumber, videoFilename]
  );

  const handleDownload = useCallback(() => {
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = "recap.mp4";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [videoUrl]);

  useEffect(() => {
    const checkVideo = async () => {
      if (!videoUrl) {
        return;
      }

      try {
        await axios.get(videoUrl);
      } catch (error) {
        reset();
        setErrorAndNavigate("Failed to download video. Try again later.", "/");
      }
    };

    checkVideo();
  }, [reset, setErrorAndNavigate, videoUrl]);

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
