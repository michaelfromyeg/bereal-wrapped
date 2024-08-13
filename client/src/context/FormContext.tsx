import React, { createContext, ReactNode, useContext, useState } from "react";
import { MODES, Option, YEARS } from "../utils/constants";

interface FormState {
  phoneNumber: string;
  countryCode: string;
  otpSession: string;
  otpCode: string;
  token: string;
  berealToken: string;
  year: Option | null;
  file: File | null;
  disableMusic: boolean;
  displayDate: boolean;
  mode: Option | null;
  taskId: string;
  videoFilename: string;
}

interface FormContextType extends FormState {
  setPhoneNumber: (phoneNumber: string) => void;
  setCountryCode: (countryCode: string) => void;
  setOtpSession: (otpSession: string) => void;
  setOtpCode: (otpCode: string) => void;
  setToken: (token: string) => void;
  setBerealToken: (berealToken: string) => void;
  setYear: (year: Option | null) => void;
  setFile: (file: File | null) => void;
  setDisableMusic: (disableMusic: boolean) => void;
  setDisplayDate: (displayDate: boolean) => void;
  setMode: (mode: Option | null) => void;
  setTaskId: (taskId: string) => void;
  setVideoFilename: (videoFilename: string) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

interface FormProviderProps {
  children: ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("");
  const [otpSession, setOtpSession] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [berealToken, setBerealToken] = useState<string>("");
  const [year, setYear] = useState<Option | null>(YEARS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [disableMusic, setDisableMusic] = useState<boolean>(false);
  const [displayDate, setDisplayDate] = useState<boolean>(false);
  const [mode, setMode] = useState<Option | null>(MODES[0]);
  const [taskId, setTaskId] = useState<string>("");
  const [videoFilename, setVideoFilename] = useState<string>("");

  const value = {
    phoneNumber,
    setPhoneNumber,
    countryCode,
    setCountryCode,
    otpSession,
    setOtpSession,
    otpCode,
    setOtpCode,
    token,
    setToken,
    berealToken,
    setBerealToken,
    year,
    setYear,
    file,
    setFile,
    disableMusic,
    setDisableMusic,
    displayDate,
    setDisplayDate,
    mode,
    setMode,
    taskId,
    setTaskId,
    videoFilename,
    setVideoFilename,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
};
