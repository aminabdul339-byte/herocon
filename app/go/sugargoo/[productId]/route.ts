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
  const file = path.join(process.cwd(), "public", "herocon-products-import.json");

  try {
    const contents = await readFile(file, "utf8");
    const products: unknown = JSON.parse(contents);
    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "Catalogue unavailable" }, { status: 503 });
    }

    const exists = (products as Product[]).some((product) =>
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
