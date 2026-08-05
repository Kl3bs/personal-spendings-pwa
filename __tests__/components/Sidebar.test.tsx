import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Sidebar } from "@/components/ui/Sidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

// Mock firebase/auth
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({ uid: "user-123", email: "kleber@example.com", displayName: "Kleber" });
    return () => {};
  }),
  signOut: vi.fn(),
  getAuth: vi.fn(),
}));

// Mock firebase config & firestore
vi.mock("@/lib/firebase/config", () => ({
  auth: {},
}));

vi.mock("@/lib/firebase/firestore", () => ({
  subscribeUserProfile: vi.fn((uid, cb) => {
    cb({ uid, displayName: "Kleber Vasconcelos", email: "kleber@example.com" });
    return () => {};
  }),
}));

describe("Sidebar component", () => {
  it("should render branding and navigation items", () => {
    render(<Sidebar />);

    expect(screen.getByText("Gastos")).toBeInTheDocument();
    expect(screen.getByText("Conscientes PWA")).toBeInTheDocument();

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Desafio 30 Dias")).toBeInTheDocument();
    expect(screen.getByText("Orçamento & Metas")).toBeInTheDocument();
    expect(screen.getByText("Configurações")).toBeInTheDocument();
  });

  it("should render authenticated user profile card", () => {
    render(<Sidebar />);

    expect(screen.getByText("Kleber Vasconcelos")).toBeInTheDocument();
    expect(screen.getByText("kleber@example.com")).toBeInTheDocument();
    expect(screen.getByText("Sair da Conta")).toBeInTheDocument();
  });
});
