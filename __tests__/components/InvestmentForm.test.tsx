import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { InvestmentForm } from "@/components/investments/InvestmentForm";
import { Investment } from "@/lib/firebase/firestore";

describe("InvestmentForm component", () => {
  const mockOnSave = vi.fn().mockResolvedValue(undefined);
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render investment modal form with fields and categories", () => {
    render(
      <InvestmentForm
        userId="user-123"
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Novo Aporte de Investimento")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/0,00/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: CDB Banco Inter/i)).toBeInTheDocument();
    expect(screen.getByText(/Renda Fixa/i)).toBeInTheDocument();
    expect(screen.getByText(/Ações & FIIs/i)).toBeInTheDocument();
    expect(screen.getByText(/Reserva de Emergência/i)).toBeInTheDocument();
  });

  it("should populate form fields when editing an existing investment", () => {
    const existing: Investment = {
      id: "inv-1",
      userId: "user-123",
      amount: 1500,
      category: "acoes_fiis",
      description: "IVVB11 ETF",
      date: "2026-08-05",
    };

    render(
      <InvestmentForm
        userId="user-123"
        initialData={existing}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Editar Investimento")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1500")).toBeInTheDocument();
    expect(screen.getByDisplayValue("IVVB11 ETF")).toBeInTheDocument();
  });

  it("should submit new investment data correctly", async () => {
    render(
      <InvestmentForm
        userId="user-123"
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const amountInput = screen.getByPlaceholderText(/0,00/i);
    const descInput = screen.getByPlaceholderText(/Ex: CDB Banco Inter/i);

    await userEvent.type(amountInput, "500");
    await userEvent.type(descInput, "Tesouro Selic 2029");

    const saveBtn = screen.getByRole("button", { name: "Salvar Investimento" });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        userId: "user-123",
        amount: 500,
        category: "renda_fixa",
        description: "Tesouro Selic 2029",
        date: expect.any(String),
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
