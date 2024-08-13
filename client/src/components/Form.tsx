// import axios from "axios";
// import React, { useEffect, useState } from "react";

// import Download from "./Download";
// import OtpInput from "./OtpInput";
// import PhoneInput from "./PhoneInput";
// import Processing from "./Processing";
// import Settings from "./Settings";

// import { useThrottledToast } from "../hooks/useThrottledToast";
// import { BASE_URL, MODES, Option, YEARS } from "../utils/constants";

// axios.defaults.withCredentials = true;

// type Stage =
//   | "phoneInput"
//   | "otpInput"
//   | "settings"
//   | "processing"
//   | "videoDisplay";

// // interface Session {
// //   countryCode: string;
// //   phoneNumber: string;
// //   otpSession: string;
// //   token: string;
// //   berealToken: string;
// // }

// const Form: React.FC = () => {
//   const [error, setError] = useState<any | null>(null);
//   const [stage, setStage] = useState<Stage>("phoneInput");
//   const [phoneNumber, setPhoneNumber] = useState<string>("");
//   const [countryCode, setCountryCode] = useState<string>("");
//   const [otpCode, setOtpCode] = useState<string>("");
//   const [otpSession, setOtpSession] = useState<any | null>(null);
//   const [token, setToken] = useState<string>("");
//   const [berealToken, setBerealToken] = useState<string>("");
//   const [year, setYear] = useState<Option | null>(YEARS[1]);
//   const [file, setFile] = useState<File | null>(null);
//   const [disableMusic, setDisableMusic] = useState<boolean>(false);
//   const [displayDate, setDisplayDate] = useState<boolean>(false);
//   const [mode, setMode] = useState<Option | null>(MODES[0]);
//   const [taskId, setTaskId] = useState<string>("");
//   const [videoFilename, setVideoFilename] = useState<string>("");

//   const throttledToast = useThrottledToast();

//   useEffect(() => {
//     const interceptor = axios.interceptors.response.use(
//       (response) => response,
//       (error) => {
//         // only log axios errors to the console
//         console.error(error);

//         return Promise.reject(error);
//       }
//     );

//     return () => {
//       axios.interceptors.response.eject(interceptor);
//     };
//   }, []);

//   useEffect(() => {
//     if (error) {
//       let errorMessage = "An error occurred";
//       if (
//         error.response &&
//         error.response.data &&
//         error.response.data.message
//       ) {
//         errorMessage = `Error: ${error.response.data.message}`;
//       } else if (error.request) {
//         errorMessage = "No response received from server";
//       } else if (error && error.message) {
//         errorMessage = error.message;
//       }

//       throttledToast(errorMessage, "error");
//       // localStorage.removeItem("session");
//       setStage("phoneInput");
//     }
//   }, [error, throttledToast]);

//   const handlePhoneSubmit = async (input: string) => {
//     // const session = localStorage.getItem("session");
//     // let sessionData: Session | null = session ? JSON.parse(session) : null;

//     // if (
//     //   sessionData &&
//     //   sessionData.countryCode === countryCode &&
//     //   sessionData.phoneNumber === phoneNumber
//     // ) {
//     //   setCountryCode(sessionData.countryCode);
//     //   setPhoneNumber(sessionData.phoneNumber);
//     //   setOtpSession(sessionData.otpSession);

//     //   setToken(sessionData.token);
//     //   setBerealToken(sessionData.berealToken);

//     //   setStage("settings");

//     //   return;
//     // }

//     try {
//       // localStorage.removeItem("session");
//       setPhoneNumber(input);

//       const response = await axios.post(`${BASE_URL}/request-otp`, {
//         phone: `${countryCode}${input}`,
//       });

//       setOtpSession(response.data?.otpSession);
//       setStage("otpInput");
//     } catch (error) {
//       if ((error as any).response && (error as any).response.status === 429) {
//         throttledToast((error as any).response.data.message, "error");
//       } else {
//         console.error("Error sending verification code:", error);
//         throttledToast(
//           "Couldn't send the verification code. Please try again.",
//           "error"
//         );
//       }
//     }
//   };

//   const handleOtpSubmit = async () => {
//     try {
//       const response = await axios.post(`${BASE_URL}/validate-otp`, {
//         otp_session: otpSession,
//         otp_code: otpCode,
//         phone: `${countryCode}${phoneNumber}`,
//       });

//       setToken(response.data?.token);
//       setBerealToken(response.data?.bereal_token);

//       // const sessionData: Session = {
//       //   countryCode,
//       //   phoneNumber,
//       //   token: response.data?.token,
//       //   berealToken: response.data?.berealToken,
//       //   otpSession,
//       // };

//       // localStorage.setItem("session", JSON.stringify(sessionData));

//       setStage("settings");
//     } catch (error) {
//       console.error("Error validating verification code:", error);
//       throttledToast(
//         "Couldn't validate your verification code. Please try again.",
//         "error"
//       );
//     }
//   };

//   const videoUrl = `${BASE_URL}/video/${videoFilename}?phone=${countryCode}${phoneNumber}&berealToken=${berealToken}`;

//   return (
//     <div className="w-screen p-6 flex flex-col items-center justify-center rounded-lg md:max-w-md max-w-xs mx-auto bg-subtle-radial text-white border border-1 border-white">
//       {stage === "phoneInput" && (
//         <PhoneInput
//           setCountryCode={setCountryCode}
//           setPhoneNumber={setPhoneNumber}
//           handlePhoneSubmit={handlePhoneSubmit}
//         />
//       )}
//       {stage === "otpInput" && (
//         <OtpInput
//           otpCode={otpCode}
//           setOtpCode={setOtpCode}
//           handleOtpSubmit={handleOtpSubmit}
//         />
//       )}
//       {stage === "settings" && (
//         <Settings
//           setYear={setYear}
//           setDisplayDate={setDisplayDate}
//           setMode={setMode}
//           setFile={setFile}
//           setDisableMusic={setDisableMusic}
//           handleSettingsSubmit={handleSettingsSubmit}
//           year={year}
//           displayDate={displayDate}
//           mode={mode}
//           file={file}
//           disableMusic={disableMusic}
//         />
//       )}
//       {stage === "processing" && (
//         <Processing
//           phone={`${countryCode}${phoneNumber}`}
//           berealToken={berealToken}
//           taskId={taskId}
//           setResult={setVideoFilename}
//           setError={setError}
//           setStage={setStage}
//         />
//       )}
//       {stage === "videoDisplay" && <Download href={videoUrl} />}
//     </div>
//   );
// };

// export default Form;
export {};
