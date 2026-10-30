import { LANGUAGE_OPTIONS } from "@/data/mockData";
import type { Language } from "@/types";

interface LanguageSelectProps {
  value: Language;
  onChange: (language: Language) => void;
  label?: string;
}

export default function LanguageSelect({
  value,
  onChange,
  label = "Preferred language",
}: LanguageSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-base font-medium text-ink">{label}</span>
      <div className="flex flex-wrap gap-2">
        {LANGUAGE_OPTIONS.map((option) => {
          const isSelected = option.code === value;
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => onChange(option.code)}
              aria-pressed={isSelected}
              className={`rounded-full border px-4 py-2 text-base font-medium transition-colors ${
                isSelected
                  ? "border-workshop-500 bg-workshop-500 text-white"
                  : "border-line bg-white text-ink hover:border-workshop-400"
              }`}
            >
              {option.nativeLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
