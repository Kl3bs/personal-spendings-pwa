import { describe, it, expect } from "vitest";
import { parseCsvStatement, parseXlsxStatement, parsePdfStatement, categorizeTransaction, filterCurrentMonthTransactions } from "@/lib/statement-parser";
import * as XLSX from "xlsx";

describe("statement-parser engine", () => {
  describe("categorizeTransaction", () => {
    it("categorizes essencial items based on keywords", () => {
      expect(categorizeTransaction("Supermercado Carrefour")).toBe("essencial");
      expect(categorizeTransaction("Farmacia Drogasil")).toBe("essencial");
    });

    it("categorizes importante items based on keywords", () => {
      expect(categorizeTransaction("Curso Udemy Web Dev")).toBe("importante");
      expect(categorizeTransaction("Livraria Cultura")).toBe("importante");
    });

    it("categorizes superfluo items based on keywords", () => {
      expect(categorizeTransaction("Restaurante Outback")).toBe("superfluo");
      expect(categorizeTransaction("Assinatura Netflix")).toBe("superfluo");
      expect(categorizeTransaction("IFood Delivery")).toBe("superfluo");
    });

    it("defaults to essencial if no keyword matches", () => {
      expect(categorizeTransaction("Pagamento Aleatorio")).toBe("essencial");
    });
  });

  describe("parseCsvStatement", () => {
    it("parses CSV content with comma delimiter", () => {
      const csvData = `Data,Descricao,Valor\n2026-08-01,Supermercado Extra,-150.50\n2026-08-02,Restaurante Paris,-89.90`;
      const result = parseCsvStatement(csvData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        description: "Supermercado Extra",
        amount: 150.50,
        date: "2026-08-01",
        category: "essencial",
        isMonthlyBill: false,
      });
      expect(result[1]).toEqual({
        description: "Restaurante Paris",
        amount: 89.90,
        date: "2026-08-02",
        category: "superfluo",
        isMonthlyBill: false,
      });
    });

    it("parses CSV content with semicolon delimiter and DD/MM/YYYY dates", () => {
      const csvData = `Data;Descrição;Valor\n05/08/2026;Curso Udemy;45,00`;
      const result = parseCsvStatement(csvData);

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe("Curso Udemy");
      expect(result[0].amount).toBe(45);
      expect(result[0].date).toBe("2026-08-05");
      expect(result[0].category).toBe("importante");
    });

    it("parses CSV with DD-MM-YY date and thousand separators", () => {
      const csvData = `col1,col2,col3\n05-08-26,Compra Grande,"1.250,50"`;
      const result = parseCsvStatement(csvData);

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe("Compra Grande");
      expect(result[0].amount).toBe(1250.50);
      expect(result[0].date).toBe("2026-08-05");
    });

    it("handles empty CSV rows gracefully", () => {
      const csvData = `Data,Descricao,Valor\n\n,,`;
      const result = parseCsvStatement(csvData);
      expect(result).toHaveLength(0);
    });
  });

  describe("parseXlsxStatement", () => {
    it("parses XLSX buffer", () => {
      const wsData = [
        ["Data", "Descrição", "Valor"],
        ["2026-08-03", "Farmacia Raia", -35.20],
        ["2026-08-04", "Uber Trip", -22.50]
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Statement");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const result = parseXlsxStatement(Buffer.from(buffer));
      expect(result).toHaveLength(2);
      expect(result[0].description).toBe("Farmacia Raia");
      expect(result[0].amount).toBe(35.20);
      expect(result[0].category).toBe("essencial");
    });
  });

  describe("parsePdfStatement", () => {
    it("extracts transactions from text lines of PDF", () => {
      const pdfText = `
EXTRATO BANCARIO
01/08/2026 SUPERMERCADO DIA R$ 120,50
02/08/2026 IFOD*RESTAURANTE R$ 45,00
03/08/2026 SALARIO DEPOSITO R$ 5.000,00
      `;
      const result = parsePdfStatement(pdfText);

      expect(result).toHaveLength(2);
      expect(result[0].description).toBe("SUPERMERCADO DIA");
      expect(result[0].amount).toBe(120.50);
      expect(result[1].description).toBe("IFOD*RESTAURANTE");
      expect(result[1].amount).toBe(45);
    });
  });

  describe("filterCurrentMonthTransactions", () => {
    it("filters transactions to only keep current month items", () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");

      const items = [
        { description: "Item Mês Atual", amount: 100, date: `${year}-${month}-10`, category: "essencial" as const, isMonthlyBill: false },
        { description: "Item Mês Passado", amount: 50, date: "2025-01-01", category: "essencial" as const, isMonthlyBill: false },
        { description: "Item Data Invalida", amount: 20, date: "invalido", category: "essencial" as const, isMonthlyBill: false },
      ];

      const filtered = filterCurrentMonthTransactions(items);
      expect(filtered.map((i) => i.description)).toContain("Item Mês Atual");
      expect(filtered.map((i) => i.description)).not.toContain("Item Mês Passado");
    });
  });
});
