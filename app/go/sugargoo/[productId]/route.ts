import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SUGARGOO_REFERRAL_URL = "https://m.sugargoo.com/register?memberId=3603566965386341407";

type Product = { canonicalId?: string; doppelProductId?: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const directory = path.join(process.cwd(), "public");

  try {
    const [primaryContents, v03Contents] = await Promise.all([
      readFile(path.join(directory, "herocon-products-import.json"), "utf8"),
      readFile(path.join(directory, "herocon-catalogue-v0.3.json"), "utf8"),
    ]);
    const primary: unknown = JSON.parse(primaryContents);
    const v03: unknown = JSON.parse(v03Contents);
    if (!Array.isArray(primary) || !Array.isArray(v03)) {
      return NextResponse.json({ error: "Catalogue unavailable" }, { status: 503 });
    }

    const exists = ([...primary, ...v03] as Product[]).some((product) =>
      product.doppelProductId === productId ||
      product.canonicalId === productId ||
      product.canonicalId === `doppel:${productId}`,
    );

    if (!exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.redirect(SUGARGOO_REFERRAL_URL, 302);
  } catch {
    return NextResponse.json({ error: "Catalogue unavailable" }, { status: 503 });
  }
}
