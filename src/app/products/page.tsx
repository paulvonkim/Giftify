"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Package,
  ExternalLink,
  Pencil,
  Trash2,
  Tag,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Product } from "@/lib/types";
import {
  getProducts,
  saveProduct,
  deleteProduct,
  getProductGiftCount,
  getPerson,
  getHolidays,
} from "@/lib/storage";
import { toast } from "sonner";

interface AISuggestion {
  name: string;
  description: string;
  reason: string;
}

function ProductForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Product>;
  onSave: (product: Product) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const holidays = getHolidays();
  const [selectedHolidayIds, setSelectedHolidayIds] = useState<string[]>(initial?.goodForHolidayIds ?? []);

  function toggleHoliday(id: string) {
    setSelectedHolidayIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const product = saveProduct({
      id: initial?.id,
      name: name.trim(),
      description: description.trim() || undefined,
      link: link.trim() || undefined,
      price: price ? parseFloat(price) : undefined,
      tags,
      goodForHolidayIds: selectedHolidayIds,
      similarProductIds: initial?.similarProductIds ?? [],
    });
    toast.success(initial?.id ? "Product updated!" : "Product added!");
    onSave(product);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pname">Product name *</Label>
        <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cozy Blanket" required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pdesc">Description</Label>
        <Textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes about this product…" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="plink">Buy link</Label>
          <Input id="plink" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" type="url" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pprice">Price ($)</Label>
          <Input id="pprice" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" type="number" min="0" step="0.01" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ptags">Tags (comma-separated)</Label>
        <Input id="ptags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g. cozy, home, practical" />
      </div>
      {holidays.length > 0 && (
        <div className="space-y-2">
          <Label>Good for holidays</Label>
          <div className="flex flex-wrap gap-2">
            {holidays.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => toggleHoliday(h.id)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selectedHolidayIds.includes(h.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white border-border hover:bg-accent"
                }`}
              >
                {h.icon} {h.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">{initial?.id ? "Save changes" : "Add product"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [giftInfo, setGiftInfo] = useState<Record<string, { count: number; personIds: string[] }>>({});
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[] | null>(null);
  const [aiProductId, setAiProductId] = useState<string | null>(null);

  function load() {
    const ps = getProducts();
    setProducts(ps);
    const info: Record<string, { count: number; personIds: string[] }> = {};
    for (const p of ps) info[p.id] = getProductGiftCount(p.id);
    setGiftInfo(info);
  }

  useEffect(() => { load(); }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  function handleAISuggest(product: Product) {
    setAiProductId(product.id);
    setAiLoading(product.id);
    setAiSuggestions(null);

    setTimeout(() => {
      const similar: AISuggestion[] =
        products.length >= 2
          ? products
              .filter((p) => p.id !== product.id)
              .slice(0, 2)
              .map((p) => ({
                name: p.name,
                description: p.description || "In your library",
                reason: `Similar vibe to ${product.name}`,
              }))
          : [
              {
                name: "Personalized Keepsake Box",
                description: "A custom engraved wooden keepsake box",
                reason: "Great for meaningful, lasting gifts",
              },
              {
                name: "Premium Candle Set",
                description: "Luxury scented candles in a beautiful gift box",
                reason: "Always a crowd-pleaser",
              },
            ];
      setAiSuggestions(similar);
      setAiLoading(null);
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Library</h1>
          <p className="text-muted-foreground text-sm">Your curated collection of gift ideas</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add product
        </Button>
      </div>

      <Input
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <Package className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <div>
              <p className="font-medium">{search ? "No products match your search" : "No products yet"}</p>
              <p className="text-sm text-muted-foreground">Add gift ideas to your library to track and reuse them</p>
            </div>
            {!search && (
              <Button onClick={() => { setEditing(null); setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add your first product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((product) => {
            const info = giftInfo[product.id] ?? { count: 0, personIds: [] };
            const isShowingAI = aiProductId === product.id;
            return (
              <Card key={product.id} className="flex flex-col">
                <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{product.name}</div>
                    {product.price !== undefined && (
                      <div className="text-sm text-muted-foreground">${product.price.toFixed(2)}</div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(product); setShowForm(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleting(product)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {product.description && (
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  )}
                  {product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Gifted {info.count}×
                    </span>
                    {product.link && (
                      <a href={product.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                        <ExternalLink className="w-3 h-3" /> Buy link
                      </a>
                    )}
                  </div>

                  {info.count > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Given to:{" "}
                      {info.personIds.slice(0, 3).map((pid) => {
                        const person = getPerson(pid);
                        return person?.name ?? "Unknown";
                      }).join(", ")}
                      {info.personIds.length > 3 ? ` +${info.personIds.length - 3} more` : ""}
                    </div>
                  )}

                  <Separator />

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleAISuggest(product)}
                    disabled={aiLoading === product.id}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    {aiLoading === product.id ? "Finding similar…" : "AI: Find similar gifts"}
                  </Button>

                  {isShowingAI && aiSuggestions && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <Sparkles className="w-3 h-3" /> AI suggestion (demo)
                      </div>
                      {aiSuggestions.map((s, i) => (
                        <div key={i} className="text-xs space-y-0.5">
                          <div className="font-medium text-amber-900">{s.name}</div>
                          <div className="text-amber-700">{s.description}</div>
                          <div className="text-amber-600 italic">{s.reason}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditing(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add a product"}</DialogTitle>
          </DialogHeader>
          <ProductForm
            initial={editing ?? undefined}
            onSave={() => { setShowForm(false); setEditing(null); load(); }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleting?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This product will be removed from your library. Existing gift records that reference it will keep the product name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleting) { deleteProduct(deleting.id); toast.success("Product deleted"); setDeleting(null); load(); } }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
