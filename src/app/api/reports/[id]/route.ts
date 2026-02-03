import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateReport } from "@/lib/validations";
import { notifySlackFaultCode } from "@/lib/slack";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/reports/[id] - レポート詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const reportId = parseInt(id, 10);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: "無効なIDです" },
        { status: 400 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        { error: "レポートが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...report,
      workDate: report.workDate.toISOString().split("T")[0],
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "レポートの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT /api/reports/[id] - レポート更新
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const reportId = parseInt(id, 10);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: "無効なIDです" },
        { status: 400 }
      );
    }

    const existingReport = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: "レポートが見つかりません" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // バリデーション
    const errors = validateReport(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // フォルトコードが追加されたかチェック（以前なし → 今回あり）
    const faultCodeAdded = !existingReport.hasFaultCode && body.hasFaultCode;

    // レポート更新
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        workDate: new Date(body.workDate),
        workerName: body.workerName.trim(),
        customerName: body.customerName.trim(),
        siteAddress: body.siteAddress.trim(),
        serialNumber: body.serialNumber.trim().toUpperCase(),
        workType: body.workType,
        workTypeOther: body.workType === "other" ? body.workTypeOther?.trim() : null,
        hasFaultCode: body.hasFaultCode,
        faultCodeContent: body.hasFaultCode ? body.faultCodeContent?.trim() || null : null,
        partNumber: body.partNumber?.trim().toUpperCase() || null,
        partQuantity: body.partNumber ? parseInt(body.partQuantity, 10) : null,
        startTime: body.startTime,
        endTime: body.endTime,
        breakMinutes: parseInt(body.breakMinutes, 10),
      },
    });

    // フォルトコードが追加された場合、Slack通知
    if (faultCodeAdded) {
      await notifySlackFaultCode(
        {
          id: report.id,
          workDate: report.workDate.toISOString().split("T")[0],
          workerName: report.workerName,
          customerName: report.customerName,
          serialNumber: report.serialNumber,
          faultCodeContent: report.faultCodeContent,
        },
        false
      );
    }

    return NextResponse.json({
      ...report,
      workDate: report.workDate.toISOString().split("T")[0],
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "レポートの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - レポート削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const reportId = parseInt(id, 10);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: "無効なIDです" },
        { status: 400 }
      );
    }

    const existingReport = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: "レポートが見つかりません" },
        { status: 404 }
      );
    }

    await prisma.report.delete({
      where: { id: reportId },
    });

    return NextResponse.json({ message: "レポートを削除しました" });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "レポートの削除に失敗しました" },
      { status: 500 }
    );
  }
}
