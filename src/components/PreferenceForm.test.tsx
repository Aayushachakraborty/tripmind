import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PreferenceForm } from "./PreferenceForm";

describe("PreferenceForm", () => {
  it("submits sanitised preferences", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PreferenceForm loading={false} onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText(/destination/i));
    await user.type(screen.getByLabelText(/destination/i), "<b>Udaipur</b>");
    await user.click(screen.getByRole("button", { name: /plan my trip/i }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ destination: "Udaipur" }));
  });
});
