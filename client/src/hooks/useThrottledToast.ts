import { useCallback, useRef } from "react";
import { toast, ToastOptions } from "react-toastify";

export type ReducedTypeOptions = "info" | "success" | "warning" | "error";

/**
 * Don't spam the user with error messages. This is why they should also be console logged.
 *
 * @param limit
 * @returns {function(string, string, ToastOptions): void}
 */
export const useThrottledToast = (limit: number = 3000) => {
  const lastToastRef = useRef<number>(0);

  const showToast = useCallback(
    (
      message: string,
      type: ReducedTypeOptions = "info",
      options?: ToastOptions
    ): void => {
      const now = Date.now();

      if (now - lastToastRef.current > limit) {
        lastToastRef.current = now;

        toast[type](message, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          ...options,
        });
      }
    },
    [limit]
  );

  return showToast;
};
