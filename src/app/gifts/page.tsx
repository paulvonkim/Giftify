"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Gift,
  Star,
  Sparkles,
  Pencil,
  Trash2,
  Filter,
  ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Gift as GiftType, GiftStatus, GiftType as GiftKind } from "@/lib/types";
import {
  getGifts,
  saveGift,
  deleteGift,
  getPersons,
  getOccasions,
  getProducts,
  getPerson,
  getOccasion,
  getProduct,
  saveOccasion,
} from "@/lib/storage";
import { toast } from "sonner";
import { Suspense } from "react";

const STATUS_LABELS: Record<GiftStatus, string> = {
  idea: "Idea",
  purchased: "Purchased",
  given: "Given",
};

const STATUS_COLORS: Record<GiftStatus, string> = {
  idea: "bg-sky-100 text-sky-700 border-sky-200",
  purchased: "bg-amber-100 text-amber-700 border-amber-200",
  given: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

interface AISuggestion {
  name: string;
  description: string;
  reason: string;
  productId?: string;
}

function GiftForm({
  initial,
  defaultPersonId,
  onSave,
  onCancel,
}: {
  initial?: Partial<GiftType>;
  defaultPersonId?: string;
  onSave: (gift: GiftType) => void;
  onCancel: () => void;
}) {
  const persons = getPersons();
  const allOccasions = getOccasions();
  const products = getProducts();

  const [name, setName] = useState(initial?.name ?? "");
  const [personId, setPersonId] = useState(initial?.personIds?.[0] ?? defaultPersonId ?? "");
  const [occasionId, setOccasionId] = useState(initial?.occasionId ?? "");
  const [productId, setProductId] = useState(initial?.productId ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<GiftStatus>(initial?.status ?? "idea");
  const [type, setType] = useState<GiftKind | "">(initial?.type ?? "");
  const [starRating, setStarRating] = useState(initial?.starRating ?? 0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[] | null>(null);
  const [photoState, setPhotoState] = useState<"idle" | "preview">("idle");

  // Reset occasion when person changes
  const personOccasions = personId
    ? allOccasions.filter((o) => o.personIds.includes(personId))
    : allOccasions;

  // Resolved display labels (used in trigger since @base-ui Select.Value
  // falls back to the raw value string when items aren't mounted)
  const selectedPerson = persons.find((p) => p.id === personId);
  const selectedOccasion = allOccasions.find((o) => o.id === occasionId);
  const selectedProduct = products.find((p) => p.id === productId);

  function handleAISuggest() {
    setAiLoading(true);
    setAiSuggestions(null);
    setTimeout(() => {
      const suggestions: AISuggestion[] =
        products.length >= 2
          ? products.slice(0, 3).map((p) => ({
              name: p.name,
              description: p.description || "From your product library",
              reason: personId
                ? `A great fit for ${selectedPerson?.name ?? "this person"}`
                : "From your library",
              productId: p.id,
            }))
          : [
              { name: "Artisan Honey Collection", description: "Local, sustainably sourced honey gift set", reason: "Thoughtful and personal" },
              { name: "Cozy Sock Bundle", description: "Premium wool socks in seasonal colors", reason: "Universally loved" },
              { name: "Personalized Journal", description: "Leather-bound journal with custom monogram", reason: "Great for any occasion" },
            ];
      setAiSuggestions(suggestions);
      setAiLoading(false);
    }, 1000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !personId || !occasionId) return;

    let resolvedOccasionId = occasionId;
    if (occasionId === "__new__") {
      const newOccasion = saveOccasion({
        name: `Gift occasion for ${selectedPerson?.name ?? ""}`,
        personIds: [personId],
        giftIds: [],
        productIds: [],
      });
      resolvedOccasionId = newOccasion.id;
    }

    const gift = saveGift({
      id: initial?.id,
      name: name.trim(),
      personIds: [personId],
      occasionId: resolvedOccasionId,
      productId: productId || undefined,
      notes: notes.trim() || undefined,
      status,
      type: type || undefined,
      starRating: starRating || undefined,
      suggestedProductIds: [],
    });

    toast.success(initial?.id ? "Gift updated!" : "Gift logged!");
    onSave(gift);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Gift name */}
      <div className="space-y-2">
        <Label htmlFor="gname">Gift name *</Label>
        <Input
          id="gname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Cozy weekend picnic basket"
          required
          autoFocus
        />
      </div>

      {/* Photo upload — mock / coming soon */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Photo</Label>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            coming soon
          </span>
        </div>
        {photoState === "idle" ? (
          <button
            type="button"
            onClick={() => setPhotoState("preview")}
            className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors p-6 text-center group"
          >
            <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Add a photo</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Drag &amp; drop or click to upload</p>
          </button>
        ) : (
          <div className="relative rounded-xl border border-border bg-muted/40 p-3 flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">photo_preview.jpg</p>
              <p className="text-xs text-muted-foreground">Photo storage coming in a future version</p>
            </div>
            <button
              type="button"
              onClick={() => setPhotoState("idle")}
              className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Person + Occasion */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Person *</Label>
          <Select value={personId} onValueChange={(v) => { setPersonId(v ?? ""); setOccasionId(""); }}>
            <SelectTrigger className="w-full">
              {/* Custom display: @base-ui SelectValue renders the raw value (ID) when
                  items aren't mounted (popup closed). We resolve the name directly. */}
              <span className={cn("flex-1 truncate text-left text-sm", !selectedPerson && "text-muted-foreground")}>
                {selectedPerson
                  ? `${selectedPerson.emoji ? selectedPerson.emoji + " " : ""}${selectedPerson.name}`
                  : "Select person"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {persons.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.emoji ? `${p.emoji} ` : ""}{p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Occasion *</Label>
          <Select value={occasionId} onValueChange={(v) => setOccasionId(v ?? "")}>
            <SelectTrigger className="w-full">
              <span className={cn("flex-1 truncate text-left text-sm", !occasionId && "text-muted-foreground")}>
                {occasionId === "__new__"
                  ? "+ New occasion"
                  : selectedOccasion
                    ? selectedOccasion.name
                    : "Select occasion"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {personOccasions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}{o.date ? ` (${o.date})` : ""}
                </SelectItem>
              ))}
              <SelectItem value="__new__">+ New one-time occasion</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Product */}
      <div className="space-y-2">
        <Label>Product from library (optional)</Label>
        <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
          <SelectTrigger className="w-full">
            <span className={cn("flex-1 truncate text-left text-sm", !productId && "text-muted-foreground")}>
              {selectedProduct
                ? `${selectedProduct.name}${selectedProduct.price ? ` — $${selectedProduct.price}` : ""}`
                : "No product (custom gift)"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No product (custom gift)</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}{p.price ? ` — $${p.price}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* AI Suggest */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAISuggest}
        disabled={aiLoading}
        className="w-full"
      >
        <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
        {aiLoading ? "Finding suggestions…" : "AI: Suggest a gift"}
      </Button>

      {aiSuggestions && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-700">
            <Sparkles className="w-3 h-3" /> AI suggestion (demo)
          </div>
          {aiSuggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setName(s.name);
                if (s.productId) setProductId(s.productId);
              }}
              className="w-full text-left text-xs p-2 rounded border border-amber-200 bg-white hover:bg-amber-50 transition-colors space-y-0.5"
            >
              <div className="font-medium text-amber-900">{s.name}</div>
              <div className="text-amber-700">{s.description}</div>
              <div className="text-amber-600 italic">{s.reason} · Click to use</div>
            </button>
          ))}
        </div>
      )}

      {/* Status + Type */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus((v ?? "idea") as GiftStatus)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="idea">Idea</SelectItem>
              <SelectItem value="purchased">Purchased</SelectItem>
              <SelectItem value="given">Given</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType((v ?? "") as GiftKind | "")}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Not specified</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="experience">Experience</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Star rating */}
      <div className="space-y-2">
        <Label>Star Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStarRating(starRating === n ? 0 : n)}
              className="p-1"
            >
              <Star
                className={`w-5 h-5 transition-colors ${n <= starRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="gnotes">Notes</Label>
        <Textarea
          id="gnotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about this gift…"
          rows={2}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={!name.trim() || !personId || !occasionId}>
          {initial?.id ? "Save changes" : "Log gift"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function GiftsContent() {
  const searchParams = useSearchParams();
  const defaultPerson = searchParams.get("person") ?? undefined;

  const [gifts, setGifts] = useState<GiftType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GiftType | null>(null);
  const [deleting, setDeleting] = useState<GiftType | null>(null);
  const [filterPerson, setFilterPerson] = useState(defaultPerson ?? "");
  const [filterStatus, setFilterStatus] = useState<GiftStatus | "">("");

  const persons = getPersons();
  const occasions = getOccasions();
  const products = getProducts();

  function load() {
    setGifts(getGifts());
  }

  useEffect(() => { load(); }, []);

  const filtered = gifts.filter((g) => {
    if (filterPerson && !g.personIds.includes(filterPerson)) return false;
    if (filterStatus && g.status !== filterStatus) return false;
    return true;
  });

  function getPersonName(id: string) {
    return getPerson(id)?.name ?? "Unknown";
  }
  function getOccasionName(id: string) {
    return getOccasion(id)?.name ?? "Unknown occasion";
  }
  function getProductName(id: string) {
    return getProduct(id)?.name ?? "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gifts</h1>
          <p className="text-muted-foreground text-sm">Your complete gift log</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Log a gift
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterPerson} onValueChange={(v) => setFilterPerson(v ?? "")}>
          <SelectTrigger className="w-44">
            <Filter className="w-3.5 h-3.5 mr-1 shrink-0 text-muted-foreground" />
            <span className={cn("flex-1 truncate text-left text-sm", !filterPerson && "text-muted-foreground")}>
              {filterPerson
                ? (() => { const p = persons.find((x) => x.id === filterPerson); return p ? `${p.emoji ? p.emoji + " " : ""}${p.name}` : "Unknown"; })()
                : "All people"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All people</SelectItem>
            {persons.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.emoji ? `${p.emoji} ` : ""}{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(v) => setFilterStatus((v ?? "") as GiftStatus | "")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="purchased">Purchased</SelectItem>
            <SelectItem value="given">Given</SelectItem>
          </SelectContent>
        </Select>

        {(filterPerson || filterStatus) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterPerson(""); setFilterStatus(""); }}>
            Clear filters
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <Gift className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <div>
              <p className="font-medium">{gifts.length === 0 ? "No gifts logged yet" : "No gifts match your filters"}</p>
              <p className="text-sm text-muted-foreground">Log a gift to start tracking what you&apos;ve given</p>
            </div>
            {gifts.length === 0 && (
              <Button onClick={() => { setEditing(null); setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Log your first gift
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((gift) => (
            <Card key={gift.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{gift.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_COLORS[gift.status]}`}>
                      {STATUS_LABELS[gift.status]}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>
                      👤 {gift.personIds.map(getPersonName).join(", ")}
                    </span>
                    <span>📅 {getOccasionName(gift.occasionId)}</span>
                    {gift.productId && (
                      <span>📦 {getProductName(gift.productId)}</span>
                    )}
                    {gift.type && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">{gift.type}</Badge>
                    )}
                  </div>

                  {gift.notes && (
                    <p className="text-xs text-muted-foreground italic">{gift.notes}</p>
                  )}

                  {gift.starRating && (
                    <div className="flex">
                      {Array.from({ length: gift.starRating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => { setEditing(gift); setShowForm(true); }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setDeleting(gift)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditing(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit gift" : "Log a gift"}</DialogTitle>
          </DialogHeader>
          {persons.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-muted-foreground text-sm">You need to add a person before logging a gift.</p>
              <a href="/people" className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted transition-colors">
                Go to People
              </a>
            </div>
          ) : (
            <GiftForm
              initial={editing ?? undefined}
              defaultPersonId={defaultPerson}
              onSave={() => { setShowForm(false); setEditing(null); load(); }}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleting?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This gift record will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) {
                  deleteGift(deleting.id);
                  toast.success("Gift deleted");
                  setDeleting(null);
                  load();
                }
              }}
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

export default function GiftsPage() {
  return (
    <Suspense>
      <GiftsContent />
    </Suspense>
  );
}
