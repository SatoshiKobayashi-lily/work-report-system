"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Report, WORK_TYPES, WorkType } from "@/types/report";

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

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

export default function ReportList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 検索条件
  const [customerName, setCustomerName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [partNumber, setPartNumber] = useState("");

  // マスタデータ
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

  // ソート条件
  const [sortBy, setSortBy] = useState("workDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 表示件数オプション
  const perPageOptions = [10, 20, 50, 100];

  // 削除確認
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        perPage: pagination.perPage.toString(),
        sortBy,
        sortOrder,
      });

      if (customerName) params.set("customerName", customerName);
      if (serialNumber) params.set("serialNumber", `TM-${serialNumber}`);
      if (partNumber) params.set("partNumber", `NF-${partNumber}`);

      const response = await fetch(`/api/reports?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }

      setReports(data.reports);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.perPage, sortBy, sortOrder, customerName, serialNumber, partNumber]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClear = () => {
    setCustomerName("");
    setSerialNumber("");
    setPartNumber("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const response = await fetch(`/api/reports/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "削除に失敗しました");
      }

      setDeleteTarget(null);
      fetchReports();
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP");
  };

  return (
    <div>
      {/* 検索フォーム */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">検索条件</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">顧客名</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="顧客名で検索"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">シリアルナンバー</label>
            <div className="flex">
              <span className="inline-flex items-center px-2 py-2 text-sm font-mono text-gray-700 bg-gray-100 border border-r-0 rounded-l">
                TM-
              </span>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                list="searchSerialNumberList"
                className="flex-1 border rounded-r px-2 py-2 text-sm font-mono"
                placeholder="012345"
              />
              <datalist id="searchSerialNumberList">
                {serialNumberMasters.map((m) => (
                  <option key={m.id} value={m.serialNumber.replace("TM-", "")}>
                    {m.customerName} - {m.description}
                  </option>
                ))}
              </datalist>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">部品番号</label>
            <div className="flex">
              <span className="inline-flex items-center px-2 py-2 text-sm font-mono text-gray-700 bg-gray-100 border border-r-0 rounded-l">
                NF-
              </span>
              <input
                type="text"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                list="searchPartNumberList"
                className="flex-1 border rounded-r px-2 py-2 text-sm font-mono uppercase"
                placeholder="00001001"
              />
              <datalist id="searchPartNumberList">
                {partNumberMasters.map((m) => (
                  <option key={m.id} value={m.partNumber.replace("NF-", "")}>
                    {m.partName} - {m.description}
                  </option>
                ))}
              </datalist>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
          >
            クリア
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            検索
          </button>
        </div>
      </form>

      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            全 {pagination.total} 件
          </span>
          <select
            value={pagination.perPage}
            onChange={(e) =>
              setPagination((prev) => ({
                ...prev,
                perPage: parseInt(e.target.value),
                page: 1,
              }))
            }
            className="text-sm border rounded px-2 py-1"
          >
            {perPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}件表示
              </option>
            ))}
          </select>
        </div>
        <Link
          href="/reports/new"
          className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
        >
          ＋ 新規レポート作成
        </Link>
      </div>

      {/* テーブル */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          登録されているレポートはありません
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("workDate")}
                >
                  作業日
                  <SortIcon field="workDate" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("workerName")}
                >
                  作業者
                  <SortIcon field="workerName" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("customerName")}
                >
                  顧客名
                  <SortIcon field="customerName" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("serialNumber")}
                >
                  シリアルナンバー
                  <SortIcon field="serialNumber" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("workType")}
                >
                  種類
                  <SortIcon field="workType" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  フォルト
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => (window.location.href = `/reports/${report.id}`)}
                >
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {formatDate(report.workDate)}
                  </td>
                  <td className="px-4 py-3 text-sm">{report.workerName}</td>
                  <td className="px-4 py-3 text-sm">{report.customerName}</td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {report.serialNumber}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {WORK_TYPES[report.workType as WorkType]}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {report.hasFaultCode ? (
                      <span className="text-red-600">あり</span>
                    ) : (
                      <span className="text-gray-400">なし</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-2 justify-center">
                      <Link
                        href={`/reports/${report.id}/edit`}
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(report)}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
            disabled={pagination.page === 1}
            className="px-4 py-2 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← 前へ
          </button>
          <span className="text-sm text-gray-600">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            次へ →
          </button>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">削除の確認</h3>
            <p className="text-gray-600 mb-6">
              以下のレポートを削除してもよろしいですか？
              <br />
              <span className="font-medium">
                {formatDate(deleteTarget.workDate)} - {deleteTarget.customerName}
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
