"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listingSchema, type ListingInput } from "@/lib/validations/listing";
import { createListing, uploadListingImage } from "@/lib/actions/listings";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Upload, X } from "lucide-react";

const categories = [
  { value: "phones", label: "Phones" },
  { value: "laptops", label: "Laptops" },
  { value: "books", label: "Books" },
  { value: "gadgets", label: "Gadgets" },
  { value: "services", label: "Services" },
  { value: "notes", label: "Notes" },
  { value: "templates", label: "Templates" },
  { value: "ebooks", label: "Ebooks" },
  { value: "designs", label: "Designs" },
  { value: "other", label: "Other" },
];

const steps = ["Basic Info", "Pricing", "Images", "Review"];

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [hasSubaccount, setHasSubaccount] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
  });

  const watched = watch();

  useEffect(() => {
    async function checkSubaccount() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      const { data } = await supabase
        .from("paystack_subaccounts")
        .select("id")
        .eq("user_id", user.id)
        .single()
      setHasSubaccount(!!data)
    }
    checkSubaccount()
  }, [router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (images.length + files.length > 4) {
      setError("Maximum 4 images allowed");
      return;
    }
    setUploading(true);
    setError(undefined);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("image", file);
     const result = await uploadListingImage(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        setImages((prev) => [...prev, result.url]);
      }
    }
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const nextStep = async () => {
    const fieldsToValidate: (keyof ListingInput)[][] = [
      ["title", "description", "category", "product_type"],
      ["price", "delivery_note"],
      [],
      [],
    ];
    const isValid = await trigger(fieldsToValidate[step]);
    if (isValid) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const onSubmit = async (data: ListingInput) => {
    if (images.length === 0) {
      setError("Please upload at least one image");
      return;
    }
    setIsSubmitting(true);
    setError(undefined);
    const result = await createListing(data, images);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setIsSubmitting(false);
  };

  // Loading state while checking subaccount
  if (hasSubaccount === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  // No subaccount — block listing creation
  if (hasSubaccount === false) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="rounded-xl border border-amber-800 bg-amber-900/20 p-8">
          <h2 className="text-xl font-bold text-amber-400">
            Set Up Payout Account First
          </h2>
          <p className="mt-2 text-sm text-amber-300/80">
            You need to add your bank account before you can create listings.
            This ensures you can receive payments from buyers.
          </p>
          <Link href="/seller/setup">
            <Button className="mt-6 bg-amber-500 hover:bg-amber-600 text-white">
              Set Up Payout Account
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 p-8">
          <h2 className="text-xl font-bold text-emerald-400">
            Listing Submitted!
          </h2>
          <p className="mt-2 text-sm text-emerald-300">
            Your listing is pending review. We'll notify you once it's approved.
          </p>
          <Button
            onClick={() => router.push("/marketplace/my-listings")}
            className="mt-6 bg-emerald-500 hover:bg-emerald-600"
          >
            View My Listings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/marketplace"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      <h1 className="text-2xl font-bold text-white">Sell Something</h1>

      {/* Progress */}
      <div className="mt-4 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i <= step ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm ${i <= step ? "text-white" : "text-zinc-500"}`}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className={`mx-2 h-px w-8 ${i < step ? "bg-emerald-500" : "bg-zinc-800"}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {step === 0 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="e.g., iPhone 13 Pro Max 256GB"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-xs text-red-400">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={4}
                placeholder="Describe your item in detail..."
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-xs text-red-400">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  {...register("category")}
                  className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  {...register("product_type")}
                  className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                >
                  <option value="physical">Physical</option>
                  <option value="digital">Digital</option>
                </select>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₦)</Label>
              <Input
                id="price"
                type="number"
                {...register("price", { valueAsNumber: true })}
                placeholder="5000"
                className={errors.price ? "border-red-500" : ""}
              />
              {errors.price && (
                <p className="text-xs text-red-400">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_note">Delivery Note</Label>
              <Textarea
                id="delivery_note"
                {...register("delivery_note")}
                rows={2}
                placeholder="How will you deliver this item? e.g., Pickup at hostel, delivery on campus..."
              />
            </div>
          </>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Label>Images ({images.length}/4)</Label>
            <div className="grid grid-cols-2 gap-3">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden"
                >
                  <img
                    src={img}
                    alt={`Upload ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 transition-colors hover:border-zinc-500">
                  <Upload className="h-8 w-8 text-zinc-500" />
                  <span className="mt-2 text-xs text-zinc-500">
                    {uploading ? "Uploading..." : "Click to upload"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            {images.length === 0 && (
              <p className="text-xs text-zinc-500">
                Upload at least one image of your item
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <h3 className="font-medium text-white">Review Your Listing</h3>
            <div className="space-y-2 text-sm">
              <p className="text-zinc-400">
                <span className="text-zinc-300">Title:</span> {watched.title}
              </p>
              <p className="text-zinc-400">
                <span className="text-zinc-300">Price:</span> ₦{watched.price?.toLocaleString()}
              </p>
              <p className="text-zinc-400">
                <span className="text-zinc-300">Category:</span>{" "}
                {categories.find((c) => c.value === watched.category)?.label}
              </p>
              <p className="text-zinc-400">
                <span className="text-zinc-300">Type:</span> {watched.product_type}
              </p>
              <p className="text-zinc-400">
                <span className="text-zinc-300">Images:</span> {images.length} uploaded
              </p>
            </div>
            <p className="text-xs text-zinc-500">
              Your listing will be reviewed before going live.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isSubmitting ? "Submitting..." : "Submit Listing"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}