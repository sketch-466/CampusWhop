"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Image, Tag, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PriceSuggestion } from "@/components/ai/price-suggestion";
import { createClient } from "@/lib/supabase/client";

interface SellFormProps {
  userId: string;
  courses: any[];
}

export function SellForm({ userId, courses }: SellFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("textbook");
  const [condition, setCondition] = useState<"new" | "like_new" | "good" | "fair" | "poor">("good");
  const [courseCode, setCourseCode] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const conditions = [
    { value: "new", label: "New", desc: "Never used, original packaging" },
    { value: "like_new", label: "Like New", desc: "Used once or twice, perfect" },
    { value: "good", label: "Good", desc: "Used but well maintained" },
    { value: "fair", label: "Fair", desc: "Visible wear, still works" },
    { value: "poor", label: "Poor", desc: "Heavy wear, functional" },
  ];

  const handleSubmit = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: product, error } = await supabase.from("products").insert({
      seller_id: userId,
      title,
      description,
      price: Number(price),
      category,
      condition,
      course_code: courseCode || null,
      image_urls: images,
      status: "active",
    }).select().single();

    if (!error) {
      // Award WhopCoins for listing
      await supabase.from("reputation_events").insert({
        user_id: userId,
        event_type: "listing_created",
        points: 25,
        metadata: { product_id: product.id },
      });

      router.push("/marketplace");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Images */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Photos</Label>
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted relative">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          <button className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 transition-colors bg-muted/30">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Add Photo</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Title</Label>
        <Input
          placeholder="e.g. CSC 101 Textbook - 3rd Edition"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-muted/50 border-border"
        />
      </div>

      {/* AI Price Suggestion */}
      <PriceSuggestion
        title={title}
        category={category}
        condition={condition}
        onSuggestionSelect={(suggested) => setPrice(suggested.toString())}
      />

      {/* Price & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Price (₦)</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="bg-muted/50 border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Category</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-sm"
          >
            <option value="textbook">Textbook</option>
            <option value="electronics">Electronics</option>
            <option value="furniture">Furniture</option>
            <option value="clothing">Clothing</option>
            <option value="laptop">Laptop</option>
            <option value="phone">Phone</option>
            <option value="calculator">Calculator</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Condition</Label>
        <div className="grid grid-cols-5 gap-2">
          {conditions.map((c) => (
            <button
              key={c.value}
              onClick={() => setCondition(c.value as any)}
              className={cn(
                "p-2 rounded-lg border text-center transition-all",
                condition === c.value
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-border bg-muted/30 text-muted-foreground hover:border-emerald-500/20"
              )}
            >
              <p className="text-xs font-medium">{c.label}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {conditions.find((c) => c.value === condition)?.desc}
        </p>
      </div>

      {/* Course Link */}
      {courses.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5" />
            Link to Course (Optional)
          </Label>
          <select
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-sm"
          >
            <option value="">No course link</option>
            {courses.map((course: any) => (
              <option key={course.id} value={course.code}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Course-linked items get priority visibility to students in that course
          </p>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          placeholder="Describe your item, include details like brand, year, flaws..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px] bg-muted/50 border-border resize-none"
        />
      </div>

      {/* Tags */}
      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">Pro Tips</span>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Add clear photos from multiple angles</li>
          <li>• Be honest about condition to avoid disputes</li>
          <li>• Course-linked items sell 40% faster</li>
          <li>• Use AI price suggestion for best results</li>
        </ul>
      </div>

      <Button
        className="w-full bg-emerald-600 hover:bg-emerald-500 h-12 text-base"
        disabled={!title || !price || loading}
        onClick={handleSubmit}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Listing...
          </>
        ) : (
          "List Item for Sale"
        )}
      </Button>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
