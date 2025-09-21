import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { listAnalysesRequiringFactCheckByUser } from "@/lib/db/repo";

export async function GET(req: NextRequest) {
  const authContext = await getAuthContext();
  if (!authContext)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || "10");
  const items = await listAnalysesRequiringFactCheckByUser(
    authContext.userId,
    limit
  );
  return NextResponse.json(items);
}
