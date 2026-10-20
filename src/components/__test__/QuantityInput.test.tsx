import { render, screen } from "@testing-library/react";
import QuantityInput from "../layouts/QuantityInput";

it("renders the quantity controls", () => {
  render(
    <QuantityInput
      value={1}
      addOneHandler={function (): void {
        throw new Error("Function not implemented.");
      }}
      minusOneHandler={function (): void {
        throw new Error("Function not implemented.");
      }}
    />,
  );

  expect(screen.getByLabelText("Sumar uno")).toBeInTheDocument();
  expect(screen.getByLabelText("Restar uno")).toBeInTheDocument();

  //   expect(screen.getByText("section description.")).toBeInTheDocument()
});
