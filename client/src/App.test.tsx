import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the header", () => {
  render(<App />);
  const linkElement = screen.getByText(/BeReal, Wrapped./i);
  expect(linkElement).toBeInTheDocument();
});
