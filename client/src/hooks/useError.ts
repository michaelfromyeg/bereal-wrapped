import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useThrottledToast } from "./useThrottledToast";

export type SomeError = AxiosError | Error | string

/**
 * Re-usable logic for handling the current error state of the program. Handles errors from Axios, thrown errors, or user strings.
 *
 * Only surfaces one error at a time.
 */
export const useError = <T extends Record<string, string>>(defaultMessage: string = "An error occurred. Please try again later.") => {
  const throttledToast = useThrottledToast();
  const [error, setError] = useState<SomeError | null>(null);

  useEffect(() => {
    if (error) {
      let errorMessage = defaultMessage;

      if (axios.isAxiosError(error)) {
        console.error(error);
        if (error.response) {
          const data = error.response.data as T;
          errorMessage = `Error: ${data.message}`;
        } else if (error.request) {
          errorMessage = "No response received from server.";
        } else {
          errorMessage = "An error occurred.";
        }
      } else if (error instanceof Error) {
        console.error(error);
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      throttledToast(errorMessage, "error");
    }
  }, [defaultMessage, error, throttledToast]);

  return {
    error,
    setError
  }
}
