import React, { useState, useEffect } from "react";
import Select, { StylesConfig } from "react-select";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import { useFormContext } from "../context/FormContext";

const countries = getCountries();

interface CountryOption {
  value: string;
  label: string;
}

// TODO(michaelfromyeg): move this
export const customStyles: StylesConfig<CountryOption, false> = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "transparent",
    color: "white",
    borderColor: "white",
    boxShadow: "none",
    ":hover": {
      borderColor: "white",
    },
    ...(state.isFocused && {
      borderColor: "white",
      boxShadow: "none",
    }),
  }),
  input: (provided) => ({
    ...provided,
    color: "white",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "#1e1e1e",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#373737" : "transparent",
    color: "white",
    "&:hover": {
      backgroundColor: "#003e54", // "#2a2a2a",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "white",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "white",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    color: "white",
  }),
  indicatorSeparator: (provided) => ({
    ...provided,
    backgroundColor: "transparent",
  }),
};

const CountryCodeSelect: React.FC = () => {
  const { setCountryCode } = useFormContext();

  const [selectedOption, setSelectedOption] = useState<CountryOption | null>(
    null
  );
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);

  useEffect(() => {
    const options: CountryOption[] = countries.map((countryCode: any) => {
      const phoneCode = getCountryCallingCode(countryCode);
      return {
        value: phoneCode,
        label: `${countryCode} (+${phoneCode})`,
      };
    });

    setCountryOptions(options);
  }, []);

  const handleChange = (option: CountryOption | null) => {
    setSelectedOption(option);

    if (option) {
      setCountryCode(option.value);
    }
  };

  return (
    <>
      <label htmlFor="countryCode" className="block mb-2 text-sm">
        Country Code*
      </label>
      <Select
        id="countryCode"
        value={selectedOption}
        onChange={handleChange}
        options={countryOptions}
        className="basic-single mb-3"
        styles={customStyles}
        classNamePrefix="select"
        placeholder="Select Country"
      />
    </>
  );
};

export default CountryCodeSelect;
