import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useFormContext } from "../context/FormContext";
import { useError } from "../hooks/useError";
import axios from "../utils/axios";
import { BASE_URL } from "../utils/constants";

interface ProgressResponse {
  status: string;
  result: string;
}

interface ErrorResponse {
  message: string;
}

const VideoProcessor: React.FC = () => {
  const {
    countryCode,
    phoneNumber,
    berealToken,
    taskId,
    setVideoFilename,
    reset,
  } = useFormContext();
  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [progress, setProgress] = useState<number>(0);

  const { setError, setErrorAndNavigate } = useError<ErrorResponse>(
    "Failed to generate video. Try again later."
  );
  const [errorCount, setErrorCount] = useState<number>(0);

  useEffect(() => {
    const checkProgress = async () => {
      if (!taskId) {
        navigate("/");
        return;
      }

      try {
        const config = {
          params: {
            phone: `${countryCode}${phoneNumber}`,
            berealToken,
          },
        };
        const response = await axios.get<ProgressResponse>(
          `${BASE_URL}/status/${taskId}`,
          config
        );

        if (response.status === 401) {
          reset();
          setErrorAndNavigate("Please refresh the page and try again.", "/");
          return;
        }

        if (response.status > 299) {
          console.warn("Couldn't check progress:", response);

          const nextErrorCount = errorCount + 1;
          setErrorCount(nextErrorCount);

          if (nextErrorCount >= 3) {
            reset();
            setErrorAndNavigate(
              "Failed to generate video. Try again later.",
              "/"
            );
          }

          return;
        }

        const { status, result } = response.data;
        if (status === "FAILURE") {
          reset();
          setErrorAndNavigate(
            "Failed to generate video. Try again later.",
            "/"
          );
        } else if (status === "SUCCESS") {
          setProgress(100);

          setVideoFilename(result);
          navigate("/download");
        } else {
          setProgress(logProgress(response.data));
        }
      } catch (error) {
        // again, not something the user needs to know about; just try again
        console.error("Error checking progress:", error);
      }
    };

    let interval: NodeJS.Timeout | null = null;
    if (taskId) {
      checkProgress();

      interval = setInterval(() => {
        checkProgress();
      }, 60 * 1000);
    } else {
      navigate("/");
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    phoneNumber,
    berealToken,
    taskId,
    setError,
    errorCount,
    setErrorCount,
    countryCode,
    navigate,
    setVideoFilename,
    reset,
    setErrorAndNavigate,
  ]);

  return (
    <div className="w-full">
      {taskId ? (
        <div>
          <p className="text-center max-w-sm mb-3">
            Videos take around 10 minutes to generate. A download button will
            appear when ready, and you'll also receive a text message with the
            link.
          </p>
          <p className="text-white font-semibold text-center">Processing...</p>
        </div>
      ) : (
        <p className="text-red-500 font-semibold text-center">
          No task ID available. Refresh the page to try again.
        </p>
      )}
    </div>
  );
};

export default VideoProcessor;

/**
 * Logs the progress of the video processing task.
 *
 * TODO(michaelfromyeg): make this a bit better, show a progress bar.
 */
function logProgress(data: any): number {
  console.log(data);

  return 0.0;
}
