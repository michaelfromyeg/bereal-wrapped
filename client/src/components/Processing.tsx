import React, { useState, useEffect } from "react";
import axios from "axios";

import { BASE_URL } from "../utils/constants";

interface Props {
  phone: string;
  berealToken: string;

  taskId: string;
  setResult: Function;
  setError: Function;
  setStage: Function;
}

const VideoProcessor: React.FC<Props> = (props: Props) => {
  const { phone, berealToken, taskId, setResult, setError, setStage } = props;

  const [errorCount, setErrorCount] = useState<number>(0);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const checkProgress = async () => {
      if (taskId) {
        try {
          const response = await axios.get(`${BASE_URL}/status/${taskId}`, {
            params: {
              phone,
              berealToken,
            },
          });

          if (response.status === 401) {
            setError("Please refresh the page and try again.");
            setStage("phoneInput");
          } else if (response.status > 299) {
            console.warn("Couldn't check progress:", response);
            console.log("Progress unknown... continuing anyway!");

            setErrorCount(errorCount + 1);

            if (errorCount >= 5) {
              setError("Failed to generate video. Try again later.");
              setStage("phoneInput");
            }
          } else {
            const { status, result } = response.data;

            if (status === "FAILURE") {
              setError("Failed to generate video. Try again later.");
              setStage("phoneInput");
            }
            if (status === "SUCCESS") {
              setProgress(100);

              setResult(result);
              setStage("videoDisplay");
            } else {
              setProgress(logProgress(response.data));
            }
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
    phone,
    berealToken,
    taskId,
    setResult,
    setError,
    setStage,
    errorCount,
    setErrorCount,
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
