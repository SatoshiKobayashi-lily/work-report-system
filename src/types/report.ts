export const WORK_TYPES = {
  adjustment: "調整",
  replacement: "部品交換",
  inspection: "点検",
  other: "その他",
} as const;

export type WorkType = keyof typeof WORK_TYPES;

export interface ReportFormData {
  workDate: string;
  workerName: string;
  customerName: string;
  siteAddress: string;
  serialNumber: string;
  workType: WorkType;
  workTypeOther?: string;
  hasFaultCode: boolean;
  faultCodeContent?: string;
  partNumber?: string;
  partQuantity?: number;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

export interface Report extends ReportFormData {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSearchParams {
  customerName?: string;
  serialNumber?: string;
  partNumber?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
