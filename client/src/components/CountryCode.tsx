import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import React, { useEffect, useState } from "react";
import Select, { StylesConfig } from "react-select";
import { FilterOptionOption } from "react-select/dist/declarations/src/filters";
import { useFormContext } from "../context/FormContext";
import { getFlagEmoji } from "../utils/helpers";
import { Option } from "../utils/types";

const countries = getCountries();

const CountryCodeSelect: React.FC = () => {
  const { setCountryCode } = useFormContext();

  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [countryOptions, setCountryOptions] = useState<Option[]>([]);

  useEffect(() => {
    const options: Option[] = countries.map((countryCode: any) => {
      const phoneCode = getCountryCallingCode(countryCode);
      const countryName = new Intl.DisplayNames(["en"], { type: "region" }).of(
        countryCode
      );

      const flagEmoji = getFlagEmoji(countryCode);

      return {
        value: phoneCode,
        label: `${flagEmoji} ${countryCode} (+${phoneCode})`,
        searchLabels: [countryCode, `+${phoneCode}`, countryName || ""],
      };
    });

    setCountryOptions(options);
  }, []);

  const handleChange = (option: Option | null) => {
    setSelectedOption(option);

    if (option) {
      setCountryCode(option.value);
    }
  };

  const filterOption = (
    option: FilterOptionOption<Option>,
    inputValue: string
  ) => {
    const { data } = option;

    return data.searchLabels.some((label) =>
      label.toLowerCase().includes(inputValue.toLowerCase())
    );
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
        filterOption={filterOption}
      />
    </>
  );
};

export default CountryCodeSelect;

// TODO(michaelfromyeg): move this
export const customStyles: StylesConfig<Option, false> = {
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
    backgroundColor: state.isSelected
      ? "#373737"
      : state.isFocused
      ? "#003e54"
      : "transparent",
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
