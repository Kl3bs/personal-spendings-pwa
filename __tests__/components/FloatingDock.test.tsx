import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FloatingDock } from "@/components/ui/FloatingDock";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("FloatingDock component", () => {
  it("should render mobile floating dock links", () => {
    render(<FloatingDock />);

    expect(screen.getByTitle("Home")).toBeInTheDocument();
    expect(screen.getByTitle("Desafio 30d")).toBeInTheDocument();
    expect(screen.getByTitle("Orçamento")).toBeInTheDocument();
    expect(screen.getByTitle("Investimentos")).toBeInTheDocument();
    expect(screen.getByTitle("Ajustes")).toBeInTheDocument();
    expect(screen.getByText("Home (Ativo)")).toBeInTheDocument();
  });
});
