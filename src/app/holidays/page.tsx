"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, CalendarDays, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Holiday, Person } from "@/lib/types";
import {
  getHolidays,
  saveHoliday,
  deleteHoliday,
  getPersons,
  getPerson,
  savePerson,
  getOccasions,
  autoCreateHolidayOccasions,
  autoCreateBirthdayOccasions,
} from "@/lib/storage";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#dc2626", "#ea580c", "#d97706", "#16a34a",
  "#0891b2", "#2563eb", "#7c3aed", "#db2777",
  "#c026d3", "#78716c",
];

const QUICK_ICONS = ["🎄", "🎂", "🐣", "🎃", "🦃", "🎆", "❤️", "✨", "🌸", "🕎", "🪔", "☪️", "🎊", "🎁", "🌟"];

const IS_BIRTHDAY = (h: Holiday) => h.dateLogic === "person-birthday";

// "12-25" → "December 25", "person-birthday" → "Each person's birthday", else show as-is
function formatDateLogic(logic: string): string {
  if (logic === "person-birthday") return "Each person's birthday";
  if (/^\d{2}-\d{2}$/.test(logic)) {
    const [m, d] = logic.split("-").map(Number);
    return new Date(2000, m - 1, d).toLocaleDateString(undefined, { month: "long", day: "numeric" });
  }
  return logic;
}

// ─── HolidayForm ──────────────────────────────────────────────────────────────

function HolidayForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Holiday>;
  onSave: (h: Holiday) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "🎉");
  const [color, setColor] = useState(initial?.color ?? "#2563eb");
  const [dateLogic, setDateLogic] = useState(initial?.dateLogic ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const h = saveHoliday({
      id: initial?.id,
      name: name.trim(),
      icon: icon.trim() || "🎉",
      color,
      dateLogic: dateLogic.trim() || undefined,
      productIds: initial?.productIds ?? [],
      linkedPersonIds: initial?.linkedPersonIds ?? [],
    });
    toast.success(initial?.id ? "Holiday updated!" : "Holiday created!");
    onSave(h);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hname">Name *</Label>
        <Input
          id="hname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Mother's Day, Hanukkah, Anniversary…"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {QUICK_ICONS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setIcon(em)}
              className={cn(
                "w-8 h-8 rounded-lg text-lg flex items-center justify-center border transition-all",
                icon === em ? "border-primary bg-primary/10 scale-110" : "border-border hover:bg-accent"
              )}
            >
              {em}
            </button>
          ))}
        </div>
        <Input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="Or type any emoji"
          maxLength={2}
          className="w-24"
        />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "w-7 h-7 rounded-full border-2 transition-all",
                color === c ? "border-foreground scale-110 shadow-sm" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hdate">Date / date logic</Label>
        <Input
          id="hdate"
          value={dateLogic}
          onChange={(e) => setDateLogic(e.target.value)}
          placeholder="e.g. 12-25 or last Sunday of April"
        />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Use <strong>MM-DD</strong> for fixed dates (e.g. <code>12-25</code> for Christmas).
          Use <strong>person-birthday</strong> for birthday holidays.
          Or type a plain description like <em>last Sunday of April</em>.
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {initial?.id ? "Save changes" : "Create holiday"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── LinkPersonsDialog ────────────────────────────────────────────────────────

function LinkPersonsDialog({
  holiday,
  open,
  onClose,
  onSaved,
}: {
  holiday: Holiday;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isBirthday = IS_BIRTHDAY(holiday);
  const allPersons = getPersons();

  const [selectedIds, setSelectedIds] = useState<string[]>([...holiday.linkedPersonIds]);
  // birthday overrides keyed by personId — only used for birthday holidays
  const [birthdayMap, setBirthdayMap] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const p of allPersons) {
      if (p.birthdayDate) m[p.id] = p.birthdayDate;
    }
    return m;
  });

  // Re-sync when holiday changes (dialog re-opens)
  useEffect(() => {
    setSelectedIds([...holiday.linkedPersonIds]);
  }, [holiday.linkedPersonIds, open]);

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSave() {
    const prevLinked = new Set(holiday.linkedPersonIds);
    const nextLinked = new Set(selectedIds);

    const toAdd = selectedIds.filter((id) => !prevLinked.has(id));

    // Save the updated linkedPersonIds on the holiday
    saveHoliday({ ...holiday, linkedPersonIds: selectedIds });

    // For birthday holiday: update person birthdayDate if changed
    if (isBirthday) {
      for (const personId of selectedIds) {
        const person = getPerson(personId);
        if (!person) continue;
        const newBday = birthdayMap[personId] ?? "";
        if (newBday && newBday !== person.birthdayDate) {
          savePerson({ ...person, birthdayDate: newBday });
        }
      }
    }

    // Auto-create occasions for newly linked persons
    for (const personId of toAdd) {
      const rawPerson = getPerson(personId);
      if (!rawPerson) continue;
      // Use updated birthday if applicable
      const person: Person = isBirthday && birthdayMap[personId]
        ? { ...rawPerson, birthdayDate: birthdayMap[personId] }
        : rawPerson;

      if (isBirthday) {
        autoCreateBirthdayOccasions(person);
      } else {
        autoCreateHolidayOccasions(holiday, person);
      }
    }

    toast.success("People linked!");
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] flex flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Link {holiday.icon} {holiday.name} to people
          </DialogTitle>
          <DialogDescription>
            {isBirthday
              ? "Select people, then enter each person's birth date (MM-DD). Occasions are auto-created for the next 3 years."
              : "Selected people will have occasions auto-created for the next 3 years."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-4 px-4 space-y-1 max-h-72">
          {allPersons.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No people yet — add someone on the People page first.
            </p>
          ) : (
            allPersons.map((person) => {
              const isSelected = selectedIds.includes(person.id);
              return (
                <div
                  key={person.id}
                  onClick={() => toggle(person.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
                    isSelected ? "bg-primary/8 ring-1 ring-primary/30" : "hover:bg-accent"
                  )}
                >
                  {/* Selection indicator */}
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/40"
                    )}
                  >
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {person.emoji || person.name[0]}
                    </AvatarFallback>
                  </Avatar>

                  <span className="flex-1 font-medium text-sm">{person.name}</span>

                  {/* Birthday input — shown only for birthday holidays when selected */}
                  {isBirthday && isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 shrink-0"
                    >
                      <span className="text-xs text-muted-foreground">🎂</span>
                      <Input
                        value={birthdayMap[person.id] ?? ""}
                        onChange={(e) =>
                          setBirthdayMap((prev) => ({ ...prev, [person.id]: e.target.value }))
                        }
                        placeholder="MM-DD"
                        className="h-6 w-20 text-xs px-2 py-0"
                        maxLength={5}
                        pattern="\d{2}-\d{2}"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── HolidayCard ──────────────────────────────────────────────────────────────

function HolidayCard({
  holiday,
  occasionCount,
  linkedPersons,
  onEdit,
  onDelete,
  onLink,
}: {
  holiday: Holiday;
  occasionCount: number;
  linkedPersons: Person[];
  onEdit: () => void;
  onDelete: () => void;
  onLink: () => void;
}) {
  return (
    <Card className="flex flex-col">
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: holiday.color + "20", color: holiday.color }}
          >
            {holiday.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold leading-tight">{holiday.name}</div>
            {holiday.dateLogic && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatDateLogic(holiday.dateLogic)}
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {linkedPersons.length} {linkedPersons.length === 1 ? "person" : "people"}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {occasionCount} {occasionCount === 1 ? "occasion" : "occasions"}
          </span>
        </div>

        {/* Linked person avatars */}
        {linkedPersons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {linkedPersons.slice(0, 6).map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-1 text-xs bg-secondary rounded-full px-2 py-0.5"
              >
                <span>{p.emoji || "👤"}</span>
                <span className="text-secondary-foreground">{p.name}</span>
              </span>
            ))}
            {linkedPersons.length > 6 && (
              <span className="text-xs text-muted-foreground px-1 py-0.5">
                +{linkedPersons.length - 6} more
              </span>
            )}
          </div>
        )}

        {/* Link button */}
        <button
          onClick={onLink}
          className="mt-auto flex items-center gap-1.5 text-xs text-primary hover:underline font-medium pt-1 w-fit"
        >
          <Link2 className="w-3 h-3" />
          {linkedPersons.length === 0 ? "Link to people" : "Manage linked people"}
        </button>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [occasionCounts, setOccasionCounts] = useState<Record<string, number>>({});

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [deleting, setDeleting] = useState<Holiday | null>(null);
  const [linking, setLinking] = useState<Holiday | null>(null);

  function load() {
    const hs = getHolidays();
    const ps = getPersons();
    const occasions = getOccasions();

    setHolidays(hs);
    setPersons(ps);

    const counts: Record<string, number> = {};
    for (const h of hs) {
      counts[h.id] = occasions.filter((o) => o.holidayId === h.id).length;
    }
    setOccasionCounts(counts);
  }

  useEffect(() => { load(); }, []);

  function getLinkedPersons(holiday: Holiday): Person[] {
    return holiday.linkedPersonIds
      .map((id) => persons.find((p) => p.id === id))
      .filter(Boolean) as Person[];
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Holidays</h1>
          <p className="text-muted-foreground text-sm">
            Recurring events linked to the people you gift to
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add holiday
        </Button>
      </div>

      {/* Cards */}
      {holidays.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <div className="text-4xl">🎊</div>
            <div>
              <p className="font-medium">No holidays yet</p>
              <p className="text-sm text-muted-foreground">Add a holiday to start linking it to people</p>
            </div>
            <Button onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Add your first holiday
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {holidays.map((holiday) => (
            <HolidayCard
              key={holiday.id}
              holiday={holiday}
              occasionCount={occasionCounts[holiday.id] ?? 0}
              linkedPersons={getLinkedPersons(holiday)}
              onEdit={() => { setEditing(holiday); setShowForm(true); }}
              onDelete={() => setDeleting(holiday)}
              onLink={() => setLinking(holiday)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit form dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditing(null); }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add a holiday"}</DialogTitle>
          </DialogHeader>
          <HolidayForm
            initial={editing ?? undefined}
            onSave={() => { setShowForm(false); setEditing(null); load(); }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Link persons dialog */}
      {linking && (
        <LinkPersonsDialog
          holiday={linking}
          open={!!linking}
          onClose={() => setLinking(null)}
          onSaved={() => { setLinking(null); load(); }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{deleting?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This holiday will be permanently removed. Existing occasions linked to it will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) {
                  deleteHoliday(deleting.id);
                  toast.success(`${deleting.name} deleted`);
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
