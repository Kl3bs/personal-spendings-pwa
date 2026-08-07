import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedExpenseItem {
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: "essencial" | "importante" | "superfluo";
  isMonthlyBill: boolean;
}

/**
 * Heuristic keyword categorizer for bank transaction descriptions
 */
export function categorizeTransaction(description: string): "essencial" | "importante" | "superfluo" {
  const lower = description.toLowerCase();

  const superfluoKeywords = [
    "restaurante", "outback", "mcdonald", "burger", "ifood", "uber eats",
    "netflix", "spotify", "prime video", "hbo", "disney", "cinema", "ingressos",
    "bar", "cerveja", "chopp", "jogos", "steam", "playstation", "xbox", "festas"
  ];

  const importanteKeywords = [
    "curso", "udemy", "alura", "livro", "livraria", "faculdade", "escola",
    "workshop", "treinamento", "certificacao", "exame", "medico", "dentista", "saude"
  ];

  if (superfluoKeywords.some((k) => lower.includes(k))) {
    return "superfluo";
  }

  if (importanteKeywords.some((k) => lower.includes(k))) {
    return "importante";
  }

  return "essencial";
}

/**
 * Helper to normalize date strings (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD) into YYYY-MM-DD format
 */
function normalizeDate(rawDate: string): string {
  const todayStr = new Date().toISOString().split("T")[0];
  if (!rawDate) return todayStr;

  const clean = rawDate.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1].padStart(2, "0");
    const month = ddmmyyyyMatch[2].padStart(2, "0");
    const year = ddmmyyyyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // DD/MM/YY
  const ddmmyyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (ddmmyyMatch) {
    const day = ddmmyyMatch[1].padStart(2, "0");
    const month = ddmmyyMatch[2].padStart(2, "0");
    const year = `20${ddmmyyMatch[3]}`;
    return `${year}-${month}-${day}`;
  }

  return todayStr;
}

/**
 * Parses numeric amount strings (e.g. "-150.50", "R$ 45,00", "154,50") into positive number
 */
function parseAmount(val: unknown): number {
  if (typeof val === "number") {
    return Math.abs(val);
  }
  if (!val) return 0;

  let str = String(val).trim().replace(/R\$\s?/gi, "");
  // Replace thousand separators if comma is used for decimal
  if (str.includes(",") && str.includes(".")) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else if (str.includes(",")) {
    str = str.replace(",", ".");
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
}

/**
 * Parses CSV statement content
 */
export function parseCsvStatement(csvText: string): ParsedExpenseItem[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const results: ParsedExpenseItem[] = [];

  const records = parsed.data.length > 0 ? parsed.data : [];
  for (const row of records) {
    const keys = Object.keys(row);
    if (keys.length === 0) continue;

    let dateVal = "";
    let descVal = "";
    let amountVal = "";

    for (const key of keys) {
      const kLower = key.toLowerCase();
      if (kLower.includes("data") || kLower.includes("date")) {
        dateVal = row[key];
      } else if (kLower.includes("desc") || kLower.includes("historico") || kLower.includes("title") || kLower.includes("memo")) {
        descVal = row[key];
      } else if (kLower.includes("valor") || kLower.includes("amount")) {
        amountVal = row[key];
      }
    }

    // Fallback position-based if header matching fails
    if (!descVal || !amountVal) {
      const values = Object.values(row);
      if (values.length >= 3) {
        dateVal = dateVal || values[0];
        descVal = descVal || values[1];
        amountVal = amountVal || values[2];
      }
    }

    const amount = parseAmount(amountVal);
    const description = (descVal || "Gasto extrato").trim();
    if (amount > 0 && description) {
      results.push({
        description,
        amount,
        date: normalizeDate(dateVal),
        category: categorizeTransaction(description),
        isMonthlyBill: false,
      });
    }
  }

  return results;
}

/**
 * Parses XLSX statement buffer
 */
export function parseXlsxStatement(buffer: Buffer | ArrayBuffer): ParsedExpenseItem[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const results: ParsedExpenseItem[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row) || row.length < 2) continue;

    // Skip headers if line contains words like "Data", "Descrição"
    const rowStr = row.join(" ").toLowerCase();
    if (rowStr.includes("descrição") && rowStr.includes("valor")) continue;

    let dateVal = "";
    let descVal = "";
    let amountVal: unknown = null;

    for (const cell of row) {
      if (cell === null || cell === undefined) continue;
      const strCell = String(cell).trim();

      if (/^\d{4}-\d{2}-\d{2}$/.test(strCell) || /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(strCell)) {
        dateVal = strCell;
      } else if (typeof cell === "number" || /^-?\d+([.,]\d+)?$/.test(strCell) || strCell.includes("R$")) {
        amountVal = cell;
      } else if (strCell.length > 2 && !descVal) {
        descVal = strCell;
      }
    }

    const amount = parseAmount(amountVal);
    const description = (descVal || "").trim();

    if (amount > 0 && description) {
      results.push({
        description,
        amount,
        date: normalizeDate(dateVal),
        category: categorizeTransaction(description),
        isMonthlyBill: false,
      });
    }
  }

  return results;
}

/**
 * Parses raw text extracted from PDF bank statement lines
 */
export function parsePdfStatement(pdfText: string): ParsedExpenseItem[] {
  const lines = pdfText.split("\n");
  const results: ParsedExpenseItem[] = [];

  // Match pattern: DATE DESCRIPTION AMOUNT (e.g., 01/08/2026 SUPERMERCADO R$ 120,50 or 2026-08-01 Uber -25.50)
  const lineRegex = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?R\$\s*[\d.,]+|-?[\d.,]+)$/i;

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;

    const match = cleanLine.match(lineRegex);
    if (match) {
      const rawDate = match[1];
      const description = match[2].trim();
      const rawAmount = match[3];

      // Ignore credit/income lines if explicitly marked as credit or deposit
      if (description.toLowerCase().includes("salario") || description.toLowerCase().includes("deposito")) {
        continue;
      }

      const amount = parseAmount(rawAmount);
      if (amount > 0 && description) {
        results.push({
          description,
          amount,
          date: normalizeDate(rawDate),
          category: categorizeTransaction(description),
          isMonthlyBill: false,
        });
      }
    }
  }

  return results;
}

/**
 * Filters parsed transactions to only keep items from current year and month
 */
export function filterCurrentMonthTransactions(items: ParsedExpenseItem[]): ParsedExpenseItem[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return items.filter((item) => {
    if (!item.date) return true;
    const parts = item.date.split("-");
    if (parts.length < 2) return true;

    const itemYear = parseInt(parts[0], 10);
    const itemMonth = parseInt(parts[1], 10);

    return itemYear === currentYear && itemMonth === currentMonth;
  });
}
