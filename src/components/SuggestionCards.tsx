import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Pencil } from "lucide-react";

interface SuggestionOption {
  angle: string;
  label: string;
  text: string;
}

interface SuggestionCardsProps {
  title: string;
  helperText: string;
  options: SuggestionOption[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  editingValue: string;
  onEditChange: (value: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
}

const ANGLE_STYLES: Record<string, { border: string; badge: string }> = {
  educativa: { border: "border-blue-200/60", badge: "bg-blue-50 text-blue-700" },
  "estratégica": { border: "border-amber-200/60", badge: "bg-amber-50 text-amber-700" },
  manifesto: { border: "border-rose-200/60", badge: "bg-rose-50 text-rose-700" },
  autoridade: { border: "border-indigo-200/60", badge: "bg-indigo-50 text-indigo-700" },
  humana: { border: "border-emerald-200/60", badge: "bg-emerald-50 text-emerald-700" },
  premium: { border: "border-purple-200/60", badge: "bg-purple-50 text-purple-700" },
};

const SuggestionCards: React.FC<SuggestionCardsProps> = ({
  title,
  helperText,
  options,
  selectedIndex,
  onSelect,
  editingValue,
  onEditChange,
  isEditing,
  onToggleEdit,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">{title}</label>
          <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
            Sugestão do MEDSHIFT
          </span>
        </div>
        {selectedIndex !== null && (
          <button
            onClick={onToggleEdit}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-3 w-3" />
            {isEditing ? "Fechar" : "Editar"}
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">{helperText}</p>

      {/* Option cards */}
      <div className="grid gap-2">
        {options.map((option, i) => {
          const styles = ANGLE_STYLES[option.angle] || { border: "border-border", badge: "bg-muted text-muted-foreground" };
          const isSelected = selectedIndex === i;

          return (
            <motion.button
              key={`${option.angle}-${i}`}
              onClick={() => onSelect(i)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`group relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? `${styles.border} bg-accent/[0.04] shadow-sm ring-1 ring-accent/20`
                  : "border-border/60 bg-background hover:border-accent/30 hover:bg-accent/[0.02]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${styles.badge}`}>
                      {option.label}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {option.text}
                  </p>
                </div>
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                    isSelected
                      ? "border-accent bg-accent"
                      : "border-muted-foreground/30 group-hover:border-accent/50"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-accent-foreground" />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Inline edit area */}
      <AnimatePresence>
        {isEditing && selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 relative">
              <textarea
                value={editingValue}
                onChange={(e) => onEditChange(e.target.value)}
                className="w-full rounded-xl border border-accent/30 bg-accent/[0.02] p-3 text-sm text-foreground resize-none min-h-[72px] focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/50 transition-colors"
                placeholder="Ajuste a sugestão selecionada…"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Sua edição será usada no lugar da sugestão original.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuggestionCards;
