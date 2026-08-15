/**
 * Test / mock API for query pages. Replace with real API calls later.
 * Simulates network delay and returns sample data based on query type.
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export type QueryType =
  | "gsm-tc"
  | "tc-gsm"
  | "gsm"
  | "mernis"
  | "aile"
  | "adres"
  | "diger"
  | "premium";

export async function mockQuery(
  type: QueryType,
  value: string
): Promise<Record<string, unknown>[]> {
  await delay(600 + Math.random() * 400);

  const base = {
    sorgu: value,
    tarih: new Date().toISOString().slice(0, 19),
    id: randomId(),
  };

  switch (type) {
    case "gsm-tc":
      return [
        { ...base, gsm: value, tc: "12345678901", ad: "Test", soyad: "Kullanıcı" },
      ];
    case "tc-gsm":
      return [
        { ...base, tc: value, gsm: "5321234567", operator: "Test Operatör" },
      ];
    case "gsm":
      return [
        {
          ...base,
          gsm: value,
          operator: "Test",
          il: "İstanbul",
          kayitTarihi: "2020-01-15",
        },
      ];
    case "mernis":
      return [
        {
          ...base,
          tc: value,
          ad: "Test",
          soyad: "Kullanıcı",
          dogumYili: "1990",
          cinsiyet: "E",
        },
      ];
    case "aile":
      return [
        { ...base, tc: value, uye: "Anne", ad: "Test", soyad: "Aile" },
        { ...base, tc: value, uye: "Baba", ad: "Test", soyad: "Aile" },
      ];
    case "adres":
      return [
        {
          ...base,
          il: "İstanbul",
          ilce: "Kadıköy",
          mahalle: "Test Mah.",
          sokak: "Örnek Sokak No:1",
        },
      ];
    case "diger":
    case "premium":
      return [
        { ...base, sonuc: "Test sonuç", detay: "Mock API yanıtı" },
      ];
    default:
      return [{ ...base, sonuc: "Bilinmeyen sorgu türü" }];
  }
}
