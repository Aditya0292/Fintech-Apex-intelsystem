import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const sitrep = {
    globalDEFCON: 4,
    intelAlerts: [
      { id: "A1", type: "MILITARY", msg: "Satellite detect launch platform movement in Sector 7", time: "14:22:01" },
      { id: "A2", type: "ENERGY", msg: "Cyber breach detected on North Pipeline controller", time: "14:15:33" },
      { id: "A3", type: "MARKET", msg: "Sudden XAU/USD volatility spike on Middle East flash news", time: "14:02:11" },
    ]
  };

  return NextResponse.json(sitrep);
}
