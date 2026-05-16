"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  CalendarDays,
  Pencil,
  Trash2,
  Gift,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Occasion } from "@/lib/types";
import {
  getOccasions,
  saveOccasion,
  deleteOccasion,
  getPersons,
  getHolidays,
  getGifts,
  getProducts,
  getPerson,
  getGift,
  getProduct,
} from "@/lib/storage";
import { toast } from "sonner";
import { Suspense } from "react";

interface AISuggestion {
  name: string;
  description: string;
  reason: string;
  productId?: string;
}

function OccasionForm({
  initial,
  defaultPersonId,
  onSave,
  onCancel,
}: {
  initial?: Partial<Occasion>;
  defaultPersonId?: string;
  onSave: (o: Occasion) => void;
  onCancel: () => void;
}) {
  const persons = getPersons();
  const holidays = getHolidays();
  const products = getProducts();

  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [holidayId, setHolidayId] = useState(initial?.holidayId ?? "");
  const [personIds, setPersonIds] = useState<string[]>(
    initial?.personIds ?? (defaultPersonId ? [defaultPersonId] : [])
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(initial?.productIds ?? []);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[] | null>(null);

  function togglePerson(id: string) {
    setPersonIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function handleAISuggest() {
    setAiLoading(true);
    setAiSuggestions(null);
    setTimeout(() => {
      const suggestions: AISuggestion[] =
        products.length >= 2
          ? products.slice(0, 3).map((p) => ({
              name: p.name,
              description: p.description || "From your product library",
              reason: `Great for ${name || "this occasion"}`,
              productId: p.id,
            }))
          : [
              { name: "Thoughtful Care Package", description: "Curated items tailored to the occasion", reason: "Personal and meaningful" },
              { name: "Experience Gift Card", description: "Let them choose their adventure", reason: "Perfect when you're unsure" },
              { name: "Custom Photo Book", description: "Memories captured in a beautiful book", reason: "Great for milestone occasions" },
            ];
      setAiSuggestions(suggestions);
      setAiLoading(false);
    }, 1000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const o = saveOccasion({
      id: initial?.id,
      name: name.trim(),
      date: date || undefined,
      notes: notes.trim() || undefined,
      personIds,
      giftIds: initial?.giftIds ?? [],
      productIds: selectedProductIds,
      holidayId: holidayId || undefined,
    });
    toast.success(initial?.id ? "Occasion updated!" : "Occasion created!");
    onSave(o);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="oname">Occasion name *</Label>
        <Input id="oname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Baby shower, Graduation party" required autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="odate">Date</Label>
          <Input id="odate" value={date} onChange={(e) => setDate(e.target.value)} type="date" />
        </div>
        <div className="space-y-2">
          <Label>Holiday (optional)</Label>
          <Select value={holidayId} onValueChange={(v) => setHolidayId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">No holiday</SelectItem>
              {holidays.map((h) => (
                <SelectItem key={h.id} value={h.id}>{h.icon} {h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>People this occasion is for</Label>
        <div className="flex flex-wrap gap-2">
          {persons.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePerson(p.id)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                personIds.includes(p.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white border-border hover:bg-accent"
              }`}
            >
              {p.emoji || "👤"} {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes about this occasion…" rows={2} />
      </div>

      <Button type="button" variant="outline" size="sm" onClick={handleAISuggest} disabled={aiLoading} className="w-full">
        <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
        {aiLoading ? "Finding suggestions…" : "AI: Suggest gift ideas for this occasion"}
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
              onClick={() => s.productId && toggleProduct(s.productId)}
              className="w-full text-left text-xs p-2 rounded border border-amber-200 bg-white hover:bg-amber-50 transition-colors space-y-0.5"
            >
              <div className="font-medium text-amber-900">{s.name}</div>
              <div className="text-amber-700">{s.description}</div>
              <div className="text-amber-600 italic">{s.reason}{s.productId ? " · Click to add" : ""}</div>
            </button>
          ))}
        </div>
      )}

      {products.length > 0 && (
        <div className="space-y-2">
          <Label>Good products for this occasion</Label>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProduct(p.id)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selectedProductIds.includes(p.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white border-border hover:bg-accent"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">{initial?.id ? "Save changes" : "Create occasion"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function OccasionsContent() {
  const searchParams = useSearchParams();
  const defaultPerson = searchParams.get("person") ?? undefined;
  const highlightId = searchParams.get("id") ?? undefined;

  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Occasion | null>(null);
  const [deleting, setDeleting] = useState<Occasion | null>(null);
  const [filterPerson, setFilterPerson] = useState(defaultPerson ?? "");

  const persons = getPersons();
  const products = getProducts();

  function load() {
    setOccasions(getOccasions());
  }

  useEffect(() => { load(); }, []);

  const filtered = filterPerson
    ? occasions.filter((o) => o.personIds.includes(filterPerson))
    : occasions;

  const sorted = [...filtered].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  function getPersonName(id: string) {
    return getPerson(id)?.name ?? "Unknown";
  }

  function getGiftsForOccasion(occasionId: string) {
    return getGifts().filter((g) => g.occasionId === occasionId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Occasions</h1>
          <p className="text-muted-foreground text-sm">One-time events with gifts planned or given</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add occasion
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={filterPerson} onValueChange={(v) => setFilterPerson(v ?? "")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All people" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All people</SelectItem>
            {persons.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.emoji ? `${p.emoji} ` : ""}{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterPerson && (
          <Button variant="ghost" size="sm" onClick={() => setFilterPerson("")}>Clear</Button>
        )}
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <div>
              <p className="font-medium">{occasions.length === 0 ? "No occasions yet" : "No occasions match your filter"}</p>
              <p className="text-sm text-muted-foreground">Occasions are events like baby showers, graduations, or birthdays</p>
            </div>
            {occasions.length === 0 && (
              <Button onClick={() => { setEditing(null); setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add your first occasion
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sorted.map((occasion) => {
            const occasionGifts = getGiftsForOccasion(occasion.id);
            const goodProducts = products.filter((p) => occasion.productIds.includes(p.id));
            const isHighlighted = highlightId === occasion.id;

            return (
              <Card
                key={occasion.id}
                className={`transition-all ${isHighlighted ? "ring-2 ring-primary" : ""}`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{occasion.name}</div>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                        {occasion.date && <span>📅 {occasion.date}</span>}
                        {occasion.personIds.length > 0 && (
                          <span>👤 {occasion.personIds.map(getPersonName).join(", ")}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(occasion); setShowForm(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleting(occasion)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {occasion.notes && (
                    <p className="text-sm text-muted-foreground">{occasion.notes}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      {occasionGifts.length} gift{occasionGifts.length !== 1 ? "s" : ""}
                    </span>
                    {goodProducts.length > 0 && (
                      <span>{goodProducts.length} product idea{goodProducts.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>

                  {occasionGifts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {occasionGifts.slice(0, 4).map((g) => (
                        <Badge key={g.id} variant="secondary" className="text-xs">
                          {g.status === "given" ? "✓" : g.status === "purchased" ? "🛍️" : "💡"} {g.name}
                        </Badge>
                      ))}
                      {occasionGifts.length > 4 && (
                        <Badge variant="outline" className="text-xs">+{occasionGifts.length - 4} more</Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/gifts?person=${occasion.personIds[0] ?? ""}`} className={buttonVariants({ size: "sm", variant: "outline" }) + " text-xs"}>
                      <Gift className="w-3 h-3 mr-1" /> Log gift
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditing(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit occasion" : "Add an occasion"}</DialogTitle>
          </DialogHeader>
          <OccasionForm
            initial={editing ?? undefined}
            defaultPersonId={defaultPerson}
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
              This occasion will be permanently removed. Gifts linked to it will remain but won&apos;t be connected to an occasion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) {
                  deleteOccasion(deleting.id);
                  toast.success("Occasion deleted");
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

export default function OccasionsPage() {
  return (
    <Suspense>
      <OccasionsContent />
    </Suspense>
  );
}
