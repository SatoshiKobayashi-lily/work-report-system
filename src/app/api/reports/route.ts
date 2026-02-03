import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateReport } from "@/lib/validations";
import { notifySlackFaultCode } from "@/lib/slack";
import { Prisma } from "@prisma/client";

// GET /api/reports - レポート一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const customerName = searchParams.get("customerName") || "";
    const serialNumber = searchParams.get("serialNumber") || "";
    const partNumber = searchParams.get("partNumber") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "20", 10);
    const sortBy = searchParams.get("sortBy") || "workDate";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // 検索条件
    const where: Prisma.ReportWhereInput = {};

    if (customerName) {
      where.customerName = { contains: customerName };
    }
    if (serialNumber) {
      where.serialNumber = { contains: serialNumber };
    }
    if (partNumber) {
      where.partNumber = { contains: partNumber };
    }

    // ソート条件
    const orderBy: Prisma.ReportOrderByWithRelationInput = {};
    const validSortFields = [
      "workDate",
      "workerName",
      "customerName",
      "serialNumber",
      "workType",
      "createdAt",
    ];
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy as keyof Prisma.ReportOrderByWithRelationInput] = sortOrder;
    } else {
      orderBy.workDate = "desc";
    }

    // 総件数取得
    const total = await prisma.report.count({ where });

    // レポート取得
    const reports = await prisma.report.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    });

    // 日付をフォーマット
    const formattedReports = reports.map((report) => ({
      ...report,
      workDate: report.workDate.toISOString().split("T")[0],
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      reports: formattedReports,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "レポートの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/reports - レポート作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const errors = validateReport(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // レポート作成
    const report = await prisma.report.create({
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

    // フォルトコードありの場合、Slack通知
    if (report.hasFaultCode) {
      await notifySlackFaultCode(
        {
          id: report.id,
          workDate: report.workDate.toISOString().split("T")[0],
          workerName: report.workerName,
          customerName: report.customerName,
          serialNumber: report.serialNumber,
          faultCodeContent: report.faultCodeContent,
        },
        true
      );
    }

    return NextResponse.json(
      {
        ...report,
        workDate: report.workDate.toISOString().split("T")[0],
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "レポートの作成に失敗しました" },
      { status: 500 }
    );
  }
}
