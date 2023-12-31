import React, { useState, useEffect } from "react";
import axios from "axios";

import { BASE_URL } from "../utils";

interface Props {
  taskId: string;
  setResult: Function;
  setError: Function;
  setStage: Function;
}

const VideoProcessor: React.FC<Props> = (props: Props) => {
  const { taskId, setResult, setError, setStage } = props;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const checkProgress = async () => {
      if (taskId) {
        try {
          const response = await axios.get(`${BASE_URL}/status/${taskId}`);
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
        } catch (error) {
          console.error("Error checking progress:", error);
        }
      }
    };

    let interval: NodeJS.Timeout | null = null;
    if (taskId) {
      interval = setInterval(() => {
        checkProgress();
      }, 10 * 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [taskId, setResult, setError, setStage]);

  return (
    <>
      {taskId ? (
        <p className="text-center">Processing...</p>
      ) : (
        <p className="text-center">
          No task ID available. Refresh the page to try again.
        </p>
      )}
    </>
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
