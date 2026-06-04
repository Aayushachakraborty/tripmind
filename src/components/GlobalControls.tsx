import { useState } from "react";
import { CURRENCIES, type CurrencyCode } from "../hooks/useCurrencyRates";
import { LANGUAGES, type LanguageCode } from "../i18n/strings";

type Props = {
  language: LanguageCode;
  currency: CurrencyCode;
  onLanguageChange: (language: LanguageCode) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  labels: { language: string; currency: string };
};

export function GlobalControls({ language, currency, onLanguageChange, onCurrencyChange, labels }: Props) {
  const [openPanel, setOpenPanel] = useState<"language" | "currency" | "">("");

  return (
    <div className="global-controls">
      <button type="button" className="control-chip" aria-expanded={openPanel === "language"} onClick={() => setOpenPanel(openPanel === "language" ? "" : "language")}>
        {labels.language}: {language}
      </button>
      <button type="button" className="control-chip" aria-expanded={openPanel === "currency"} onClick={() => setOpenPanel(openPanel === "currency" ? "" : "currency")}>
        {labels.currency}: {currency}
      </button>
      <div className={openPanel ? "selector-panel open" : "selector-panel"} aria-hidden={!openPanel}>
        {openPanel === "language" ? LANGUAGES.map((item) => (
          <button type="button" key={item} className={language === item ? "selector-item active" : "selector-item"} onClick={() => { onLanguageChange(item); setOpenPanel(""); }}>
            {item}
          </button>
        )) : null}
        {openPanel === "currency" ? CURRENCIES.map((item) => (
          <button type="button" key={item} className={currency === item ? "selector-item active" : "selector-item"} onClick={() => { onCurrencyChange(item); setOpenPanel(""); }}>
            {item}
          </button>
        )) : null}
      </div>
    </div>
  );
}
