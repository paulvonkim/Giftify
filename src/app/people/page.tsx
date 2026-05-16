"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Person } from "@/lib/types";
import { getPersons, getGiftsForPerson } from "@/lib/storage";
import { PersonForm } from "@/components/person-form";

function groupPersons(persons: Person[]): Record<string, Person[]> {
  const groups: Record<string, Person[]> = {};
  for (const p of persons) {
    const key = p.group || "Individual";
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return groups;
}

export default function PeoplePage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [giftCounts, setGiftCounts] = useState<Record<string, number>>({});

  function load() {
    const ps = getPersons();
    setPersons(ps);
    const counts: Record<string, number> = {};
    for (const p of ps) {
      counts[p.id] = getGiftsForPerson(p.id).length;
    }
    setGiftCounts(counts);
  }

  useEffect(() => { load(); }, []);

  const groups = groupPersons(persons);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">People</h1>
          <p className="text-muted-foreground text-sm">Everyone you gift to, organized by household</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add person
        </Button>
      </div>

      {persons.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <div>
              <p className="font-medium">No people yet</p>
              <p className="text-sm text-muted-foreground">Add someone to start tracking gifts</p>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add your first person
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([group, members]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{members.length}</span>
              </div>
              <div className="grid gap-2">
                {members.map((person) => (
                  <Link key={person.id} href={`/people/${person.id}`}>
                    <Card className="hover:shadow-sm transition-shadow cursor-pointer group">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {person.emoji || person.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium group-hover:text-primary transition-colors">{person.name}</div>
                          {person.birthdayDate && (
                            <div className="text-xs text-muted-foreground">🎂 {person.birthdayDate}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {giftCounts[person.id] > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {giftCounts[person.id]} gift{giftCounts[person.id] !== 1 ? "s" : ""}
                            </Badge>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a person</DialogTitle>
          </DialogHeader>
          <PersonForm
            onSave={() => { setShowForm(false); load(); }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
