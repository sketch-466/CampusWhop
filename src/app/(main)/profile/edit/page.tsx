"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { updateProfile, uploadAvatar } from "@/lib/actions/profile";
import { ArrowLeft, Camera } from "lucide-react";

interface EditProfilePageProps {
  profile: {
    full_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    phone_number: string | null;
    whatsapp_number: string | null;
    twitter_url: string | null;
    linkedin_url: string | null;
    email: string;
  };
}

export default function EditProfilePage({ profile }: EditProfilePageProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [bioCount, setBioCount] = useState(profile.bio?.length || 0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      bio: profile.bio || "",
      phone_number: profile.phone_number || "",
      whatsapp_number: profile.whatsapp_number || "",
      twitter_url: profile.twitter_url || "",
      linkedin_url: profile.linkedin_url || "",
    },
  });

  const bioValue = watch("bio");
  const currentBioCount = bioValue?.length || 0;

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : profile.email[0].toUpperCase();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append("avatar", file);

    const result = await uploadAvatar(formData);
    if (result.error) {
      setError(result.error);
      setAvatarPreview(profile.avatar_url);
    } else if (result.url) {
      setAvatarPreview(result.url);
    }
  };

  const onSubmit = async (data: ProfileInput) => {
    setIsLoading(true);
    setError(undefined);

    const result = await updateProfile(data);

    if (result.error) {
      setError(result.error);
    } else {
      router.push("/profile");
      router.refresh();
    }

    setIsLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/profile"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </Link>

      <h1 className="text-2xl font-bold text-white">Edit Profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={handleAvatarClick}
            className="group relative"
          >
            <Avatar className="h-24 w-24">
              {avatarPreview && (
                <AvatarImage src={avatarPreview} alt="Avatar preview" />
              )}
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="mt-2 text-xs text-zinc-500">
            Click to change avatar (max 2MB)
          </p>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            {...register("full_name")}
            className={errors.full_name ? "border-red-500" : ""}
          />
          {errors.full_name && (
            <p className="text-xs text-red-400">{errors.full_name.message}</p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio">Bio</Label>
            <span
              className={`text-xs ${
                currentBioCount > 160 ? "text-red-400" : "text-zinc-500"
              }`}
            >
              {currentBioCount}/160
            </span>
          </div>
          <Textarea
            id="bio"
            {...register("bio")}
            rows={3}
            className={errors.bio ? "border-red-500" : ""}
          />
          {errors.bio && (
            <p className="text-xs text-red-400">{errors.bio.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input
            id="phone_number"
            {...register("phone_number")}
            placeholder="+234 801 234 5678"
          />
        </div>

        {/* WhatsApp */}
        <div className="space-y-2">
          <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
          <Input
            id="whatsapp_number"
            {...register("whatsapp_number")}
            placeholder="+234 801 234 5678"
          />
        </div>

        {/* Twitter */}
        <div className="space-y-2">
          <Label htmlFor="twitter_url">Twitter URL</Label>
          <Input
            id="twitter_url"
            {...register("twitter_url")}
            placeholder="https://twitter.com/username"
            className={errors.twitter_url ? "border-red-500" : ""}
          />
          {errors.twitter_url && (
            <p className="text-xs text-red-400">
              {errors.twitter_url.message}
            </p>
          )}
        </div>

        {/* LinkedIn */}
        <div className="space-y-2">
          <Label htmlFor="linkedin_url">LinkedIn URL</Label>
          <Input
            id="linkedin_url"
            {...register("linkedin_url")}
            placeholder="https://linkedin.com/in/username"
            className={errors.linkedin_url ? "border-red-500" : ""}
          />
          {errors.linkedin_url && (
            <p className="text-xs text-red-400">
              {errors.linkedin_url.message}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          <Link href="/profile">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
