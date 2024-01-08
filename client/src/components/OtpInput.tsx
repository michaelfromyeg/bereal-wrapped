import { useEffect, useState } from "react";

interface Props {
  otpCode: string;
  setOtpCode: React.Dispatch<React.SetStateAction<string>>;
  handleOtpSubmit: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const OtpInput: React.FC<Props> = (props) => {
  const { otpCode, setOtpCode, handleOtpSubmit, handleKeyDown } = props;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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
          console.error(error);
        }
      }
    };

    fetchOtp();

    return () => {
      abortController.abort();
    };
  }, [setOtpCode, handleOtpSubmit]);

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <label
        htmlFor="otpCode"
        className="block text-sm font-medium text-gray-700"
      >
        Verification Code
      </label>
      <input
        className="block w-full p-2 mt-1 mb-4 border border-gray-300 rounded-md"
        type="text"
        id="otpCode"
        autoComplete="one-time-code"
        placeholder="e.g., 123456"
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <button
        className="w-full py-2 mb-4 text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={validateAndSubmitOtpCode}
        disabled={loading}
      >
        Validate verification code
      </button>
    </>
  );
};

export default OtpInput;
