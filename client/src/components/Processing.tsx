import axios from "axios";
import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useFormContext } from "../context/FormContext";
import { useError } from "../hooks/useError";
import { BASE_URL } from "../utils/constants";

interface Props {}

const VideoProcessor: React.FC<Props> = () => {
  const { countryCode, phoneNumber, berealToken, taskId, setVideoFilename } =
    useFormContext();
  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [progress, setProgress] = useState<number>(0);

  const { setError } = useError("Failed to generate video. Try again later.");
  const [errorCount, setErrorCount] = useState<number>(0);

  useEffect(() => {
    const checkProgress = async () => {
      if (taskId) {
        try {
          const response = await axios.get(`${BASE_URL}/status/${taskId}`, {
            params: {
              phone: `${countryCode}${phoneNumber}`,
              berealToken,
            },
          });

          if (response.status === 401) {
            setError("Please refresh the page and try again.");
            navigate("/");
            return;
          }

          if (response.status > 299) {
            console.warn("Couldn't check progress:", response);
            console.log("Progress unknown... continuing anyway!");

            setErrorCount(errorCount + 1);

            if (errorCount >= 5) {
              setError("Failed to generate video. Try again later.");
              navigate("/");
            }

            return;
          }

          const { status, result } = response.data;

          if (status === "FAILURE") {
            setError("Failed to generate video. Try again later.");
            navigate("/");
          }
          if (status === "SUCCESS") {
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
      }
    };

    let interval: NodeJS.Timeout | null = null;
    if (taskId) {
      interval = setInterval(() => {
        checkProgress();
      }, 60 * 1000);
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
