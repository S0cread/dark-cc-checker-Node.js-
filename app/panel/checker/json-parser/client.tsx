
"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

export function JsonParserClient() {
  const [jsonInput, setJsonInput] = useState("");
  const [parsedCards, setParsedCards] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCards: 0,
    parsed: 0,
    duplicates: 0,
    invalid: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonInput(content);
        setError(null);
      } catch (err) {
        setError("Dosya okunamadı.");
      }
    };
    reader.readAsText(file);
  }

  function parseJson() {
    try {
      setError(null);
      setParsedCards([]);
      
      const json = JSON.parse(jsonInput);
      const cards: string[] = [];
      const seen = new Set<string>();
      let duplicates = 0;
      let invalid = 0;
      
      // Sheet1 varsa onu kullan
      let dataArray: any[] = [];
      if (json["Sheet1"] && Array.isArray(json["Sheet1"])) {
        dataArray = json["Sheet1"];
      } else if (json["data"] && Array.isArray(json["data"])) {
        dataArray = json["data"];
      } else if (Array.isArray(json)) {
        dataArray = json;
      } else {
        // Tüm değerleri dolaş ve array bul
        for (const key in json) {
          if (Array.isArray(json[key])) {
            dataArray = json[key];
            break;
          }
        }
      }

      if (!dataArray.length) {
        setError("JSON içinde kart verisi bulunamadı!");
        return;
      }

      let startIndex = 0;
      // Başlık satırını atla
      if (dataArray.length > 0) {
        const firstItem = dataArray[0];
        if (firstItem["Column5"] === "Kart Numarası" || firstItem["Exported data"] === "Id") {
          startIndex = 1;
        }
      }

      for (let i = startIndex; i < dataArray.length; i++) {
        const item = dataArray[i];
        
        // Column5'ten kart numarasını al
        let cardNumberRaw = item["Column5"] || "";
        
        // Kart numarasını temizle: tüm sayıları al, en az 13 hane
        let cardNumber = "";
        const digits = cardNumberRaw.match(/\d/g);
        if (digits && digits.length >= 13) {
          // Tüm sayıları al, 16 haneye tamamla (varsa)
          cardNumber = digits.slice(0, 16).join("");
        }
        
        if (!cardNumber || cardNumber.length < 13) {
          invalid++;
          continue;
        }
        
        // Aynı kartı tekrar ekleme
        if (seen.has(cardNumber)) {
          duplicates++;
          continue;
        }
        seen.add(cardNumber);
        
        // Column6'dan SKT
        let sktRaw = item["Column6"] || "";
        let month = "";
        let year = "";
        
        if (sktRaw.includes("/")) {
          const parts = sktRaw.split("/");
          month = parts[0].replace(/\D/g, "").padStart(2, "0").slice(0, 2);
          year = parts[1].replace(/\D/g, "").slice(-2);
        }
        
        // Column7'den CVV
        let cvvRaw = item["Column7"] || "";
        let cvv = String(cvvRaw).replace(/\D/g, "").slice(0, 4);
        
        cards.push(`${cardNumber}|${month}|${year}|${cvv}`);
      }

      setParsedCards(cards);
      setStats({
        totalCards: dataArray.length - startIndex,
        parsed: cards.length,
        duplicates,
        invalid,
      });

    } catch (err) {
      setError("JSON formatı geçersiz! Lütfen geçerli bir JSON yapıştırın.");
    }
  }

  function handleClear() {
    setJsonInput("");
    setParsedCards([]);
    setError(null);
    setStats({ totalCards: 0, parsed: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDownload() {
    const content = parsedCards.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "parsed_cards.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-5 md:p-7 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5">
          <svg
            className="h-4 w-4 text-red-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">JSON Parser</h1>
          <p className="text-[11px] text-muted-foreground">
            Sheet1 JSON'ından kartları çıkar ve CARD|MM|YY|CVV formatına dönüştür.
          </p>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* JSON input */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.04 }}
          className="flex flex-col gap-3"
        >
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/10">
              <div className="flex items-center gap-2">
                <svg
                  className="h-3.5 w-3.5 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span className="text-xs font-semibold text-foreground">JSON INPUT</span>
              </div>
              {jsonInput.trim() && (
                <button
                  onClick={handleClear}
                  className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            
            {/* File upload area */}
            <div className="px-4 pt-3">
              <label className="flex items-center justify-center gap-2 w-full rounded-lg border border-dashed border-border py-2.5 text-xs text-muted-foreground hover:bg-muted/10 cursor-pointer transition-colors">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Upload JSON File
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setError(null);
              }}
              rows={12}
              placeholder={'{\n "Sheet1": [\n  {\n   "Column5": "Kart Numarası",\n   "Column6": "SKT",\n   "Column7": "CVV"\n  }\n ]\n}'}
              className="w-full resize-none bg-transparent px-4 py-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/35 focus:outline-none"
            />

            {error && (
              <div className="px-4 pb-3">
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <p className="text-[11px] text-red-400 font-medium">{error}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={parseJson}
              disabled={!jsonInput.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold bg-white text-black hover:opacity-90 transition-all disabled:opacity-40 active:scale-[0.98]"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Parse JSON
            </button>
            {parsedCards.length > 0 && (
              <button
                onClick={handleDownload}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted/20 transition-colors"
              >
                <svg
                  className="h-3.5 w-3.5 inline mr-1.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download .txt
              </button>
            )}
          </div>
        </motion.div>

        {/* Parsed output */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.06 }}
          className="flex flex-col gap-3"
        >
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/10">
              <div className="flex items-center gap-2">
                <svg
                  className="h-3.5 w-3.5 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <span className="text-xs font-semibold text-foreground">PARSED OUTPUT</span>
              </div>
              {parsedCards.length > 0 && (
                <button
                  onClick={() => void navigator.clipboard.writeText(parsedCards.join("\n"))}
                  className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    className="h-3 w-3 inline mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </button>
              )}
            </div>
            <textarea
              value={parsedCards.join("\n")}
              readOnly
              rows={16}
              placeholder="Parsed cards will appear here..."
              className="w-full resize-none bg-transparent px-4 py-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/35 focus:outline-none"
            />
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <AnimatePresence>
        {parsedCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            transition={{ delay: 0.08 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <div className="text-lg font-bold text-foreground">{stats.totalCards}</div>
                <div className="text-[10px] text-muted-foreground font-medium">TOTAL</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <div className="text-lg font-bold text-green-400">{stats.parsed}</div>
                <div className="text-[10px] text-muted-foreground font-medium">PARSED</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <div className="text-lg font-bold text-yellow-400">{stats.duplicates}</div>
                <div className="text-[10px] text-muted-foreground font-medium">TEKRAR</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <div className="text-lg font-bold text-red-400">{stats.invalid}</div>
                <div className="text-[10px] text-muted-foreground font-medium">GEÇERSİZ</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

