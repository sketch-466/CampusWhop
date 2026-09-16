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
import {
  createListing,
  uploadListingImage,
  uploadDigitalFile,
} from "@/lib/actions/listings";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Upload, X, FileText } from "lucide-react";

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
  const [digitalFileUrl, setDigitalFileUrl] = useState<string>("");
  const [digitalFileName, setDigitalFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [hasSubaccount, setHasSubaccount] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      payment_type: "escrow",
    },
  });

  const watched = watch();
  const isDigital = watched.product_type === "digital";

  useEffect(() => {
    if (!isDigital) {
      setValue("payment_type", "escrow");
    }
  }, [isDigital, setValue]);

  useEffect(() => {
    async function checkSubaccount() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("paystack_subaccounts")
        .select("id")
        .eq("user_id", user.id)
        .single();
      setHasSubaccount(!!data);
    }
    checkSubaccount();
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (images.length + files.length > 4) {
      setError("Maximum 4 images allowed");
      return;
    }

    setUploading(true);
    setError(undefined);
    setUploadProgress(0);

    const totalFiles = files.length;
    let completed = 0;

    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        setError(`${file.name} is too large. Maximum size is 20MB.`);
        setUploading(false);
        setUploadProgress(0);
        return;
      }
      // Guard against files that can't be read (cloud/content URI issues)
