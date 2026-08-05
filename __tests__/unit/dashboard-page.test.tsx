import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "@/app/dashboard/page";

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
    cb({
      uid,
      displayName: "Lucas",
      baseIncome: 5000,
      extraIncome: 0,
      budgetCategories: [
        { id: "cat-1", name: "Moradia & Contas", percentage: 50, icon: "🏠", color: "#0284C7" },
        { id: "cat-2", name: "Investimentos", percentage: 20, icon: "🎯", color: "#0F766E", isInvestmentGoal: true },
        { id: "cat-3", name: "Lazer & Hobbies", percentage: 30, icon: "🎉", color: "#EC4899" },
      ],
    });
    return () => {};
  }),
  subscribeExpenses: vi.fn((uid, cb) => {
    cb([]);
    return () => {};
  }),
  subscribeInvestments: vi.fn((uid, cb) => {
    cb(mockInvestments);
    return () => {};
  }),
  setUserProfile: vi.fn(),
}));

describe("DashboardPage component - Dynamic Categories & Emerald Theme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { uid: "user-123", email: "lucas@example.com", displayName: "Lucas" };
    mockInvestments = [];
  });

  it("renders custom categories in the distribution section dynamically", async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Overview")).toBeInTheDocument();
    });

    // Check dynamic categories in distribution legend
    expect(screen.getByText(/Moradia & Contas/i)).toBeInTheDocument();
    expect(screen.getByText(/Lazer & Hobbies/i)).toBeInTheDocument();
  });

  it("shows Meta Alcançada badge on the Dashboard investment card when goal is reached", async () => {
    mockInvestments = [
      {
        id: "inv-1",
        userId: "user-123",
        amount: 1000, // Goal is 1000 (20% of 5000)
        category: "renda_fixa",
        description: "Aporte Tesouro",
        date: "2026-08-01",
      },
    ];

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Overview")).toBeInTheDocument();
    });

    expect(screen.getByText(/Meta Alcançada/i)).toBeInTheDocument();
  });

  it("toggles the chart view mode between 6 Meses and Semanas", async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Overview")).toBeInTheDocument();
    });

    const weeksButton = screen.getByRole("button", { name: /semanas/i });
    expect(weeksButton).toBeInTheDocument();

    fireEvent.click(weeksButton);

    expect(screen.getByText("Sem 1")).toBeInTheDocument();
  });

  it("renders information tooltip explaining income calculation", async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Overview")).toBeInTheDocument();
    });

    expect(screen.getByText(/Como a Renda é calculada\?/i)).toBeInTheDocument();
  });
});
