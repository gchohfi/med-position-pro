import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Archive,
  Eye,
  Copy,
  Trash2,
  Layers,
  ArrowRight,
  Download,
  Star,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import {
  TravessIARoteiro,
  travessiaToSlideData,
  type PreferredVisualStyle,
} from "@/types/carousel";
import CarouselVisualPreview from "@/components/carousel/CarouselVisualPreview";
import type { SlideData } from "@/components/carousel/SlideRenderer";

interface SavedCarousel {
  id: string;
  title: string | null;
  created_at: string;
  strategic_input: any;
  generated_content: any;
  golden_case: boolean;
  carousel_slide_urls: any;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35 },
  }),
};

const Biblioteca = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedCarousel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SavedCarousel | null>(null);
  const [slideDataList, setSlideDataList] = useState<SlideData[]>([]);
  const [visualStyle, setVisualStyle] = useState<PreferredVisualStyle>("editorial_black_gold");

  useEffect(() => {
    if (user) loadItems();
  }, [user]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("content_outputs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("content_type", "carrossel")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data as unknown as SavedCarousel[]) || []);
    } catch {
      toast.error("Erro ao carregar biblioteca.");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item: SavedCarousel) => {
    setSelectedItem(item);
    const content = item.generated_content;
    if (content?.roteiro) {
      const roteiro = content.roteiro as TravessIARoteiro;
      const slides = roteiro.slides.map((s: any) => travessiaToSlideData(s, roteiro.slides.length));
      setSlideDataList(slides);
      setVisualStyle(content.visualStyle || "editorial_black_gold");
    } else if (content?.slideDataList) {
      setSlideDataList(content.slideDataList);
      setVisualStyle(content.visualStyle || "editorial_black_gold");
    }
  };

  const handleDuplicate = async (item: SavedCarousel) => {
    try {
      const { error } = await supabase.from("content_outputs").insert({
        user_id: user!.id,
        content_type: "carrossel",
        title: `${item.title || "Carrossel"} (cópia)`,
        strategic_input: item.strategic_input,
        generated_content: item.generated_content,
      } as any);
      if (error) throw error;
      toast.success("Carrossel duplicado!");
      loadItems();
    } catch {
      toast.error("Erro ao duplicar.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("content_outputs").delete().eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.filter((c) => c.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
        setSlideDataList([]);
      }
      toast.success("Carrossel removido.");
    } catch {
      toast.error("Erro ao remover.");
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
            Biblioteca
          </h1>
          <p className="text-muted-foreground text-sm">
            Seus carrosséis salvos — prontos para visualizar, baixar ou duplicar.
          </p>
        </div>

        {/* Stats */}
        {!loading && items.length > 0 && (
          <div className="flex gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border px-4 py-3">
              <span className="text-2xl font-semibold text-foreground">{items.length}</span>
              <span className="text-xs text-muted-foreground ml-2">Carrosséis</span>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5">
                <Skeleton className="h-4 w-36 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center py-20">
            <Archive className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-lg text-foreground mb-1">
              Nenhum carrossel salvo
            </h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
              Crie seu primeiro carrossel e salve para acessá-lo aqui.
            </p>
            <Button
              onClick={() => navigate("/carrossel")}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Criar carrossel
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Grid */}
        {!loading && items.length > 0 && !selectedItem && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                className="bg-card rounded-2xl border border-border p-5 hover:border-accent/20 transition-colors"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                    {item.title || "Carrossel sem título"}
                  </h3>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(item.created_at).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                {item.strategic_input?.tese && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {item.strategic_input.tese}
                  </p>
                )}
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1"
                    onClick={() => handleView(item)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Visualizar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => handleDuplicate(item)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Preview */}
        {selectedItem && slideDataList.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold">
                {selectedItem.title || "Carrossel"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => {
                setSelectedItem(null);
                setSlideDataList([]);
              }}>
                ← Voltar à lista
              </Button>
            </div>
            <CarouselVisualPreview
              slides={slideDataList}
              visualStyle={visualStyle}
              contentOutputId={selectedItem.id}
              onSlidesChange={setSlideDataList}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Biblioteca;