try {
  const testRead = await file.slice(0, 1).arrayBuffer();
  if (testRead.byteLength === 0 && file.size > 0) {
    setError("Couldn't read this image. Please try saving it to your device first, then upload.");
    setUploading(false);
    setUploadProgress(0);
    return;
  }
} catch {
  setError("Couldn't read this image. Please try saving it to your device first, then upload.");
  setUploading(false);
  setUploadProgress(0);
  return;
}

      setUploadProgress(Math.round((completed / totalFiles) * 90));

      const formData = new FormData();
      formData.append("image", file);
      const result = await uploadListingImage(formData);

      if (result.error) {
        setError(result.error);
        setUploading(false);
        setUploadProgress(0);
        return;
      } else if (result.url) {
        setImages((prev) => [...prev, result.url]);
        completed++;
        setUploadProgress(Math.round((completed / totalFiles) * 100));
      }
    }

    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
    }, 600);
  };

  const handleDigitalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    setError(undefined);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadDigitalFile(formData);
    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      setDigitalFileUrl(result.url);
      setDigitalFileName(file.name);
    }
    setUploadingFile(false);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const nextStep = async () => {
    const fieldsToValidate: (keyof ListingInput)[][] = [
      ["title", "description", "category", "product_type", "payment_type"],
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
    if (isDigital && !digitalFileUrl) {
      setError("Please upload your digital file");
      return;
    }
    setIsSubmitting(true);
    setError(undefined);
    const result = await createListing(
      data,
      images,
      isDigital ? digitalFileUrl : undefined
    );
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setIsSubmitting(false);
  };

  if (hasSubaccount === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

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
    );
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

      {/* Step progress */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="text-emerald-400 font-medium">
            Step {step + 1} of {steps.length} — {steps[step]}
          </span>
          <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-emerald-500" : "bg-zinc-800"
              }`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">

        {/* Step 1: Basic Info */}
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

            <div className="space-y-3">
              <Label>Payment Method</Label>
              {!isDigital && (
                <div className="rounded-xl border border-emerald-500 bg-emerald-500/10 p-4">
                  <input type="hidden" {...register("payment_type")} value="escrow" />
                  <p className="text-sm font-semibold text-white">🔒 Escrow (Required for Physical)</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Buyer pays into escrow. You accept the order, source the item, and deliver it. Funds are released to you once the buyer confirms receipt.
                  </p>
                </div>
              )}
              {isDigital && (
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer rounded-xl border p-3 transition-colors ${watched.payment_type === "escrow" ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-700 bg-zinc-900/50"}`}>
                    <input type="radio" value="escrow" {...register("payment_type")} className="sr-only" />
                    <p className="text-sm font-semibold text-white">🔒 Escrow</p>
                    <p className="text-xs text-zinc-400 mt-1">Payment held and released automatically after file is delivered.</p>
                  </label>
                  <label className={`cursor-pointer rounded-xl border p-3 transition-colors ${watched.payment_type === "direct" ? "border-amber-500 bg-amber-500/10" : "border-zinc-700 bg-zinc-900/50"}`}>
                    <input type="radio" value="direct" {...register("payment_type")} className="sr-only" />
                    <p className="text-sm font-semibold text-white">⚡ Direct Pay</p>
                    <p className="text-xs text-zinc-400 mt-1">Payment sent directly to you on purchase. Best for instant digital downloads.</p>
                  </label>
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 2: Pricing */}
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
              <Label htmlFor="delivery_note">
                {isDigital ? "Delivery Note (Optional)" : "Delivery Note"}
              </Label>
              <Textarea
                id="delivery_note"
                {...register("delivery_note")}
                rows={2}
                placeholder={
                  isDigital
                    ? "e.g., You'll receive the file instantly after payment"
                    : "How will you deliver this item? e.g., Pickup at hostel, delivery on campus..."
                }
              />
            </div>

            {isDigital && (
              <div className="space-y-3">
                <Label>Digital File</Label>
                <p className="text-xs text-zinc-500">
                  Upload the file buyers will receive. Max 100MB. Supports PDF, ZIP, MP4, PNG, JPG, DOCX, and more.
                </p>
                {digitalFileUrl ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <FileText className="h-8 w-8 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-400 truncate">{digitalFileName}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">File uploaded successfully</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setDigitalFileUrl(""); setDigitalFileName(""); }}
                      className="flex-shrink-0 rounded-full bg-zinc-700 p-1 text-zinc-400 hover:bg-zinc-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-8 transition-colors hover:border-zinc-500">
                    <Upload className="h-8 w-8 text-zinc-500" />
                    <span className="mt-2 text-sm text-zinc-400">
                      {uploadingFile ? "Uploading..." : "Click to upload file"}
                    </span>
                    <span className="mt-1 text-xs text-zinc-600">PDF, ZIP, MP4, PNG, DOCX, and more</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleDigitalFileUpload}
                      disabled={uploadingFile}
                    />
                  </label>
                )}
              </div>
            )}
          </>
        )}

        {/* Step 3: Images */}
        {step === 2 && (
          <div className="space-y-4">
            <Label>
              {isDigital ? "Product Preview Images (cover image, screenshots)" : "Images"}{" "}
              ({images.length}/4)
            </Label>
            {isDigital && (
              <p className="text-xs text-zinc-500">
                Upload a cover image or screenshots of your product. This is what buyers see before purchasing.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
                  <img src={img} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
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
                <label className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                  uploading
                    ? "border-emerald-500/50 bg-emerald-500/5 cursor-not-allowed"
                    : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-500"
                }`}>
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3 px-4 w-full">
                      <svg className="animate-spin h-7 w-7 text-emerald-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <div className="w-full space-y-1">
                        <div className="flex justify-between text-xs text-zinc-400">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-zinc-500" />
                      <span className="mt-2 text-xs text-zinc-500">Click to upload</span>
                      <span className="mt-1 text-xs text-zinc-600">JPG, PNG, WEBP · Max 20MB</span>
                    </>
                  )}
                  <input
  type="file"
  accept="image/*"
  multiple
  capture={undefined}
  className="hidden"
  onChange={handleImageUpload}
  disabled={uploading}
/>
                </label>
              )}
            </div>
            {images.length === 0 && !uploading && (
              <p className="text-xs text-zinc-500">Upload at least one image</p>
            )}
          </div>
        )}

        {/* Step 4: Review */}
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
                <span className="text-zinc-300">Payment:</span>{" "}
                {watched.payment_type === "escrow" ? "🔒 Escrow" : "⚡ Direct Pay"}
              </p>
              <p className="text-zinc-400">
                <span className="text-zinc-300">Images:</span> {images.length} uploaded
              </p>
              {isDigital && (
                <p className="text-zinc-400">
                  <span className="text-zinc-300">Digital File:</span>{" "}
                  {digitalFileName ? (
                    <span className="text-emerald-400">✓ {digitalFileName}</span>
                  ) : (
                    <span className="text-red-400">Not uploaded</span>
                  )}
                </p>
              )}
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