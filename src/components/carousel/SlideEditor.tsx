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
  // TravessIA fields
  const [eyebrow, setEyebrow] = useState(slide.eyebrow || "");
  const [imgQuery, setImgQuery] = useState(slide.imgQuery || "");
  const [zoneLabel, setZoneLabel] = useState(slide.zoneLabel || "");
  const [statNumber, setStatNumber] = useState(slide.statNumber || "");
  const [statUnit, setStatUnit] = useState(slide.statUnit || "");
  const [eDai, setEDai] = useState(slide.eDai || "");
  const [miniTitulo, setMiniTitulo] = useState(slide.miniTitulo || "");
  const [opinion, setOpinion] = useState(slide.opinion || "");
  const [conclusion, setConclusion] = useState(slide.conclusion || "");
  const [perguntaComentario, setPerguntaComentario] = useState(slide.perguntaComentario || "");

  const handleSave = () => {
    const base: SlideData = {
      ...slide,
      headline,
      body: body.trim() || undefined,
      items: items.length > 0 ? items.filter(Boolean) : undefined,
    };

    if (slide.travessiaLayout) {
      base.eyebrow = eyebrow.trim() || undefined;
      base.imgQuery = imgQuery.trim() || undefined;
      base.zoneLabel = zoneLabel.trim() || undefined;
      base.statNumber = statNumber.trim() || undefined;
      base.statUnit = statUnit.trim() || undefined;
      base.eDai = eDai.trim() || undefined;
      base.miniTitulo = miniTitulo.trim() || undefined;
      base.opinion = opinion.trim() || undefined;
      base.conclusion = conclusion.trim() || undefined;
      base.perguntaComentario = perguntaComentario.trim() || undefined;
    }

    onSave(base);
  };

  const updateItem = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    setItems(updated);
  };

  const isTravessia = !!slide.travessiaLayout;
  const layout = slide.travessiaLayout;

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
          {layout && <span className="ml-1 opacity-60">({layout})</span>}
        </span>
      </div>

      <div className="space-y-3">
        {/* ── TravessIA layout-specific fields ── */}
        {isTravessia && layout === "capa" && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Eyebrow</Label>
              <Input
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                className="text-sm h-9"
                placeholder="Texto acima do titulo..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Headline</Label>
              <Textarea
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="min-h-[72px] text-sm resize-none"
                placeholder="Titulo principal da capa..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Busca de imagem</Label>
              <Input
                value={imgQuery}
                onChange={(e) => setImgQuery(e.target.value)}
                className="text-sm h-9"
                placeholder="Termo para busca de imagem..."
              />
            </div>
          </>
        )}

        {isTravessia && layout === "timg" && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Mini titulo</Label>
              <Textarea
                value={miniTitulo}
                onChange={(e) => setMiniTitulo(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
                placeholder="Titulo do slide..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Texto</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
                placeholder="Texto do slide..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Busca de imagem</Label>
              <Input
                value={imgQuery}
                onChange={(e) => setImgQuery(e.target.value)}
                className="text-sm h-9"
                placeholder="Termo para busca de imagem..."
              />
            </div>
          </>
        )}

        {isTravessia && layout === "tonly" && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Zone label</Label>
              <Input
                value={zoneLabel}
                onChange={(e) => setZoneLabel(e.target.value)}
                className="text-sm h-9"
                placeholder="Label da zona (ex: CONCEITO, METODO)..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Big text</Label>
              <Textarea
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="min-h-[72px] text-sm resize-none"
                placeholder="Texto principal grande..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Texto</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
                placeholder="Texto complementar..."
              />
            </div>
          </>
        )}

        {isTravessia && layout === "stat" && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Numero</Label>
              <Input
                value={statNumber}
                onChange={(e) => setStatNumber(e.target.value)}
                className="text-sm h-9"
                placeholder="Ex: 73%, 4x, 2.1M..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Unidade</Label>
              <Input
                value={statUnit}
                onChange={(e) => setStatUnit(e.target.value)}
                className="text-sm h-9"
                placeholder="Ex: dos medicos, mais engajamento..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Texto</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
                placeholder="Contexto do dado..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">E dai?</Label>
              <Textarea
                value={eDai}
                onChange={(e) => setEDai(e.target.value)}
                className="min-h-[48px] text-sm resize-none"
                placeholder="Implicacao pratica do dado..."
              />
            </div>
          </>
        )}

        {isTravessia && layout === "turning" && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Turn text</Label>
              <Textarea
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="min-h-[72px] text-sm resize-none"
                placeholder="Texto de virada..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Opiniao</Label>
              <Textarea
                value={opinion}
                onChange={(e) => setOpinion(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
                placeholder="Opiniao ou posicionamento..."
              />
            </div>
          </>
        )}

        {isTravessia && layout === "light" && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Mini titulo</Label>
              <Textarea
                value={miniTitulo}
                onChange={(e) => setMiniTitulo(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
                placeholder="Titulo do slide..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Texto</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
                placeholder="Texto do slide..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Busca de imagem</Label>
              <Input
                value={imgQuery}
                onChange={(e) => setImgQuery(e.target.value)}
                className="text-sm h-9"
                placeholder="Termo para busca de imagem (opcional)..."
              />
            </div>
          </>
        )}

        {isTravessia && layout === "final" && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Conclusao</Label>
              <Textarea
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                className="min-h-[72px] text-sm resize-none"
                placeholder="Frase de conclusao..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Pergunta para comentarios</Label>
              <Textarea
                value={perguntaComentario}
                onChange={(e) => setPerguntaComentario(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
                placeholder="Pergunta para gerar engajamento..."
              />
            </div>
          </>
        )}

        {/* ── Standard (non-TravessIA) fields ── */}
        {!isTravessia && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Titulo principal</Label>
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
          </>
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
