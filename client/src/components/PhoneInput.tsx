import { useState } from "react";
import CountryCode from "./CountryCode";

interface Props {
  setCountryCode: React.Dispatch<React.SetStateAction<string>>;
  setPhoneNumber: React.Dispatch<React.SetStateAction<string>>;
  handlePhoneSubmit: (input: string) => void;
}

const PhoneInput: React.FC<Props> = (props) => {
  const { setCountryCode, handlePhoneSubmit } = props;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [input, setInput] = useState<string>("");

  const handleKeyDown = (event: any) => {
    if (event.key === "Enter") {
      event.preventDefault();

      validateAndSubmitPhoneNumber();
    }
  };

  const validateAndSubmitPhoneNumber = async () => {
    setError("");
    setLoading(true);

    const phoneNumber = input.replace(/[- ]/g, "");
    try {
      if (!/^\d+$/.test(phoneNumber)) {
        setError("Phone number must be digits from 0-9.");
      } else if (phoneNumber.length !== 10) {
        setError("Phone number must be 10 digits long.");
      } else {
        await handlePhoneSubmit(phoneNumber);
      }
    } catch (error) {
      // this is unexpected; it means an error was thrown *in validation* or by handlePhoneSubmit; just log it
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <p className="text-center text-md max-w-sm mb-3">
        Requires your phone number. Videos are deleted after 24-hours and only
        accessible by you. No other data is stored by this service.
      </p>
      <CountryCode setCountryCode={setCountryCode} />
      <label htmlFor="phoneNumber" className="block mb-2 text-sm">
        Phone Number*
      </label>
      <input
        type="tel"
        pattern="[0-9]{10}"
        id="phoneNumber"
        className="block w-full p-2 mt-1 mb-3 border border-white rounded-md bg-transparent placeholder-white focus:border-white focus:outline-none"
        placeholder="e.g., 123-456-7890"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {error && (
        <div className="text-center text-red-500 text-sm mb-3">{error}</div>
      )}
      <button
        className="w-full mt-6 p-2 bg-white text-[#0f0f0f] font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={validateAndSubmitPhoneNumber}
        disabled={loading}
      >
        Send verification code
      </button>
    </div>
  );
};

export default PhoneInput;
