"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import ReportForm from "@/components/ReportForm";
import { Report } from "@/types/report";

export default function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return <ReportForm initialData={report} mode="edit" />;
}
