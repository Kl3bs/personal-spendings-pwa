import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";
import { app, storage as configStorage } from "./config";

export interface UploadStatementResult {
  downloadUrl: string;
  storagePath: string;
  fileType: "csv" | "xlsx" | "pdf";
}

/**
 * Uploads a bank statement file (CSV, XLSX, PDF) to Firebase Storage.
 * Saves to statements/{userId}/{fileType}/{timestamp}_{filename}
 */
export async function uploadBankStatement(
  file: File,
  userId: string
): Promise<UploadStatementResult> {
  const fileName = file.name;
  const ext = fileName.split(".").pop()?.toLowerCase();

  let fileType: "csv" | "xlsx" | "pdf";
  if (ext === "csv") {
    fileType = "csv";
  } else if (ext === "xlsx" || ext === "xls") {
    fileType = "xlsx";
  } else if (ext === "pdf") {
    fileType = "pdf";
  } else {
    throw new Error("Formato de arquivo não suportado. Envie CSV, XLSX ou PDF.");
  }

  const storageInstance = configStorage || getStorage(app);
  if (!storageInstance) {
    throw new Error("Serviço do Firebase Storage não está disponível.");
  }

  const safeUserId = userId || "anonymous";
  const timestamp = Date.now();
  const storagePath = `statements/${safeUserId}/${fileType}/${timestamp}_${fileName}`;
  const storageRef = ref(storageInstance, storagePath);

  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);

  return {
    downloadUrl,
    storagePath,
    fileType,
  };
}
