import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppShell } from "@/components/ui/AppShell";

let mockPathname = "/dashboard";
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));

let mockUser: any = null;
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(mockUser);
    return () => {};
  }),
  signOut: vi.fn(),
  getAuth: vi.fn(),
}));

vi.mock("@/lib/firebase/config", () => ({
  auth: {},
}));

vi.mock("@/lib/firebase/firestore", () => ({
  subscribeUserProfile: vi.fn((uid, cb) => {
    cb({ uid, displayName: "Kleber User", email: "kleber@test.com" });
    return () => {};
  }),
}));

describe("AppShell component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render public layout directly without shell headers on /login", () => {
    mockPathname = "/login";
    mockUser = null;

    render(
      <AppShell>
        <div data-testid="login-content">Login Page Content</div>
      </AppShell>
    );

    expect(screen.getByTestId("login-content")).toBeInTheDocument();
    expect(screen.queryByText("BudgetNest")).not.toBeInTheDocument();
  });

  it("should render header, sidebar and children when user is authenticated on protected route", async () => {
    mockPathname = "/dashboard";
    mockUser = { uid: "user-1", email: "kleber@test.com", displayName: "Kleber User" };

    render(
      <AppShell>
        <div data-testid="protected-content">Dashboard Content</div>
      </AppShell>
    );

    await waitFor(() => {
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      expect(screen.getByText("BudgetNest")).toBeInTheDocument();
      expect(screen.getAllByText("Kleber User")[0]).toBeInTheDocument();
    });
  });

  it("should trigger signOut when logout button is clicked", async () => {
    mockPathname = "/dashboard";
    mockUser = { uid: "user-1", email: "kleber@test.com", displayName: "Kleber User" };

    const { signOut } = await import("firebase/auth");

    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    await waitFor(() => {
      const logoutBtn = screen.getByTitle("Sair");
      logoutBtn.click();
      expect(signOut).toHaveBeenCalled();
    });
  });
});
