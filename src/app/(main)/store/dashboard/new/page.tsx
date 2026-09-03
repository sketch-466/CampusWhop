"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createStoreProduct, uploadStoreImage } from "@/lib/actions/store";
import { ArrowLeft, Upload, X, CheckCircle } from "lucide-react";

const DELIVERY_OPTIONS = [
  "Within 24 hours",
  "Within 48 hours",
  "3–5 days",
  "Within 1 week",
  "Custom timeline",
];

type ProductType = "physical" | "digital" | "service";

export default function NewStoreProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [productType, setProductType] = useState<ProductType>("physical");
  const [stockQuantity, setStockQuantity] = useState("");
  const [digitalFileUrl, setDigitalFileUrl] = useState("");
  const [deliveryTimeframe, setDeliveryTimeframe] = useState("");
  const [requirements, setRequirements] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

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
      const result = await uploadStoreImage(formData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError("Please upload at least one image");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("product_type", productType);
    formData.append("images", JSON.stringify(images));

    if (productType === "physical" && stockQuantity) {
      formData.append("stock_quantity", stockQuantity);
    }
    if (productType === "digital") {
      formData.append("digital_file_url", digitalFileUrl);
    }
    if (productType === "service") {
      formData.append("delivery_timeframe", deliveryTimeframe);
      formData.append("requirements", requirements);
    }

    const result = await createStoreProduct(formData);

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
          <h2 className="mt-4 text-xl font-bold text-emerald-400">Submitted!</h2>
          <p className="mt-2 text-sm text-emerald-300">
            Your {productType === "service" ? "service" : "product"} is pending review. We&apos;ll notify you once it&apos;s approved.
          </p>
          <Button onClick={() => router.push("/store/dashboard")} className="mt-6 bg-emerald-500 hover:bg-emerald-600">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/store/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-white">Add Product or Service</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Sell a physical item, digital file, or offer a service directly from your store.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">

        {/* Type selector — prominent, at the top */}
        <div className="space-y-2">
          <Label>What are you listing?</Label>
          <div className="grid grid-cols-3 gap-3">
            {(["physical", "digital", "service"] as ProductType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setProductType(type)}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                  productType === type
                    ? type === "service"
                      ? "border-blue-500 bg-blue-900/30 text-blue-400"
                      : "border-emerald-500 bg-emerald-900/30 text-emerald-400"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {type === "physical" && "📦 Physical"}
                {type === "digital" && "💾 Digital"}
                {type === "service" && "🛠️ Service"}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            {productType === "physical" && "A tangible item shipped or handed off to the buyer."}
            {productType === "digital" && "A downloadable file or link delivered after payment."}
            {productType === "service" && "A skill or task you perform for the buyer (e.g. typing, design, repairs)."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">
            {productType === "service" ? "Service Name" : "Product Name"}
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              productType === "service"
                ? "e.g. Laptop Repair, Assignment Typing, Logo Design"
                : "e.g. HP Laptop 2020, Economics Textbook"
            }
            required
            minLength={3}
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={
              productType === "service"
                ? "Describe what you do, your experience, and what the buyer can expect."
                : "Describe the item, its condition, and any relevant details."
            }
            required
            minLength={10}
            maxLength={2000}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (₦)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="1"
              placeholder="e.g. 5000"
            />
          </div>

          {productType === "physical" && (
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                min="0"
                placeholder="Leave empty for unlimited"
              />
            </div>
          )}

          {productType === "service" && (
            <div className="space-y-2">
              <Label htmlFor="delivery_timeframe">Delivery Time</Label>
              <select
                id="delivery_timeframe"
                value={deliveryTimeframe}
                onChange={(e) => setDeliveryTimeframe(e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
              >
                <option value="">Select timeframe</option>
                {DELIVERY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {productType === "digital" && (
          <div className="space-y-2">
            <Label htmlFor="digital_file">Digital File URL</Label>
            <Input
              id="digital_file"
              value={digitalFileUrl}
              onChange={(e) => setDigitalFileUrl(e.target.value)}
              placeholder="Link to downloadable file (B2, Google Drive, etc.)"
            />
          </div>
        )}

        {productType === "service" && (
          <div className="space-y-2">
            <Label htmlFor="requirements">
              What do you need from the buyer?{" "}
              <span className="text-zinc-500 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={3}
              placeholder="e.g. Send me the document you want typed. Provide your logo files in PNG format."
              maxLength={500}
            />
            <p className="text-xs text-zinc-500">
              This is shown to the buyer after they place an order so they know what to send you.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>
            {productType === "service" ? "Photos (show your work or setup)" : "Images"}{" "}
            ({images.length}/4)
          </Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 transition-colors">
                <Upload className="h-8 w-8 text-zinc-500" />
                <span className="mt-2 text-xs text-zinc-500 text-center px-1">
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
        </div>

        {error && (
          <p className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || uploading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
        >
          {isSubmitting ? "Submitting..." : `Add ${productType === "service" ? "Service" : "Product"}`}
        </Button>
      </form>
    </div>
  );
}