"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Gift,
  CalendarDays,
  Plus,
  Sparkles,
  Star,
  Package,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  getPerson,
  getGiftsForPerson,
  getOccasionsForPerson,
  getUngiftedProductsForPerson,
  deletePerson,
  getOccasion,
  getProduct,
} from "@/lib/storage";
import { Person, Gift as GiftType, Occasion, Product } from "@/lib/types";
import { PersonForm } from "@/components/person-form";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  idea: "bg-sky-100 text-sky-700",
  purchased: "bg-amber-100 text-amber-700",
  given: "bg-emerald-100 text-emerald-700",
};

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [person, setPerson] = useState<Person | null>(null);
  const [gifts, setGifts] = useState<GiftType[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [ungiftedProducts, setUngiftedProducts] = useState<Product[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [occasionMap, setOccasionMap] = useState<Record<string, Occasion>>({});
  const [productMap, setProductMap] = useState<Record<string, Product>>({});

  function load() {
    const p = getPerson(id);
    if (!p) return;
    setPerson(p);
    const gs = getGiftsForPerson(id);
    setGifts(gs);
    setOccasions(getOccasionsForPerson(id));
    setUngiftedProducts(getUngiftedProductsForPerson(id));

    const oMap: Record<string, Occasion> = {};
    const pMap: Record<string, Product> = {};
    for (const g of gs) {
      if (g.occasionId && !oMap[g.occasionId]) {
        const o = getOccasion(g.occasionId);
        if (o) oMap[g.occasionId] = o;
      }
      if (g.productId && !pMap[g.productId]) {
        const pr = getProduct(g.productId);
        if (pr) pMap[g.productId] = pr;
      }
    }
    setOccasionMap(oMap);
    setProductMap(pMap);
  }

  useEffect(() => { load(); }, [id]);

  function handleDelete() {
    deletePerson(id);
    toast.success("Person deleted");
    router.push("/people");
  }

  if (!person) return <div className="text-muted-foreground py-12 text-center">Person not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/people" className={buttonVariants({ variant: "ghost", size: "icon" }) + " shrink-0 mt-0.5"}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {person.emoji || person.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{person.name}</h1>
              <div className="flex flex-wrap gap-2 mt-1">
                {person.group && <Badge variant="secondary">{person.group}</Badge>}
                {person.birthdayDate && <Badge variant="outline">🎂 {person.birthdayDate}</Badge>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="icon" onClick={() => setShowEdit(true)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setShowDelete(true)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      {ungiftedProducts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Gift ideas from your library</span>
            </div>
            <p className="text-xs text-amber-700 mb-3">
              You haven&apos;t gifted {person.name} these products yet:
            </p>
            <div className="flex flex-wrap gap-2">
              {ungiftedProducts.slice(0, 5).map((p) => (
                <Link key={p.id} href={`/products`}>
                  <Badge variant="outline" className="bg-white border-amber-200 text-amber-800 cursor-pointer hover:bg-amber-100">
                    <Package className="w-3 h-3 mr-1" />{p.name}
                  </Badge>
                </Link>
              ))}
              {ungiftedProducts.length > 5 && (
                <Badge variant="outline" className="bg-white border-amber-200 text-amber-700">
                  +{ungiftedProducts.length - 5} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                Gift History
              </CardTitle>
              <Link href={`/gifts?person=${person.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                <Plus className="w-3 h-3 mr-1" /> Log gift
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {gifts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No gifts yet</p>
            ) : (
              gifts.map((gift) => (
                <div key={gift.id} className="flex items-start gap-2 py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{gift.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[gift.status]}`}>
                        {gift.status}
                      </span>
                      {occasionMap[gift.occasionId] && (
                        <span className="text-xs text-muted-foreground">
                          • {occasionMap[gift.occasionId].name}
                        </span>
                      )}
                    </div>
                    {productMap[gift.productId!] && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        📦 {productMap[gift.productId!].name}
                      </div>
                    )}
                  </div>
                  {gift.starRating && (
                    <div className="flex shrink-0">
                      {Array.from({ length: gift.starRating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Occasions
              </CardTitle>
              <Link href={`/occasions?person=${person.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {occasions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No occasions yet</p>
            ) : (
              occasions
                .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
                .map((occasion) => (
                  <Link key={occasion.id} href={`/occasions?id=${occasion.id}`}>
                    <div className="flex items-center gap-2 py-2 border-b last:border-0 hover:bg-accent -mx-2 px-2 rounded cursor-pointer">
                      <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{occasion.name}</div>
                        {occasion.date && (
                          <div className="text-xs text-muted-foreground">{occasion.date}</div>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {occasion.giftIds.length} gift{occasion.giftIds.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </Link>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {person.name}</DialogTitle>
          </DialogHeader>
          <PersonForm
            initial={person}
            onSave={() => { setShowEdit(false); load(); }}
            onCancel={() => setShowEdit(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {person.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {person.name} from Giftify. Their gift history will remain but won&apos;t be linked to this person.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
