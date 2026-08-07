import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BatchExpenseModal } from "@/components/expenses/BatchExpenseModal";
import { uploadBankStatement } from "@/lib/firebase/storage";
import { httpsCallable } from "firebase/functions";

vi.mock("@/lib/firebase/storage", () => ({
  uploadBankStatement: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(),
}));

describe("BatchExpenseModal component", () => {
  const mockOnSaveBatch = vi.fn().mockResolvedValue(undefined);
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial 2 expense rows, statement import dropzone and month filter checkbox", () => {
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
    expect(screen.getByText(/Importar Extrato Bancário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Apenas mês atual/i)).toBeInTheDocument();
  });

  it("allows adding a new row and removing a row", async () => {
    render(
      <BatchExpenseModal
        userId="user-123"
        onSaveBatch={mockOnSaveBatch}
        onClose={mockOnClose}
      />
    );

    const addButton = screen.getByRole("button", { name: /\+ Adicionar outro gasto/i });
    fireEvent.click(addButton);

    expect(screen.getAllByPlaceholderText(/Descrição do gasto/i)).toHaveLength(3);

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

    fireEvent.change(descInputs[0], { target: { value: "Almoço de Trabalho" } });
    fireEvent.change(amountInputs[0], { target: { value: "45.50" } });

    fireEvent.change(descInputs[1], { target: { value: "Supermercado" } });
    fireEvent.change(amountInputs[1], { target: { value: "154.50" } });
    const monthlyCheckboxes = screen.getAllByRole("checkbox", { name: /Conta do Mês/i });
    fireEvent.click(monthlyCheckboxes[1]);

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
          isMonthlyBill: false,
        }),
        expect.objectContaining({
          userId: "user-123",
          description: "Supermercado",
          amount: 154.5,
          category: "essencial",
          isMonthlyBill: true,
        }),
      ]);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("uploads statement to storage and populates form via Cloud Function", async () => {
    vi.mocked(uploadBankStatement).mockResolvedValue({
      downloadUrl: "https://storage.example.com/file.csv",
      storagePath: "statements/user-123/csv/123456_extrato.csv",
      fileType: "csv",
    });

    const mockCallable = vi.fn().mockResolvedValue({
      data: [
        { description: "Posto Shell", amount: 120.00, date: "2026-08-05", category: "essencial", isMonthlyBill: false },
        { description: "Padaria Real", amount: 25.50, date: "2026-08-06", category: "essencial", isMonthlyBill: false },
      ],
    });
    vi.mocked(httpsCallable).mockReturnValue(mockCallable as unknown as ReturnType<typeof httpsCallable>);

    render(
      <BatchExpenseModal
        userId="user-123"
        onSaveBatch={mockOnSaveBatch}
        onClose={mockOnClose}
      />
    );

    const fileInput = screen.getByTestId("statement-file-input");
    const file = new File(["col1,col2"], "extrato.csv", { type: "text/csv" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadBankStatement).toHaveBeenCalledWith(file, "user-123");
      expect(mockCallable).toHaveBeenCalledWith({
        storagePath: "statements/user-123/csv/123456_extrato.csv",
        fileType: "csv",
        onlyCurrentMonth: true,
      });
      expect(screen.getByDisplayValue("Posto Shell")).toBeInTheDocument();
      expect(screen.getByDisplayValue("120")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Padaria Real")).toBeInTheDocument();
    });
  });

  it("handles upload or parsing errors gracefully", async () => {
    vi.mocked(uploadBankStatement).mockRejectedValue(new Error("Falha no upload do arquivo"));

    render(
      <BatchExpenseModal
        userId="user-123"
        onSaveBatch={mockOnSaveBatch}
        onClose={mockOnClose}
      />
    );

    const fileInput = screen.getByTestId("statement-file-input");
    const file = new File(["dummy"], "extrato.csv", { type: "text/csv" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Falha no upload do arquivo")).toBeInTheDocument();
    });
  });

  it("shows message if cloud function returns no transactions", async () => {
    vi.mocked(uploadBankStatement).mockResolvedValue({
      downloadUrl: "https://storage.example.com/file.csv",
      storagePath: "statements/user-123/csv/123456_extrato.csv",
      fileType: "csv",
    });

    const mockCallable = vi.fn().mockResolvedValue({ data: [] });
    vi.mocked(httpsCallable).mockReturnValue(mockCallable as unknown as ReturnType<typeof httpsCallable>);

    render(
      <BatchExpenseModal
        userId="user-123"
        onSaveBatch={mockOnSaveBatch}
        onClose={mockOnClose}
      />
    );

    const fileInput = screen.getByTestId("statement-file-input");
    const file = new File(["dummy"], "extrato.csv", { type: "text/csv" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Nenhuma transação foi identificada no arquivo enviado.")).toBeInTheDocument();
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
