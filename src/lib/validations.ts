import { WorkType, WORK_TYPES } from "@/types/report";

export const SERIAL_NUMBER_REGEX = /^TM-[0-9]{6}$/;
export const PART_NUMBER_REGEX = /^NF-[A-Z0-9]{8}$/;
export const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

export interface ValidationError {
  field: string;
  message: string;
}

export interface ReportInput {
  workDate: string;
  workerName: string;
  customerName: string;
  siteAddress: string;
  serialNumber: string;
  workType: string;
  workTypeOther?: string;
  hasFaultCode: boolean;
  faultCodeContent?: string;
  partNumber?: string;
  partQuantity?: number | string;
  startTime: string;
  endTime: string;
  breakMinutes: number | string;
}

export function validateReport(data: ReportInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // 作業日
  if (!data.workDate) {
    errors.push({ field: "workDate", message: "作業日は必須です" });
  }

  // 作業者名
  if (!data.workerName || data.workerName.trim() === "") {
    errors.push({ field: "workerName", message: "作業者名は必須です" });
  } else if (data.workerName.length > 100) {
    errors.push({ field: "workerName", message: "作業者名は100文字以内で入力してください" });
  }

  // 顧客名
  if (!data.customerName || data.customerName.trim() === "") {
    errors.push({ field: "customerName", message: "顧客名は必須です" });
  } else if (data.customerName.length > 200) {
    errors.push({ field: "customerName", message: "顧客名は200文字以内で入力してください" });
  }

  // 現場住所
  if (!data.siteAddress || data.siteAddress.trim() === "") {
    errors.push({ field: "siteAddress", message: "現場住所は必須です" });
  } else if (data.siteAddress.length > 500) {
    errors.push({ field: "siteAddress", message: "現場住所は500文字以内で入力してください" });
  }

  // シリアルナンバー
  if (!data.serialNumber || data.serialNumber.trim() === "") {
    errors.push({ field: "serialNumber", message: "シリアルナンバーは必須です" });
  } else if (!SERIAL_NUMBER_REGEX.test(data.serialNumber)) {
    errors.push({
      field: "serialNumber",
      message: "TM-に続く数字6桁で入力してください（例：TM-012345）",
    });
  }

  // 作業種類
  const validWorkTypes = Object.keys(WORK_TYPES);
  if (!data.workType || !validWorkTypes.includes(data.workType)) {
    errors.push({ field: "workType", message: "作業種類を選択してください" });
  }

  // 作業種類（その他）の場合
  if (data.workType === "other") {
    if (!data.workTypeOther || data.workTypeOther.trim() === "") {
      errors.push({ field: "workTypeOther", message: "その他の内容は必須です" });
    } else if (data.workTypeOther.length > 500) {
      errors.push({ field: "workTypeOther", message: "その他の内容は500文字以内で入力してください" });
    }
  }

  // フォルトコード有無
  if (typeof data.hasFaultCode !== "boolean") {
    errors.push({ field: "hasFaultCode", message: "フォルトコードの有無を選択してください" });
  }

  // 交換部品番号（任意だが入力時はバリデーション）
  if (data.partNumber && data.partNumber.trim() !== "") {
    if (!PART_NUMBER_REGEX.test(data.partNumber)) {
      errors.push({
        field: "partNumber",
        message: "NF-に続く英数字8桁で入力してください（例：NF-A1B2C3D4）",
      });
    }

    // 部品番号入力時は個数必須
    const quantity = typeof data.partQuantity === "string"
      ? parseInt(data.partQuantity, 10)
      : data.partQuantity;
    if (!quantity || quantity < 1) {
      errors.push({ field: "partQuantity", message: "部品番号を入力した場合、個数は1以上を入力してください" });
    }
  }

  // 開始時間
  if (!data.startTime) {
    errors.push({ field: "startTime", message: "開始時間は必須です" });
  } else if (!TIME_REGEX.test(data.startTime)) {
    errors.push({ field: "startTime", message: "開始時間の形式が正しくありません" });
  }

  // 終了時間
  if (!data.endTime) {
    errors.push({ field: "endTime", message: "終了時間は必須です" });
  } else if (!TIME_REGEX.test(data.endTime)) {
    errors.push({ field: "endTime", message: "終了時間の形式が正しくありません" });
  }

  // 開始時間 <= 終了時間のチェック
  if (data.startTime && data.endTime && TIME_REGEX.test(data.startTime) && TIME_REGEX.test(data.endTime)) {
    if (data.startTime > data.endTime) {
      errors.push({ field: "endTime", message: "終了時間は開始時間以降を指定してください" });
    }
  }

  // 休憩時間
  const breakMinutes = typeof data.breakMinutes === "string"
    ? parseInt(data.breakMinutes, 10)
    : data.breakMinutes;
  if (breakMinutes === undefined || breakMinutes === null || isNaN(breakMinutes)) {
    errors.push({ field: "breakMinutes", message: "休憩時間は必須です" });
  } else if (breakMinutes < 0) {
    errors.push({ field: "breakMinutes", message: "休憩時間は0以上を入力してください" });
  }

  return errors;
}

export function formatWorkType(workType: WorkType): string {
  return WORK_TYPES[workType] || workType;
}

export function calculateWorkDuration(startTime: string, endTime: string, breakMinutes: number): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;

  return endTotalMinutes - startTotalMinutes - breakMinutes;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}時間${mins.toString().padStart(2, "0")}分`;
}
