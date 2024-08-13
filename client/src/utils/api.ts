import axios from "axios";
import { BASE_URL } from "./constants";

export const handlePhoneSubmit = async (
  countryCode: string,
  phoneNumber: string,
  cb: (error: unknown) => null
): Promise<string | undefined> => {
  try {
    const response = await axios.post(`${BASE_URL}/request-otp`, {
      phone: `${countryCode}${phoneNumber}`,
    });

    return response.data?.otpSession;
  } catch (error) {
    cb(error);
  }
};
