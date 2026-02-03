"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Report, WORK_TYPES, WorkType, ReportFormData } from "@/types/report";
import { validateReport, ValidationError } from "@/lib/validations";

interface SerialNumberMaster {
  id: number;
  serialNumber: string;
  customerName: string | null;
  description: string | null;
}

interface PartNumberMaster {
  id: number;
  partNumber: string;
  partName: string | null;
  description: string | null;
}

interface Props {
  initialData?: Report;
  mode: "create" | "edit";
}

export default function ReportForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [serialNumberMasters, setSerialNumberMasters] = useState<SerialNumberMaster[]>([]);
  const [partNumberMasters, setPartNumberMasters] = useState<PartNumberMaster[]>([]);

  // マスタデータの取得
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [serialRes, partRes] = await Promise.all([
          fetch("/api/masters/serial-numbers"),
          fetch("/api/masters/part-numbers"),
        ]);
        if (serialRes.ok) {
          setSerialNumberMasters(await serialRes.json());
        }
        if (partRes.ok) {
          setPartNumberMasters(await partRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch masters:", error);
      }
    };
    fetchMasters();
  }, []);

  // プレフィックスを除去してフォーム用の値を取得
  const removePrefix = (value: string | undefined, prefix: string) => {
    if (!value) return "";
    return value.startsWith(prefix) ? value.slice(prefix.length) : value;
  };

  const [formData, setFormData] = useState<ReportFormData>({
    workDate: initialData?.workDate || new Date().toISOString().split("T")[0],
    workerName: initialData?.workerName || "",
    customerName: initialData?.customerName || "",
    siteAddress: initialData?.siteAddress || "",
    serialNumber: removePrefix(initialData?.serialNumber, "TM-"),
    workType: (initialData?.workType as WorkType) || "adjustment",
    workTypeOther: initialData?.workTypeOther || "",
    hasFaultCode: initialData?.hasFaultCode || false,
    faultCodeContent: initialData?.faultCodeContent || "",
    partNumber: removePrefix(initialData?.partNumber, "NF-"),
    partQuantity: initialData?.partQuantity || undefined,
    startTime: initialData?.startTime || "09:00",
    endTime: initialData?.endTime || "17:00",
    breakMinutes: initialData?.breakMinutes || 60,
  });

  const getError = (field: string) => {
    return errors.find((e) => e.field === field)?.message;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : parseInt(value, 10),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // エラーをクリア
    setErrors((prev) => prev.filter((e) => e.field !== name));
  };

  const handleWorkTypeChange = (value: WorkType) => {
    setFormData((prev) => ({
      ...prev,
      workType: value,
      workTypeOther: value === "other" ? prev.workTypeOther : "",
    }));
    setErrors((prev) => prev.filter((e) => e.field !== "workType"));
  };

  const handleFaultCodeChange = (value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      hasFaultCode: value,
      faultCodeContent: value ? prev.faultCodeContent : "",
    }));
    setErrors((prev) => prev.filter((e) => e.field !== "hasFaultCode"));
  };

  // シリアルナンバー選択時に顧客名を自動入力
  const handleSerialNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, serialNumber: value }));
    setErrors((prev) => prev.filter((err) => err.field !== "serialNumber"));

    // マスタから顧客名を取得して自動入力
    const fullSerialNumber = `TM-${value}`;
    const master = serialNumberMasters.find((m) => m.serialNumber === fullSerialNumber);
    if (master?.customerName && !formData.customerName) {
      setFormData((prev) => ({ ...prev, serialNumber: value, customerName: master.customerName || "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // プレフィックスを付けた送信用データを作成
    const submitData = {
      ...formData,
      serialNumber: formData.serialNumber ? `TM-${formData.serialNumber}` : "",
      partNumber: formData.partNumber ? `NF-${formData.partNumber}` : "",
    };

    // バリデーション
    const validationErrors = validateReport(submitData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      const url =
        mode === "create"
          ? "/api/reports"
          : `/api/reports/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          throw new Error(data.error || "保存に失敗しました");
        }
        return;
      }

      router.push(mode === "create" ? "/" : `/reports/${initialData?.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Link href="/" className="text-blue-600 hover:underline text-sm">
        ← 一覧に戻る
      </Link>

      <div className="bg-white rounded-lg shadow mt-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium">
            {mode === "create" ? "新規レポート作成" : "レポート編集"}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本情報 */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-4">基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  作業日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="workDate"
                  value={formData.workDate}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 ${
                    getError("workDate") ? "border-red-500" : ""
                  }`}
                />
                {getError("workDate") && (
                  <p className="text-red-500 text-sm mt-1">{getError("workDate")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  作業者名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="workerName"
                  value={formData.workerName}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 ${
                    getError("workerName") ? "border-red-500" : ""
                  }`}
                  placeholder="山田 太郎"
                />
                {getError("workerName") && (
                  <p className="text-red-500 text-sm mt-1">{getError("workerName")}</p>
                )}
              </div>
            </div>
          </section>

          {/* 顧客・現場情報 */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              顧客・現場情報
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  顧客名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 ${
                    getError("customerName") ? "border-red-500" : ""
                  }`}
                  placeholder="株式会社〇〇"
                />
                {getError("customerName") && (
                  <p className="text-red-500 text-sm mt-1">
                    {getError("customerName")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  現場住所 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="siteAddress"
                  value={formData.siteAddress}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 ${
                    getError("siteAddress") ? "border-red-500" : ""
                  }`}
                  placeholder="東京都千代田区..."
                />
                {getError("siteAddress") && (
                  <p className="text-red-500 text-sm mt-1">
                    {getError("siteAddress")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  シリアルナンバー <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-2">（6桁・選択または入力）</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 text-sm font-mono text-gray-700 bg-gray-100 border border-r-0 rounded-l">
                    TM-
                  </span>
                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleSerialNumberChange}
                    maxLength={6}
                    list="serialNumberList"
                    className={`flex-1 border rounded-r px-3 py-2 font-mono ${
                      getError("serialNumber") ? "border-red-500" : ""
                    }`}
                    placeholder="012345"
                  />
                  <datalist id="serialNumberList">
                    {serialNumberMasters.map((m) => (
                      <option key={m.id} value={m.serialNumber.replace("TM-", "")}>
                        {m.customerName} - {m.description}
                      </option>
                    ))}
                  </datalist>
                </div>
                {getError("serialNumber") && (
                  <p className="text-red-500 text-sm mt-1">
                    {getError("serialNumber")}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 作業内容 */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-4">作業内容</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  作業種類 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  {(Object.entries(WORK_TYPES) as [WorkType, string][]).map(
                    ([key, label]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="radio"
                          name="workType"
                          checked={formData.workType === key}
                          onChange={() => handleWorkTypeChange(key)}
                          className="mr-2"
                        />
                        {label}
                      </label>
                    )
                  )}
                </div>
                {getError("workType") && (
                  <p className="text-red-500 text-sm mt-1">{getError("workType")}</p>
                )}
              </div>

              {formData.workType === "other" && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    その他の内容 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="workTypeOther"
                    value={formData.workTypeOther}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 ${
                      getError("workTypeOther") ? "border-red-500" : ""
                    }`}
                    placeholder="作業内容を入力"
                  />
                  {getError("workTypeOther") && (
                    <p className="text-red-500 text-sm mt-1">
                      {getError("workTypeOther")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* フォルトコード */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              フォルトコード
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  フォルトコードの有無 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasFaultCode"
                      checked={formData.hasFaultCode}
                      onChange={() => handleFaultCodeChange(true)}
                      className="mr-2"
                    />
                    あり
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasFaultCode"
                      checked={!formData.hasFaultCode}
                      onChange={() => handleFaultCodeChange(false)}
                      className="mr-2"
                    />
                    なし
                  </label>
                </div>
              </div>

              {formData.hasFaultCode && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    フォルトコード内容
                  </label>
                  <textarea
                    name="faultCodeContent"
                    value={formData.faultCodeContent}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border rounded px-3 py-2"
                    placeholder="フォルトコードの内容を入力"
                  />
                </div>
              )}
            </div>
          </section>

          {/* 交換部品 */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              交換部品（任意）
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  部品番号
                  <span className="text-gray-400 font-normal ml-2">（英数字8桁・選択または入力）</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 text-sm font-mono text-gray-700 bg-gray-100 border border-r-0 rounded-l">
                    NF-
                  </span>
                  <input
                    type="text"
                    name="partNumber"
                    value={formData.partNumber}
                    onChange={handleChange}
                    maxLength={8}
                    list="partNumberList"
                    className={`flex-1 border rounded-r px-3 py-2 font-mono uppercase ${
                      getError("partNumber") ? "border-red-500" : ""
                    }`}
                    placeholder="A1B2C3D4"
                  />
                  <datalist id="partNumberList">
                    {partNumberMasters.map((m) => (
                      <option key={m.id} value={m.partNumber.replace("NF-", "")}>
                        {m.partName} - {m.description}
                      </option>
                    ))}
                  </datalist>
                </div>
                {getError("partNumber") && (
                  <p className="text-red-500 text-sm mt-1">
                    {getError("partNumber")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  個数{" "}
                  {formData.partNumber && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="number"
                  name="partQuantity"
                  value={formData.partQuantity ?? ""}
                  onChange={handleChange}
                  min={1}
                  max={99999}
                  className={`w-24 border rounded px-3 py-2 ${
                    getError("partQuantity") ? "border-red-500" : ""
                  }`}
                  placeholder="1"
                />
                {getError("partQuantity") && (
                  <p className="text-red-500 text-sm mt-1">
                    {getError("partQuantity")}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 作業時間 */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-4">作業時間</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  開始時間 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 ${
                    getError("startTime") ? "border-red-500" : ""
                  }`}
                />
                {getError("startTime") && (
                  <p className="text-red-500 text-sm mt-1">
                    {getError("startTime")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  終了時間 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 ${
                    getError("endTime") ? "border-red-500" : ""
                  }`}
                />
                {getError("endTime") && (
                  <p className="text-red-500 text-sm mt-1">
                    {getError("endTime")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  休憩時間（分） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="breakMinutes"
                  value={formData.breakMinutes}
                  onChange={handleChange}
                  min={0}
                  className={`w-full border rounded px-3 py-2 ${
                    getError("breakMinutes") ? "border-red-500" : ""
                  }`}
                  placeholder="60"
                />
                {getError("breakMinutes") && (
                  <p className="text-red-500 text-sm mt-1">
                    {getError("breakMinutes")}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ボタン */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <Link
            href={mode === "create" ? "/" : `/reports/${initialData?.id}`}
            className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "保存中..." : "保存する"}
          </button>
        </div>
      </div>
    </form>
  );
}
