import { Options } from "react-select";
import { Option } from "./types";

export const debounce = (
  func: (...args: unknown[]) => void,
  delay: number
): ((...args: unknown[]) => void) => {
  let timerId: NodeJS.Timeout | null = null;

  return (...args: unknown[]) => {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export const isSecondHalfOfYear = () => new Date().getMonth() >= 6;

export const getFlagEmoji = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const isMobile = (): boolean => {
  const ua = navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
};

export const generateYearOptions = (numberOfYears: number = 5): Options<Option> => {
  const currentYear = new Date().getFullYear();
  const years: Option[] = [];

  for (let i = 0; i < Math.min(numberOfYears, 2); i++) {
    const year = (currentYear - i).toString();
    years.push({
      value: year,
      label: year,
      searchLabels: [year],
    });
  }

  return years;
};
