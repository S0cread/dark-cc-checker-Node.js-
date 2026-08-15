
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ParsedCard {
  original: string;
  number: string;
  month: string;
  year: string;
  cvv: string;
  formatted: string;
}

export function CardParserClient() {
  const [rawInput, setRawInput] = useState("");
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
  const [stats, setStats] = useState({
    inputLines: 0,
    parsed: 0,
    duplicates: 0,
    failed: 0,
    luhnValid: 0,
  });

  function luhnCheck(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, "").split("").map(Number);
    if (digits.length < 13) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  function parseCardLine(line: string): ParsedCard | null {
    const clean = line.trim();
    if (!clean) return null;

    // Remove any non-digit, non-|, non-: characters except spaces
    const normalized = clean.replace(/[^\d|:|\s]/g, " ");

    // Extract all digits
    const digits = normalized.match(/\d+/g) || [];

    // Try common patterns
    let number = "";
    let month = "";
    let year = "";
    let cvv = "";

    // Pattern 1: pipe separated (most common)
    const pipeParts = clean.split("|").map(p => p.trim());
    if (pipeParts.length >= 3) {
      number = pipeParts[0].replace(/\D/g, "");
      month = pipeParts[1].replace(/\D/g, "").padStart(2, "0").slice(0, 2);
      year = pipeParts[2].replace(/\D/g, "").slice(-2);
      if (pipeParts[3]) cvv = pipeParts[3].replace(/\D/g, "").slice(0, 4);
    } 
    // Pattern 2: colon separated
    else if (clean.includes(":")) {
      const colonParts = clean.split(":").map(p => p.trim());
      const numbers = colonParts.flatMap(p => p.match(/\d+/g) || []);
      if (numbers.length >= 3) {
        [number, month, year, cvv] = numbers;
      }
    }
    // Pattern 3: just numbers in order
    else if (digits.length >= 3) {
      // Find the longest number (should be card number)
      number = digits.reduce((a, b) => (a.length > b.length ? a : b), "");
      const remaining = digits.filter(d => d !== number);

      if (remaining.length >= 2) {
        // Find month (1-12)
        const monthCandidate = remaining.find(d => d.length === 2 && parseInt(d) >= 1 && parseInt(d) <= 12);
        if (monthCandidate) {
          month = monthCandidate.padStart(2, "0");
          const withoutMonth = remaining.filter(d => d !== monthCandidate);
          year = withoutMonth[0]?.slice(-2) || "";
          cvv = withoutMonth[1]?.slice(0, 4) || "";
        } else {
          month = remaining[0]?.padStart(2, "0").slice(0, 2) || "";
          year = remaining[1]?.slice(-2) || "";
          cvv = remaining[2]?.slice(0, 4) || "";
        }
      }
    }

    if (number.length < 13) return null;

    return {
      original: clean,
      number,
      month,
      year,
      cvv,
      formatted: `${number}|${month}|${year}|${cvv}`,
    };
  }

  function handleParse() {
    const lines = rawInput.split("\n").filter(l => l.trim());
    const seen = new Set<string>();
    const parsed: ParsedCard[] = [];
    let duplicates = 0;
    let luhnValid = 0;
    let failed = 0;

    for (const line of lines) {
      const card = parseCardLine(line);
      if (card) {
        if (seen.has(card.number)) {
          duplicates++;
        } else {
          seen.add(card.number);
          parsed.push(card);
          if (luhnCheck(card.number)) luhnValid++;
        }
      } else {
        failed++;
      }
    }

    setParsedCards(parsed);
    setStats({
      inputLines: lines.length,
      parsed: parsed.length,
      duplicates,
      failed,
      luhnValid,
    });
  }

  function handleClear() {
    setRawInput("");
    setParsedCards([]);
    setStats({
      inputLines: 0,
      parsed: 0,
      duplicates: 0,
      failed: 0,
      luhnValid: 0,
    });
  }

  function handleDownload() {
    const content = parsedCards.map(c => c.formatted).join("\n");
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
            <path d="M12 3l1.912 5.813h6.113l-4.943 3.587 1.888 5.813L12 14.626l-4.97 3.587 1.888-5.813L3.974 8.813h6.114L12 3z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">Card Parser</h1>
          <p className="text-[11px] text-muted-foreground">
            Paste any messy card data — it detects the number, month, year &amp; CVV and converts to <code className="font-mono text-foreground/70">CARD|MM|YY|CVV</code>.
          </p>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Raw input */}
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
                <span className="text-xs font-semibold text-foreground">RAW INPUT</span>
              </div>
              {rawInput.trim() && (
                <button
                  onClick={handleClear}
                  className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={14}
              placeholder={`5423740031521502|10|27|520
5423 7400 3152 1502 10/27 520
card: 5423740031521502 exp: 10/27 cvv: 520
5423740031521502:1027:520`}
              className="w-full resize-none bg-transparent px-4 py-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/35 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleParse}
              disabled={!rawInput.trim()}
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
              Parse Cards
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
                  onClick={() => void navigator.clipboard.writeText(parsedCards.map(c => c.formatted).join("\n"))}
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
              value={parsedCards.map(c => c.formatted).join("\n")}
              readOnly
              rows={14}
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
                <div className="text-lg font-bold text-foreground">{stats.inputLines}</div>
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
                <div className="text-lg font-bold text-red-400">{stats.failed}</div>
                <div className="text-[10px] text-muted-foreground font-medium">GEÇERSİZ</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

