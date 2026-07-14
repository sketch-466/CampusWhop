"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createStore, updateStore, getMyStore, uploadStoreImage, checkSlugAvailability } from "@/lib/actions/store";
import { ArrowLeft, Upload, X, Loader2, CheckCircle } from "lucide-react";

export default function StoreSetupPage() {
  const router = useRouter();
  const [isEdit, setIsEdit] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [storeName, setStoreName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState<"banner" | "logo" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadStore() {
      const { store } = await getMyStore();
      if (store) {
        setIsEdit(true);
        setStoreId(store.id);
        setStoreName(store.store_name);
        setSlug(store.slug);
        setTagline(store.tagline || "");
        setDescription(store.description || "");
        setBannerUrl(store.banner_url || "");
        setLogoUrl(store.logo_url || "");
      }
    }
    loadStore();
  }, []);

  // Debounced slug availability check
  useEffect(() => {
    if (!slug || slug.length < 3 || isEdit) return;
    
    const timer = setTimeout(async () => {
      setSlugChecking(true);
      const result = await checkSlugAvailability(slug);
      setSlugAvailable(result.available);
      setSlugChecking(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [slug, isEdit]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "banner" | "logo") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    setError(undefined);

    const formData = new FormData();
    formData.append("image", file);
    const result = await uploadStoreImage(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      if (type === "banner") setBannerUrl(result.url);
      else setLogoUrl(result.url);
    }

    setUploading(null);
  };

  const removeImage = (type: "banner" | "logo") => {
    if (type === "banner") setBannerUrl("");
    else setLogoUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(undefined);

    const formData = new FormData();
    if (isEdit && storeId) formData.append("store_id", storeId);
    formData.append("store_name", storeName);
    formData.append("slug", slug);
    formData.append("tagline", tagline);
    formData.append("description", description);
    formData.append("banner_url", bannerUrl);
    formData.append("logo_url", logoUrl);

    const result = isEdit
      ? await updateStore(formData)
      : await createStore(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }

    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 p-8">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-xl font-bold text-emerald-400">
            {isEdit ? "Store Updated!" : "Store Created!"}
          </h2>
          <p className="mt-2 text-sm text-emerald-300">
            {isEdit
              ? "Your store changes have been saved."
              : "Your store is pending review. We'll notify you once it's approved."}
          </p>
          <Button
            onClick={() => router.push("/store/dashboard")}
            className="mt-6 bg-emerald-500 hover:bg-emerald-600"
          >
            Go to Store Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="text-2xl font-bold text-white">
        {isEdit ? "Edit Your Store" : "Create Your Store"}
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        {isEdit
          ? "Update your storefront details"
          : "Set up your branded storefront on CampusWhop"}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Store Name */}
        <div className="space-y-2">
          <Label htmlFor="store_name">Store Name</Label>
          <Input
            id="store_name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="e.g., TechHub Store"
            required
            minLength={2}
            maxLength={60}
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">Store URL (Slug)</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">campuswhop.com/store/</span>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                setSlugAvailable(null);
              }}
              placeholder="your-store"
              required
              minLength={3}
              maxLength={40}
              disabled={isEdit}
              className="flex-1"
            />
          </div>
          {slugChecking && (
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Checking availability...
            </p>
          )}
          {!isEdit && slugAvailable === true && (
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              This slug is available
            </p>
          )}
          {!isEdit && slugAvailable === false && (
            <p className="text-xs text-red-400">This slug is already taken</p>
          )}
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="A short description of your store"
            maxLength={120}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">About Your Store</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Tell customers what you sell and what makes your store special..."
            maxLength={2000}
          />
        </div>

        {/* Banner Upload */}
        <div className="space-y-2">
          <Label>Banner Image</Label>
          {bannerUrl ? (
            <div className="relative aspect-[3/1] rounded-lg border border-zinc-800 overflow-hidden">
              <img src={bannerUrl} alt="Store banner" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage("banner")}
                className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex aspect-[3/1] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 transition-colors hover:border-zinc-500">
              <Upload className="h-8 w-8 text-zinc-500" />
              <span className="mt-2 text-xs text-zinc-500">
                {uploading === "banner" ? "Uploading..." : "Upload banner"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleImageUpload(e, "banner")}
                disabled={uploading !== null}
              />
            </label>
          )}
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Logo</Label>
          {logoUrl ? (
            <div className="relative h-24 w-24 rounded-lg border border-zinc-800 overflow-hidden">
              <img src={logoUrl} alt="Store logo" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage("logo")}
                className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 transition-colors hover:border-zinc-500">
              <Upload className="h-6 w-6 text-zinc-500" />
              <span className="mt-1 text-xs text-zinc-500">Logo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleImageUpload(e, "logo")}
                disabled={uploading !== null}
              />
            </label>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting || (!isEdit && slugAvailable !== true)}
          className="w-full bg-emerald-500 hover:bg-emerald-600"
        >
          {isSubmitting ? "Saving..." : isEdit ? "Update Store" : "Create Store"}
        </Button>
      </form>
    </div>
  );
}
