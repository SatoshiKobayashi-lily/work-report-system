interface ReportData {
  id: number;
  workDate: string;
  workerName: string;
  customerName: string;
  serialNumber: string;
  faultCodeContent?: string | null;
}

export async function notifySlackFaultCode(
  report: ReportData,
  isNew: boolean
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL is not set. Skipping Slack notification.");
    return;
  }

  const reportUrl = `${baseUrl}/reports/${report.id}`;
  const actionText = isNew ? "新規登録" : "編集（フォルトコード追加）";

  const message = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `⚠️ フォルトコード検出 - ${actionText}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*作業日:*\n${report.workDate}`,
          },
          {
            type: "mrkdwn",
            text: `*作業者:*\n${report.workerName}`,
          },
          {
            type: "mrkdwn",
            text: `*顧客名:*\n${report.customerName}`,
          },
          {
            type: "mrkdwn",
            text: `*シリアルナンバー:*\n${report.serialNumber}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*フォルトコード内容:*\n${report.faultCodeContent || "（内容なし）"}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "レポートを確認する",
              emoji: true,
            },
            url: reportUrl,
            style: "primary",
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `レポートID: ${report.id} | <${reportUrl}|詳細を開く>`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error("Failed to send Slack notification:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending Slack notification:", error);
  }
}
