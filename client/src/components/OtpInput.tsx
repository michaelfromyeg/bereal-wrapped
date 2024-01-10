import { useEffect, useState } from "react";
import { useThrottledToast } from "../hooks/useThrottledToast";

interface Props {
  otpCode: string;
  setOtpCode: React.Dispatch<React.SetStateAction<string>>;
  handleOtpSubmit: () => void;
}

const OtpInput: React.FC<Props> = (props) => {
  const { otpCode, setOtpCode, handleOtpSubmit } = props;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const throttledToast = useThrottledToast();

  const handleKeyDown = (event: any) => {
    if (event.key === "Enter") {
      event.preventDefault();

      validateAndSubmitOtpCode();
    }
  };

  useEffect(() => {
    const abortController = new AbortController();

    const fetchOtp = async () => {
      if ("OTPCredential" in window) {
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
      }
    };

    fetchOtp();

    return () => {
      abortController.abort();
    };
  }, [setOtpCode, handleOtpSubmit, throttledToast]);

  const validateAndSubmitOtpCode = async () => {
    setError("");
    setLoading(true);

    try {
      if (otpCode.length !== 6) {
        setError("Verification code must be 6 digits long.");
      } else {
        await handleOtpSubmit();
      }
    } catch (error) {
      // this is unexpected; it means an error was thrown *in validation* or by handleOtpSubmit; just log it
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <label htmlFor="otpCode" className="block mb-2 text-sm">
        Verification Code*
      </label>
      <input
        className="block w-full p-2 mt-1 mb-3 border border-white rounded-md bg-transparent placeholder-white focus:border-white focus:outline-none"
        type="text"
        id="otpCode"
        autoComplete="one-time-code"
        placeholder="e.g., 123456"
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {error && (
        <div className="text-center text-red-500 text-sm mb-3">{error}</div>
      )}
      <button
        className="w-full mt-6 p-2 bg-white text-[#0f0f0f] font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={validateAndSubmitOtpCode}
        disabled={loading}
      >
        Validate verification code
      </button>
    </div>
  );
};

export default OtpInput;
