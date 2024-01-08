import { useState } from "react";
import CountryCode from "./CountryCode";

interface Props {
  setCountryCode: React.Dispatch<React.SetStateAction<string>>;
  setPhoneNumber: React.Dispatch<React.SetStateAction<string>>;
  phoneNumber: string;
  handlePhoneSubmit: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const PhoneInput: React.FC<Props> = (props) => {
  const {
    setCountryCode,
    setPhoneNumber,
    phoneNumber,
    handlePhoneSubmit,
    handleKeyDown,
  } = props;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const validateAndSubmitPhoneNumber = async () => {
    setError("");
    setLoading(true);

    try {
      if (phoneNumber.includes(" ") || phoneNumber.includes("-")) {
        setError("Phone number cannot contain spaces or dashes.");
      } else if (phoneNumber.length !== 10) {
        setError("Phone number must be 10 digits long.");
      } else {
        await handlePhoneSubmit();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CountryCode setCountryCode={setCountryCode} />
      <label
        htmlFor="phoneNumber"
        className="block text-sm font-medium text-gray-700"
      >
        Phone Number
      </label>
      <input
        type="tel"
        pattern="[0-9]{10}"
        id="phoneNumber"
        className="block w-full p-2 mt-1 mb-4 border border-gray-300 rounded-md"
        placeholder="e.g., 7806809634"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <button
        className="w-full py-2 mb-4 text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={validateAndSubmitPhoneNumber}
        disabled={loading}
      >
        Send verification code
      </button>
    </>
  );
};

export default PhoneInput;
