import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BudgetPage from "@/app/budget/page";
import { addInvestment } from "@/lib/firebase/firestore";

let mockUser: { uid: string; email: string; displayName?: string } | null = null;

let mockInvestments: Array<{ id: string; userId: string; amount: number; category: string; description: string; date: string }> = [];

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(mockUser);
    return () => {};
  }),
  getAuth: vi.fn(),
}));

vi.mock("@/lib/firebase/config", () => ({
  auth: {},
}));

vi.mock("@/lib/firebase/firestore", () => ({
  subscribeUserProfile: vi.fn((uid, cb) => {
    cb({ uid, displayName: "Lucas", baseIncome: 3500, extraIncome: 0 });
    return () => {};
  }),
  subscribeInvestments: vi.fn((uid, cb) => {
    cb(mockInvestments);
    return () => {};
  }),
  setUserProfile: vi.fn(),
  addInvestment: vi.fn().mockResolvedValue("new-id"),
}));

describe("BudgetPage component - Pagar Primeiro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { uid: "user-123", email: "lucas@example.com", displayName: "Lucas" };
    mockInvestments = [];
  });

  it("opens the InvestmentForm modal with pre-filled values when clicking 'Pagar Primeiro'", async () => {
    render(<BudgetPage />);

    await waitFor(() => {
      expect(screen.getByText("Orçamento & Metas")).toBeInTheDocument();
    });

    const payButton = screen.getByRole("button", { name: /pagar primeiro/i });
    expect(payButton).toBeInTheDocument();

    // Click Pagar Primeiro
    fireEvent.click(payButton);

    // Expect modal to be open and pre-filled
    await waitFor(() => {
      expect(screen.getByText("Novo Aporte de Investimento")).toBeInTheDocument();
    });

    // Check pre-filled inputs
    const descriptionInput = screen.getByDisplayValue("Aporte Mensal (Pay Yourself First)");
    expect(descriptionInput).toBeInTheDocument();

    // Base income = 3500, 15% allocation = 525
    const amountInput = screen.getByDisplayValue("525");
    expect(amountInput).toBeInTheDocument();
  });

  it("submits the investment form and calls addInvestment with the correct data", async () => {
    render(<BudgetPage />);

    await waitFor(() => {
      expect(screen.getByText("Orçamento & Metas")).toBeInTheDocument();
    });

    const payButton = screen.getByRole("button", { name: /pagar primeiro/i });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(screen.getByText("Novo Aporte de Investimento")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /salvar investimento/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(addInvestment).toHaveBeenCalledWith({
        userId: "user-123",
        amount: 525,
        category: "renda_fixa",
        description: "Aporte Mensal (Pay Yourself First)",
        date: expect.any(String),
      });
    });
  });

  it("disables the button and displays a success message when investment goal is reached", async () => {
    mockInvestments = [
      {
        id: "inv-1",
        userId: "user-123",
        amount: 600, // Goal is 525 (15% of 3500)
        category: "renda_fixa",
        description: "Aporte Tesouro",
        date: "2026-08-01",
      },
    ];

    render(<BudgetPage />);

    await waitFor(() => {
      expect(screen.getByText("Orçamento & Metas")).toBeInTheDocument();
    });

    // Success message check
    expect(
      screen.getByText(/Parabéns! Sua meta de investimento deste mês foi alcançada!/i)
    ).toBeInTheDocument();

    // Disabled button check
    const disabledButton = screen.getByRole("button", { name: /meta alcançada/i });
    expect(disabledButton).toBeDisabled();
  });
});
