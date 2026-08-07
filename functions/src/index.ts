import * as functions from "firebase-functions";
import { initializeApp, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import pdfParse from "pdf-parse";

if (!getApps().length) {
  initializeApp();
}

interface ParseRequest {
  storagePath: string;
  fileType: "csv" | "xlsx" | "pdf";
  onlyCurrentMonth?: boolean;
}

export interface ParsedExpenseItem {
  description: string;
  amount: number;
  date: string;
  category: "essencial" | "importante" | "superfluo";
  isMonthlyBill: boolean;
}

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

  if (superfluoKeywords.some((k) => lower.includes(k))) return "superfluo";
  if (importanteKeywords.some((k) => lower.includes(k))) return "importante";
  return "essencial";
}

function normalizeDate(rawDate: string): string {
  const todayStr = new Date().toISOString().split("T")[0];
  if (!rawDate) return todayStr;
  const clean = rawDate.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  const ddmmyyyyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyyMatch) {
    return `${ddmmyyyyMatch[3]}-${ddmmyyyyMatch[2].padStart(2, "0")}-${ddmmyyyyMatch[1].padStart(2, "0")}`;
  }
  return todayStr;
}

function parseAmount(val: unknown): number {
  if (typeof val === "number") return Math.abs(val);
  if (!val) return 0;
  let str = String(val).trim().replace(/R\$\s?/gi, "");
  if (str.includes(",") && str.includes(".")) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else if (str.includes(",")) {
    str = str.replace(",", ".");
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
}

export function parseCsvContent(csvText: string): ParsedExpenseItem[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
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
      if (kLower.includes("data") || kLower.includes("date")) dateVal = row[key];
      else if (kLower.includes("desc") || kLower.includes("historico")) descVal = row[key];
      else if (kLower.includes("valor") || kLower.includes("amount")) amountVal = row[key];
    }

    if (!descVal || !amountVal) {
      const values = Object.values(row);
      if (values.length >= 3) {
        dateVal = dateVal || String(values[0] || "");
        descVal = descVal || String(values[1] || "");
        amountVal = amountVal || String(values[2] || "");
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

export function parseXlsxBuffer(buffer: Buffer): ParsedExpenseItem[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const results: ParsedExpenseItem[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row) || row.length < 2) continue;
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

export function parsePdfText(pdfText: string): ParsedExpenseItem[] {
  const lines = pdfText.split("\n");
  const results: ParsedExpenseItem[] = [];
  const lineRegex = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?R\$\s*[\d.,]+|-?[\d.,]+)$/i;

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    const match = cleanLine.match(lineRegex);
    if (match) {
      const rawDate = match[1];
      const description = match[2].trim();
      const rawAmount = match[3];

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

export function filterCurrentMonth(items: ParsedExpenseItem[]): ParsedExpenseItem[] {
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

/**
 * Callable Firebase Cloud Function to parse uploaded bank statement file from Firebase Storage.
 * Configured with minInstances: 0 to hibernate when idle (serverless scale to zero).
 */
export const parseBankStatement = functions.https.onCall(
  { cors: true, minInstances: 0, maxInstances: 10 },
  async (request: unknown, context?: unknown) => {
    const reqObj = request as { auth?: unknown; data?: ParseRequest } | undefined;
    const ctxObj = context as { auth?: unknown } | undefined;

    // Support both v1 (data, context) signature and v2 (request) signature
    const auth = reqObj?.auth || ctxObj?.auth;
    const payload: ParseRequest = (reqObj?.data as ParseRequest) || (request as ParseRequest) || {};

    if (!auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário precisa estar autenticado.");
    }

    const { storagePath, fileType, onlyCurrentMonth } = payload;
    if (!storagePath || !fileType) {
      throw new functions.https.HttpsError("invalid-argument", "storagePath e fileType são obrigatórios.");
    }

    try {
      const bucketName = process.env.STORAGE_BUCKET || "personal-spendings-533fc.firebasestorage.app";
      const bucket = getStorage().bucket(bucketName);
      const file = bucket.file(storagePath);
      const [fileBuffer] = await file.download();

      let items: ParsedExpenseItem[] = [];

      if (fileType === "csv") {
        const csvText = fileBuffer.toString("utf-8");
        items = parseCsvContent(csvText);
      } else if (fileType === "xlsx") {
        items = parseXlsxBuffer(fileBuffer);
      } else if (fileType === "pdf") {
        const pdfData = await pdfParse(fileBuffer);
        items = parsePdfText(pdfData.text);
      } else {
        throw new functions.https.HttpsError("invalid-argument", "Formato não suportado.");
      }

      if (onlyCurrentMonth) {
        items = filterCurrentMonth(items);
      }

      return items;
    } catch (error: unknown) {
      console.error("Erro na Cloud Function parseBankStatement:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new functions.https.HttpsError("internal", `Erro ao processar extrato: ${errorMsg}`);
    }
  }
);
