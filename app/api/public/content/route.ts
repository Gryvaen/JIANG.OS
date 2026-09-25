import { NextResponse } from "next/server";
import { loadPublicContent } from "@/domains/content/service";
export async function GET(){return NextResponse.json(await loadPublicContent(),{headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=86400"}})}
