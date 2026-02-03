import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding master data...");

  // シリアルナンバーマスタ（10件）
  const serialNumbers = [
    { serialNumber: "TM-001234", customerName: "株式会社ABC", description: "本社設置機" },
    { serialNumber: "TM-001235", customerName: "株式会社ABC", description: "工場A設置機" },
    { serialNumber: "TM-002100", customerName: "XYZ工業株式会社", description: "第一倉庫" },
    { serialNumber: "TM-002101", customerName: "XYZ工業株式会社", description: "第二倉庫" },
    { serialNumber: "TM-003500", customerName: "田中製作所", description: "メイン機" },
    { serialNumber: "TM-004200", customerName: "山田物流センター", description: "入出庫エリア" },
    { serialNumber: "TM-005000", customerName: "鈴木商事", description: "本社ビル1F" },
    { serialNumber: "TM-005001", customerName: "鈴木商事", description: "本社ビル2F" },
    { serialNumber: "TM-006300", customerName: "佐藤電機", description: "検査室" },
    { serialNumber: "TM-007000", customerName: "高橋工務店", description: "資材置き場" },
  ];

  for (const data of serialNumbers) {
    await prisma.serialNumberMaster.upsert({
      where: { serialNumber: data.serialNumber },
      update: {},
      create: data,
    });
  }
  console.log(`Created ${serialNumbers.length} serial number masters`);

  // 部品番号マスタ（10件）
  const partNumbers = [
    { partNumber: "NF-00001001", partName: "メインモーター", description: "標準交換部品" },
    { partNumber: "NF-00001002", partName: "制御基板", description: "メイン制御用" },
    { partNumber: "NF-00002001", partName: "センサーユニット", description: "温度センサー付き" },
    { partNumber: "NF-00002002", partName: "電源ユニット", description: "AC100V対応" },
    { partNumber: "NF-00003001", partName: "ファンモーター", description: "冷却用" },
    { partNumber: "NF-00003002", partName: "ヒーターユニット", description: "加熱用" },
    { partNumber: "NF-00004001", partName: "表示パネル", description: "LCD表示器" },
    { partNumber: "NF-00004002", partName: "操作ボタン", description: "タッチパネル式" },
    { partNumber: "NF-00005001", partName: "配線ケーブル", description: "5m" },
    { partNumber: "NF-00005002", partName: "コネクタセット", description: "標準規格" },
  ];

  for (const data of partNumbers) {
    await prisma.partNumberMaster.upsert({
      where: { partNumber: data.partNumber },
      update: {},
      create: data,
    });
  }
  console.log(`Created ${partNumbers.length} part number masters`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
