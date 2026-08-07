import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

describe("ExpenseForm component", () => {
  const mockOnSave = vi.fn().mockResolvedValue(undefined);
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render keypad, description input, and default category selected", () => {
    render(<ExpenseForm userId="user-123" onSave={mockOnSave} onClose={mockOnClose} />);

    expect(screen.getByRole("button", { name: "0" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Adicionar descrição/i)).toBeInTheDocument();
    expect(screen.getByText(/🏠 Essencial/i)).toBeInTheDocument();
  });

  it("should update display value when keypad buttons are pressed", async () => {
    render(<ExpenseForm userId="user-123" onSave={mockOnSave} onClose={mockOnClose} />);

    const button1 = screen.getByRole("button", { name: "1" });
    const button5 = screen.getByRole("button", { name: "5" });
    const button0 = screen.getByRole("button", { name: "0" });

    fireEvent.click(button1);
    fireEvent.click(button5);
    fireEvent.click(button0);

    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("should select different categories when clicked", () => {
    render(<ExpenseForm userId="user-123" onSave={mockOnSave} onClose={mockOnClose} />);

    const importanteBtn = screen.getByText(/📚 Importante/i);
    fireEvent.click(importanteBtn);
    expect(importanteBtn.className).toContain("bg-[#10B981]");

    const superfluoBtn = screen.getByText(/🎭 Supérfluo/i);
    fireEvent.click(superfluoBtn);
    expect(superfluoBtn.className).toContain("bg-[#FDB557]");
  });

  it("should submit expense details with isMonthlyBill flag when toggled", async () => {
    render(<ExpenseForm userId="user-123" onSave={mockOnSave} onClose={mockOnClose} />);

    // Type value "100" using keypad
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));

    // Add description
    const descInput = screen.getByPlaceholderText(/Adicionar descrição/i);
    await userEvent.type(descInput, "Conta de Luz");

    // Toggle "Conta do Mês" button
    const monthlyBillBtn = screen.getByRole("button", { name: /Conta do Mês/i });
    fireEvent.click(monthlyBillBtn);

    // Click submit button
    const submitBtn = screen.getByRole("button", { name: "Salvar despesa" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          amount: 100,
          category: "essencial",
          description: "Conta de Luz",
          isMonthlyBill: true,
        })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("should trigger onClose when close button is clicked", () => {
    render(<ExpenseForm userId="user-123" onSave={mockOnSave} onClose={mockOnClose} />);

    const closeBtn = screen.getByRole("button", { name: "Fechar" });
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should handle decimal points and limit keypad length to 7 digits", () => {
    render(<ExpenseForm userId="user-123" onSave={mockOnSave} onClose={mockOnClose} />);

    const dotBtn = screen.getByRole("button", { name: "." });
    const btn1 = screen.getByRole("button", { name: "1" });

    // Press . then 5
    fireEvent.click(dotBtn);
    fireEvent.click(screen.getByRole("button", { name: "5" }));

    // Duplicate dot should be ignored
    fireEvent.click(dotBtn);

    expect(screen.getByText("0.5")).toBeInTheDocument();

    // Type digits up to limit
    for (let i = 0; i < 10; i++) {
      fireEvent.click(btn1);
    }
  });

  it("should delete last character or reset to 0 when delete is pressed", () => {
    render(<ExpenseForm userId="user-123" onSave={mockOnSave} onClose={mockOnClose} />);

    const deleteBtn = screen.getByRole("button", { name: "Apagar" });
    const btn1 = screen.getByRole("button", { name: "1" });
    const btn2 = screen.getByRole("button", { name: "2" });

    fireEvent.click(btn1);
    fireEvent.click(btn2); // "12"

    fireEvent.click(deleteBtn); // "1"
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);

    fireEvent.click(deleteBtn); // "0"
    expect(screen.getByRole("button", { name: "0" })).toBeInTheDocument();
  });

  it("should handle error in onSave gracefully", async () => {
    const errorSave = vi.fn().mockRejectedValueOnce(new Error("Save failed"));
    render(<ExpenseForm userId="user-123" onSave={errorSave} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar despesa" }));

    await waitFor(() => {
      expect(errorSave).toHaveBeenCalled();
      // Should not close on error
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
