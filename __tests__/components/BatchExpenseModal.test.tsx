import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BatchExpenseModal } from "@/components/expenses/BatchExpenseModal";

describe("BatchExpenseModal component", () => {
  const mockOnSaveBatch = vi.fn().mockResolvedValue(undefined);
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial 2 expense rows and total amount of R$ 0.00", () => {
    render(
      <BatchExpenseModal
        userId="user-123"
        onSaveBatch={mockOnSaveBatch}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Cadastro em Lote de Gastos")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/Descrição do gasto/i)).toHaveLength(2);
    expect(screen.getByText("Cadastrar 2 Gastos (R$ 0,00)")).toBeInTheDocument();
  });

  it("allows adding a new row and removing a row", async () => {
    render(
      <BatchExpenseModal
        userId="user-123"
        onSaveBatch={mockOnSaveBatch}
        onClose={mockOnClose}
      />
    );

    // Click "+ Adicionar outro gasto"
    const addButton = screen.getByRole("button", { name: /\+ Adicionar outro gasto/i });
    fireEvent.click(addButton);

    expect(screen.getAllByPlaceholderText(/Descrição do gasto/i)).toHaveLength(3);

    // Remove the last row
    const deleteButtons = screen.getAllByRole("button", { name: /Remover item/i });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    expect(screen.getAllByPlaceholderText(/Descrição do gasto/i)).toHaveLength(2);
  });

  it("calculates total amount correctly and submits valid batch expenses", async () => {
    render(
      <BatchExpenseModal
        userId="user-123"
        onSaveBatch={mockOnSaveBatch}
        onClose={mockOnClose}
      />
    );

    const descInputs = screen.getAllByPlaceholderText(/Descrição do gasto/i);
    const amountInputs = screen.getAllByPlaceholderText("0.00");

    // Fill row 1
    fireEvent.change(descInputs[0], { target: { value: "Almoço de Trabalho" } });
    fireEvent.change(amountInputs[0], { target: { value: "45.50" } });

    // Fill row 2
    fireEvent.change(descInputs[1], { target: { value: "Supermercado" } });
    fireEvent.change(amountInputs[1], { target: { value: "154.50" } });

    await waitFor(() => {
      expect(screen.getByText("Cadastrar 2 Gastos (R$ 200,00)")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /Cadastrar 2 Gastos/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSaveBatch).toHaveBeenCalledWith([
        expect.objectContaining({
          userId: "user-123",
          description: "Almoço de Trabalho",
          amount: 45.5,
          category: "essencial",
        }),
        expect.objectContaining({
          userId: "user-123",
          description: "Supermercado",
          amount: 154.5,
          category: "essencial",
        }),
      ]);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("shows error if no row has a valid amount", async () => {
    render(
      <BatchExpenseModal
        userId="user-123"
        onSaveBatch={mockOnSaveBatch}
        onClose={mockOnClose}
      />
    );

    const submitButton = screen.getByRole("button", { name: /Cadastrar 2 Gastos/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Informe o valor de pelo menos um gasto/i)).toBeInTheDocument();
    });
    expect(mockOnSaveBatch).not.toHaveBeenCalled();
  });
});
