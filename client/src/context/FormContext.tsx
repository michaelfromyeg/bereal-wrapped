import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { MODES, YEARS } from "../utils/constants";
import { isSecondHalfOfYear } from "../utils/helpers";
import { Option } from "../utils/types";

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

  reset: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

interface FormProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "formState";

const getInitialState = (): FormState => {
  const storedState = localStorage.getItem(STORAGE_KEY);

  if (storedState) {
    const parsedState = JSON.parse(storedState);
    parsedState.year = parsedState.year
      ? YEARS.find((y) => y.value === parsedState.year.value) || null
      : null;
    parsedState.mode = parsedState.mode
      ? MODES.find((m) => m.value === parsedState.mode.value) || null
      : null;
    parsedState.file = null;
    return parsedState;
  }

  return {
    phoneNumber: "",
    countryCode: "",
    otpSession: "",
    otpCode: "",
    token: "",
    berealToken: "",
    year: isSecondHalfOfYear() ? YEARS[0] : YEARS[1],
    file: null,
    disableMusic: false,
    displayDate: false,
    mode: MODES[0],
    taskId: "",
    videoFilename: "",
  };
};

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [state, setState] = useState<FormState>(getInitialState);

  // mirror writes to localStorage
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, file: undefined })
    );
  }, [state]);

  const setStateAndStore = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setState((prevState) => ({ ...prevState, [key]: value }));
  };

  const value: FormContextType = {
    ...state,
    setPhoneNumber: (value) => setStateAndStore("phoneNumber", value),
    setCountryCode: (value) => setStateAndStore("countryCode", value),
    setOtpSession: (value) => setStateAndStore("otpSession", value),
    setOtpCode: (value) => setStateAndStore("otpCode", value),
    setToken: (value) => setStateAndStore("token", value),
    setBerealToken: (value) => setStateAndStore("berealToken", value),
    setYear: (value) => setStateAndStore("year", value),
    setFile: (value) => setStateAndStore("file", value),
    setDisableMusic: (value) => setStateAndStore("disableMusic", value),
    setDisplayDate: (value) => setStateAndStore("displayDate", value),
    setMode: (value) => setStateAndStore("mode", value),
    setTaskId: (value) => setStateAndStore("taskId", value),
    setVideoFilename: (value) => setStateAndStore("videoFilename", value),
    reset: () => {
      localStorage.removeItem(STORAGE_KEY);
      setState(getInitialState());
    },
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
