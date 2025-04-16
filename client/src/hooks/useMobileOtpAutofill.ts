import { useEffect } from 'react';
import { isMobile } from '../utils/helpers';
import { useThrottledToast } from './useThrottledToast';

export const useMobileOtpAutofill = (
  setOtpCode: (code: string) => void,
  handleOtpSubmit: () => void,
) => {
  const throttledToast = useThrottledToast();

  useEffect(() => {
    if (!isMobile() || !("OTPCredential" in window)) {
      return
    }

    const abortController = new AbortController();

    const fetchOtp = async () => {
      try {
        const content = await navigator.credentials.get({
          otp: { transport: ["sms"] },
          signal: abortController.signal,
        });

        if (!content) return;

        setOtpCode(content.code);
        handleOtpSubmit();
      } catch (error) {
        console.warn(error);
        throttledToast(
          "Couldn't paste your verification code automatically. Enter it manually.",
          "warning"
        );
      }
    };

    fetchOtp();

    return () => {
      abortController.abort();
    };
  }, [handleOtpSubmit, setOtpCode, throttledToast]);
};
