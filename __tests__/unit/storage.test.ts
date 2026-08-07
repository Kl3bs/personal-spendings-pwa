import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadBankStatement } from "@/lib/firebase/storage";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn((_storage, path) => ({ fullPath: path })),
  uploadBytes: vi.fn().mockResolvedValue({ ref: { fullPath: "mock/path" } }),
  getDownloadURL: vi.fn().mockResolvedValue("https://storage.googleapis.com/mock/path"),
}));

vi.mock("@/lib/firebase/config", () => ({
  storage: {},
}));

describe("Firebase Storage Helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads CSV file to correct path under statements/{userId}/csv/", async () => {
    const file = new File(["col1,col2"], "extrato.csv", { type: "text/csv" });
    const result = await uploadBankStatement(file, "user-123");

    expect(ref).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringMatching(/^statements\/user-123\/csv\/\d+_extrato\.csv$/)
    );
    expect(uploadBytes).toHaveBeenCalled();
    expect(getDownloadURL).toHaveBeenCalled();
    expect(result.fileType).toBe("csv");
    expect(result.downloadUrl).toBe("https://storage.googleapis.com/mock/path");
  });

  it("uploads XLSX file to correct path under statements/{userId}/xlsx/", async () => {
    const file = new File(["dummy content"], "extrato.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const result = await uploadBankStatement(file, "user-123");

    expect(ref).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringMatching(/^statements\/user-123\/xlsx\/\d+_extrato\.xlsx$/)
    );
    expect(result.fileType).toBe("xlsx");
  });

  it("uploads PDF file to correct path under statements/{userId}/pdf/", async () => {
    const file = new File(["dummy pdf content"], "extrato.pdf", {
      type: "application/pdf",
    });
    const result = await uploadBankStatement(file, "user-123");

    expect(ref).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringMatching(/^statements\/user-123\/pdf\/\d+_extrato\.pdf$/)
    );
    expect(result.fileType).toBe("pdf");
  });

  it("throws error for unsupported file extensions", async () => {
    const file = new File(["hello"], "document.docx", { type: "application/docx" });
    await expect(uploadBankStatement(file, "user-123")).rejects.toThrow(
      "Formato de arquivo não suportado. Envie CSV, XLSX ou PDF."
    );
  });
});
