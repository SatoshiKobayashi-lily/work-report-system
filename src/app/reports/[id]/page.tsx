"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Report, WORK_TYPES, WorkType } from "@/types/report";
import { calculateWorkDuration, formatDuration } from "@/lib/validations";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "レポートの取得に失敗しました");
        }

        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "削除に失敗しました");
      }

      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">読み込み中...</div>;
  }

  if (error || !report) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error || "レポートが見つかりません"}</p>
        <Link href="/" className="text-blue-600 hover:underline">
          ← 一覧に戻る
        </Link>
      </div>
    );
  }

  const workDuration = calculateWorkDuration(
    report.startTime,
    report.endTime,
    report.breakMinutes
  );

  return (
    <div>
      <Link href="/" className="text-blue-600 hover:underline text-sm">
        ← 一覧に戻る
      </Link>

      <div className="bg-white rounded-lg shadow mt-4">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">レポート詳細</h2>
          <div className="flex gap-2">
            <Link
              href={`/reports/${id}/edit`}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              編集
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
            >
              削除
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本情報 */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-3">基本情報</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">作業日</dt>
                <dd className="mt-1">{formatDate(report.workDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">作業者名</dt>
                <dd className="mt-1">{report.workerName}</dd>
              </div>
            </dl>
          </section>

          {/* 顧客・現場情報 */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              顧客・現場情報
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">顧客名</dt>
                <dd className="mt-1">{report.customerName}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">現場住所</dt>
                <dd className="mt-1">{report.siteAddress}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">シリアルナンバー</dt>
                <dd className="mt-1 font-mono">{report.serialNumber}</dd>
              </div>
            </dl>
          </section>

          {/* 作業内容 */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-3">作業内容</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">作業種類</dt>
                <dd className="mt-1">
                  {WORK_TYPES[report.workType as WorkType]}
                  {report.workType === "other" && report.workTypeOther && (
                    <span className="text-gray-600 ml-2">
                      （{report.workTypeOther}）
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* フォルトコード */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              フォルトコード
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">有無</dt>
                <dd className="mt-1">
                  {report.hasFaultCode ? (
                    <span className="text-red-600">あり</span>
                  ) : (
                    "なし"
                  )}
                </dd>
              </div>
              {report.hasFaultCode && report.faultCodeContent && (
                <div>
                  <dt className="text-sm text-gray-500">内容</dt>
                  <dd className="mt-1 whitespace-pre-wrap">
                    {report.faultCodeContent}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* 交換部品 */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-3">交換部品</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">部品番号</dt>
                <dd className="mt-1 font-mono">{report.partNumber || "−"}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">個数</dt>
                <dd className="mt-1">{report.partQuantity || "−"}</dd>
              </div>
            </dl>
          </section>

          {/* 作業時間 */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 mb-3">作業時間</h3>
            <dl className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <dt className="text-sm text-gray-500">開始時間</dt>
                <dd className="mt-1">{report.startTime}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">終了時間</dt>
                <dd className="mt-1">{report.endTime}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">休憩時間</dt>
                <dd className="mt-1">{report.breakMinutes}分</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">実作業時間</dt>
                <dd className="mt-1 font-medium">
                  {formatDuration(workDuration)}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">削除の確認</h3>
            <p className="text-gray-600 mb-6">
              このレポートを削除してもよろしいですか？
              <br />
              この操作は取り消せません。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
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
