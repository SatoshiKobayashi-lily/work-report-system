import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/masters/serial-numbers - シリアルナンバーマスタ一覧取得
export async function GET() {
  try {
    const serialNumbers = await prisma.serialNumberMaster.findMany({
      orderBy: { serialNumber: "asc" },
    });

    return NextResponse.json(serialNumbers);
  } catch (error) {
    console.error("Error fetching serial numbers:", error);
    return NextResponse.json(
      { error: "シリアルナンバーマスタの取得に失敗しました" },
      { status: 500 }
    );
  }
}
