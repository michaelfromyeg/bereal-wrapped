import React, { useState, useEffect } from "react";
import Select from "react-select";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";

const countries = getCountries();

interface CountryOption {
  value: string;
  label: string;
}

interface Props {
  setCountryCode: Function;
}

const CountryCodeSelect: React.FC<Props> = (props: Props) => {
  const { setCountryCode } = props;

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
      console.log(option.value);
      setCountryCode(option.value);
    }
  };

  return (
    <>
      <label
        htmlFor="countryCode"
        className="block text-sm font-medium text-gray-700"
      >
        Country Code
      </label>
      <Select
        id="countryCode"
        value={selectedOption}
        onChange={handleChange}
        options={countryOptions}
        className="basic-single mb-4"
        classNamePrefix="select"
        placeholder="Select Country"
      />
    </>
  );
};

export default CountryCodeSelect;
