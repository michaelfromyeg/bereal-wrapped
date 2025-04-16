import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "../context/FormContext";
import { SomeError, useError } from "../hooks/useError";
import { useMobileOtpAutofill } from "../hooks/useMobileOtpAutofill";
import axios from "../utils/axios";
import { BASE_URL } from "../utils/constants";

interface ValidateOtpResponse {
  token: string;
  bereal_token: string;
}

interface ErrorResponse {
  message: string;
}

const OtpInput: React.FC = () => {
  const {
    phoneNumber,
    countryCode,
    otpSession,
    otpCode,
    setOtpCode,
    setToken,
    setBerealToken,
  } = useFormContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const { error, setError } = useError<ErrorResponse>(
    "Couldn't validate your verification code. Please try again."
  );

  const handleKeyDown = (event: any): void => {
    if (event.key === "Enter") {
      event.preventDefault();

      validateAndSubmitOtpCode();
    }
  };

  const handleOtpSubmit = useCallback(async (): Promise<void> => {
    try {
      const response = await axios.post<ValidateOtpResponse>(
        `${BASE_URL}/validate-otp`,
        {
          otp_session: otpSession,
          otp_code: otpCode,
          phone: `${countryCode}${phoneNumber}`,
        }
      );

      setToken(response.data.token);
      setBerealToken(response.data.bereal_token);

      navigate("/settings");
    } catch (error) {
      setError(error as SomeError);
    }
  }, [
    countryCode,
    navigate,
    otpCode,
    otpSession,
    phoneNumber,
    setBerealToken,
    setError,
    setToken,
  ]);

  const validateAndSubmitOtpCode = async () => {
    setError(null);
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

  useMobileOtpAutofill(setOtpCode, handleOtpSubmit);

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
      {error && typeof error === "string" && (
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
