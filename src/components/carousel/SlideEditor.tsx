import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Pencil } from "lucide-react";
import type { SlideData } from "./SlideRenderer";

interface SlideEditorProps {
  slide: SlideData;
  onSave: (updated: SlideData) => void;
  onCancel: () => void;
}

const SlideEditor: React.FC<SlideEditorProps> = ({ slide, onSave, onCancel }) => {
  const [headline, setHeadline] = useState(slide.headline);
  const [body, setBody] = useState(slide.body || "");
  const [items, setItems] = useState<string[]>(slide.items || []);

  const handleSave = () => {
    onSave({
      ...slide,
      headline,
      body: body.trim() || undefined,
      items: items.length > 0 ? items.filter(Boolean) : undefined,
    });
  };

  const updateItem = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    setItems(updated);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pencil className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Editando: {slide.label}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Slide {slide.slideNumber}/{slide.totalSlides}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Título principal</Label>
          <Textarea
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="min-h-[72px] text-sm resize-none"
            placeholder="Headline do slide..."
          />
        </div>

        {(slide.type === "cover" || slide.type === "editorial" || slide.type === "signature") && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Texto de apoio</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              placeholder="Texto complementar (opcional)..."
            />
          </div>
        )}

        {slide.type === "structured" && items.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Itens</Label>
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-accent w-6">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Input
                  value={item}
                  onChange={(e) => updateItem(i, e.target.value)}
                  className="text-sm h-9"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={handleSave} size="sm" className="rounded-lg text-xs bg-accent text-accent-foreground hover:bg-accent/90">
          <Check className="h-3 w-3 mr-1" />
          Salvar
        </Button>
        <Button onClick={onCancel} variant="ghost" size="sm" className="rounded-lg text-xs">
          <X className="h-3 w-3 mr-1" />
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default SlideEditor;
