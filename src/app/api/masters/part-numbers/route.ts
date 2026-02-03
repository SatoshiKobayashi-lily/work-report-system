import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/masters/part-numbers - 部品番号マスタ一覧取得
export async function GET() {
  try {
    const partNumbers = await prisma.partNumberMaster.findMany({
      orderBy: { partNumber: "asc" },
    });

    return NextResponse.json(partNumbers);
  } catch (error) {
    console.error("Error fetching part numbers:", error);
    return NextResponse.json(
      { error: "部品番号マスタの取得に失敗しました" },
      { status: 500 }
    );
  }
}
