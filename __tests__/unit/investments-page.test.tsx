import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InvestmentsPage from "@/app/investments/page";

let mockUser: unknown = null;
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
    cb({ uid, baseIncome: 5000, extraIncome: 0 });
    return () => {};
  }),
  subscribeInvestments: vi.fn((uid, cb) => {
    cb([
      {
        id: "inv-1",
        userId: "user-1",
        amount: 500,
        category: "renda_fixa",
        description: "CDB 100% CDI",
        date: "2026-08-01",
      },
    ]);
    return () => {};
  }),
  addInvestment: vi.fn(),
  updateInvestment: vi.fn(),
  deleteInvestment: vi.fn(),
}));

describe("InvestmentsPage component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render investments page title, overview cards, and list", async () => {
    mockUser = { uid: "user-1", email: "kleber@test.com" };

    render(<InvestmentsPage />);

    await waitFor(() => {
      expect(screen.getByText("Painel de Investimentos")).toBeInTheDocument();
      expect(screen.getByText("Investido no Mês")).toBeInTheDocument();
      expect(screen.getByText("CDB 100% CDI")).toBeInTheDocument();
    });
  });
});
