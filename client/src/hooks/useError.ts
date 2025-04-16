import axios, { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThrottledToast } from "./useThrottledToast";

export type SomeError = AxiosError | Error | string

// TODO(michaelfromyeg): extend to more kinds of errors
interface ErrorResponse {
  message: string;
}

/**
 * Re-usable logic for handling the current error state of the program. Handles errors from Axios, thrown errors, or user strings.
 *
 * Only surfaces one error at a time.
 */
export const useError = <T extends ErrorResponse>(defaultMessage: string = "An error occurred. Please try again later."): {
  error: SomeError | null;
  setError: (newError: SomeError | null) => void;
  setErrorAndNavigate: (newError: SomeError, path: string) => void;
} => {
  const navigate = useNavigate();
  const throttledToast = useThrottledToast();

  const [error, setError] = useState<SomeError | null>(null);

  useEffect(() => {
    if (error) {
      console.error(error)

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

  const setErrorAndNavigate = useCallback((error: SomeError, path: string) => {
    setError(error);

    setTimeout(() => {
      navigate(path);
    }, 100);
  }, [navigate]);

  return {
    error,
    setError,
    setErrorAndNavigate
  }
}
