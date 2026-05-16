"use client";

import { useState } from "react";
import { CalendarIcon, Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Person } from "@/lib/types";
import { savePerson, autoCreateBirthdayOccasions, getPersons } from "@/lib/storage";
import { toast } from "sonner";

function getExistingGroups(): string[] {
  const groups = new Set(
    getPersons()
      .filter((p) => p.group)
      .map((p) => p.group!)
  );
  return Array.from(groups).sort();
}

// "03-15" → "March 15"
function formatBirthday(mmdd: string): string {
  const [month, day] = mmdd.split("-").map(Number);
  return new Date(2000, month - 1, day).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
}

// "03-15" → Date (year is irrelevant, using 2000 as a leap year to cover Feb 29)
function birthdayToDate(mmdd: string): Date {
  const [month, day] = mmdd.split("-").map(Number);
  return new Date(2000, month - 1, day);
}

interface PersonFormProps {
  initial?: Partial<Person>;
  onSave: (person: Person) => void;
  onCancel: () => void;
}

export function PersonForm({ initial, onSave, onCancel }: PersonFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "");
  const [group, setGroup] = useState(initial?.group ?? "");
  const [birthdayDate, setBirthdayDate] = useState(initial?.birthdayDate ?? "");

  // Combobox state
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupInput, setGroupInput] = useState(initial?.group ?? "");
  // Computed once on mount — groups from existing persons
  const [existingGroups] = useState(() => getExistingGroups());

  // Calendar popover state
  const [calOpen, setCalOpen] = useState(false);

  const filteredGroups = existingGroups.filter((g) =>
    g.toLowerCase().includes(groupInput.toLowerCase())
  );
  const showCreate =
    groupInput.trim() !== "" &&
    !existingGroups.some(
      (g) => g.toLowerCase() === groupInput.trim().toLowerCase()
    );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const hasBirthdayChanged = birthdayDate !== (initial?.birthdayDate ?? "");

    const person = savePerson({
      id: initial?.id,
      name: name.trim(),
      emoji: emoji.trim() || undefined,
      group: group.trim() || undefined,
      birthdayDate: birthdayDate || undefined,
    });

    if (hasBirthdayChanged && person.birthdayDate) {
      autoCreateBirthdayOccasions(person);
    }

    toast.success(initial?.id ? "Person updated!" : "Person added!");
    onSave(person);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sarah"
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="emoji">Emoji</Label>
          <Input
            id="emoji"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="🙂"
            maxLength={2}
          />
        </div>

        {/* Household / Group combobox */}
        <div className="space-y-2">
          <Label>Household / Group</Label>
          <Popover open={groupOpen} onOpenChange={(o) => setGroupOpen(o)}>
            <PopoverTrigger
              className={cn(
                "flex h-8 w-full items-center justify-between rounded-lg border border-input bg-background px-2.5 text-sm transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
                !group && "text-muted-foreground"
              )}
            >
              <span className="truncate">{group || "e.g. Family"}</span>
              <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search or type new…"
                  value={groupInput}
                  onValueChange={(v) => setGroupInput(v)}
                />
                <CommandList>
                  {filteredGroups.length === 0 && !showCreate && (
                    <CommandEmpty>
                      {existingGroups.length === 0
                        ? "No groups yet — type to create one"
                        : "No matches"}
                    </CommandEmpty>
                  )}

                  {filteredGroups.length > 0 && (
                    <CommandGroup heading="Existing groups">
                      {filteredGroups.map((g) => (
                        <CommandItem
                          key={g}
                          value={g}
                          onSelect={() => {
                            setGroup(g);
                            setGroupInput(g);
                            setGroupOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              group === g ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {g}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {showCreate && (
                    <CommandGroup>
                      <CommandItem
                        value={`__create__${groupInput.trim()}`}
                        onSelect={() => {
                          const newGroup = groupInput.trim();
                          setGroup(newGroup);
                          setGroupInput(newGroup);
                          setGroupOpen(false);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4 shrink-0 text-primary" />
                        Create &ldquo;{groupInput.trim()}&rdquo;
                      </CommandItem>
                    </CommandGroup>
                  )}

                  {group && (
                    <CommandGroup>
                      <CommandItem
                        value="__clear__"
                        onSelect={() => {
                          setGroup("");
                          setGroupInput("");
                          setGroupOpen(false);
                        }}
                        className="text-muted-foreground"
                      >
                        Clear group
                      </CommandItem>
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Birthday date picker */}
      <div className="space-y-2">
        <Label>Birthday</Label>
        <Popover open={calOpen} onOpenChange={(o) => setCalOpen(o)}>
          <PopoverTrigger
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-sm text-left transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
              !birthdayDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>{birthdayDate ? formatBirthday(birthdayDate) : "Pick a date"}</span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={birthdayDate ? birthdayToDate(birthdayDate) : undefined}
              defaultMonth={birthdayDate ? birthdayToDate(birthdayDate) : undefined}
              onSelect={(date) => {
                if (date) {
                  const mm = String(date.getMonth() + 1).padStart(2, "0");
                  const dd = String(date.getDate()).padStart(2, "0");
                  setBirthdayDate(`${mm}-${dd}`);
                } else {
                  setBirthdayDate("");
                }
                setCalOpen(false);
              }}
            />
            {birthdayDate && (
              <div className="border-t px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setBirthdayDate("");
                    setCalOpen(false);
                  }}
                  className="w-full py-1 text-xs text-muted-foreground transition-colors hover:text-destructive text-center"
                >
                  Clear birthday
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Adding a birthday auto-creates occasions for the next 3 years.
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {initial?.id ? "Save changes" : "Add person"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
