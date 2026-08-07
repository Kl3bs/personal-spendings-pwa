import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BudgetCategoryModal } from "@/components/budget/BudgetCategoryModal";
import { BudgetCategoryConfig } from "@/lib/firebase/firestore";

describe("BudgetCategoryModal component", () => {
  const mockCategories: BudgetCategoryConfig[] = [
    { id: "necessities", name: "Necessidades Básicas", percentage: 55, icon: "🏠", color: "#59C7DF" },
    { id: "investments", name: "Investimentos", percentage: 15, icon: "🎯", color: "#7C3AED", isInvestmentGoal: true },
    { id: "emergency", name: "Reserva de Emergência", percentage: 10, icon: "🛡️", color: "#F59E0B" },
    { id: "leisure", name: "Lazer & Estilo de Vida", percentage: 10, icon: "🎉", color: "#EC4899" },
    { id: "education", name: "Educação & Conhecimento", percentage: 10, icon: "🎓", color: "#8B5CF6" },
  ];

  const onSaveMock = vi.fn().mockResolvedValue(undefined);
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders initial categories and total percentage of 100%", () => {
    render(
      <BudgetCategoryModal
        initialCategories={mockCategories}
        onSave={onSaveMock}
        onClose={onCloseMock}
      />
    );

    expect(screen.getByText("Personalizar Categorias e Orçamento")).toBeInTheDocument();
    expect(screen.getByText(/100%/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Necessidades Básicas")).toBeInTheDocument();
    expect(screen.getByDisplayValue("55")).toBeInTheDocument();

    const saveButton = screen.getByRole("button", { name: /Salvar Alterações/i });
    expect(saveButton).not.toBeDisabled();
  });

  it("disables save button when sum of percentages is not 100%", async () => {
    render(
      <BudgetCategoryModal
        initialCategories={mockCategories}
        onSave={onSaveMock}
        onClose={onCloseMock}
      />
    );

    const input = screen.getByDisplayValue("55");
    fireEvent.change(input, { target: { value: "60" } }); // Total becomes 105%

    await waitFor(() => {
      expect(screen.getByText(/105%/)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /Salvar Alterações/i });
    expect(saveButton).toBeDisabled();
  });

  it("allows adding a new category and updating percentages to 100%", async () => {
    render(
      <BudgetCategoryModal
        initialCategories={mockCategories}
        onSave={onSaveMock}
        onClose={onCloseMock}
      />
    );

    // Reduce necessities from 55 to 45
    const inputNecessities = screen.getByDisplayValue("55");
    fireEvent.change(inputNecessities, { target: { value: "45" } });

    // Add new category button
    const addButton = screen.getByRole("button", { name: /Adicionar Categoria/i });
    fireEvent.click(addButton);

    // Enter name for new category
    const categoryInputs = screen.getAllByPlaceholderText(/Nome da categoria/i);
    const newCategoryInput = categoryInputs[categoryInputs.length - 1];
    fireEvent.change(newCategoryInput, { target: { value: "Viagens" } });

    // Enter percentage 10 for new category
    const percentageInputs = screen.getAllByRole("spinbutton");
    const newPercentageInput = percentageInputs[percentageInputs.length - 1];
    fireEvent.change(newPercentageInput, { target: { value: "10" } });

    await waitFor(() => {
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /Salvar Alterações/i });
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSaveMock).toHaveBeenCalled();
    });
  });

  it("handles decimal percentages cleanly without float precision issues", () => {
    const decimalCategories: BudgetCategoryConfig[] = [
      { id: "c1", name: "Cat 1", percentage: 33.33 },
      { id: "c2", name: "Cat 2", percentage: 33.33 },
      { id: "c3", name: "Cat 3", percentage: 33.34 },
    ];
    render(
      <BudgetCategoryModal
        initialCategories={decimalCategories}
        onSave={onSaveMock}
        onClose={onCloseMock}
      />
    );

    const saveButton = screen.getByRole("button", { name: /Salvar Alterações/i });
    expect(saveButton).not.toBeDisabled();
  });
});
