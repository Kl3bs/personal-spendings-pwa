import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { describe, it, expect, beforeEach } from "vitest";

describe("ThemeToggle Component", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("should render theme toggle button", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole("button", { name: /alternar tema/i });
    expect(button).toBeInTheDocument();
  });

  it("should toggle theme between light and dark when clicked", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole("button", { name: /alternar tema/i });

    // Initial state: light
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    // Click -> dark
    await user.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Click -> light
    await user.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
