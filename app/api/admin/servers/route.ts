import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServer, loadServersForOwner } from "@/domains/servers/service";
import { serverInput } from "./schemas";
async function owner() { return (await auth())?.user as { role?: string } | undefined }
export async function GET() {
  if ((await owner())?.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await loadServersForOwner();
  return NextResponse.json(result);
}
export async function POST(request: Request) {
  if ((await owner())?.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = serverInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const created = await createServer(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
