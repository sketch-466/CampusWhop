"use client";

import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  profileSchema,
  type ProfileInput,
  CREATOR_TYPES,
  CREATOR_TYPE_LABELS,
  type CreatorType,
} from "@/lib/validations/profile";
import { updateProfile, uploadAvatar } from "@/lib/actions/profile";
import { ArrowLeft, Camera, X } from "lucide-react";

interface EditProfileFormProps {
  profile: {
    full_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    phone_number: string | null;
    whatsapp_number: string | null;
    twitter_url: string | null;
    linkedin_url: string | null;
    email: string;
    tagline: string | null;
    creator_type: string | null;
    skills: string[] | null;
    portfolio_url: string | null;
  };
}

export function EditProfileForm({ profile }: EditProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [skillInput, setSkillInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
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
      tagline: profile.tagline || "",
      creator_type: (profile.creator_type as CreatorType) || null,
      skills: profile.skills || [],
      portfolio_url: profile.portfolio_url || "",
    },
  });

  const bioValue = watch("bio");
  const taglineValue = watch("tagline");
  const skillsValue = watch("skills") || [];
  const currentBioCount = bioValue?.length || 0;
  const currentTaglineCount = taglineValue?.length || 0;

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (profile.email ?? "U")[0].toUpperCase();

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

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

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || skillsValue.includes(trimmed) || skillsValue.length >= 10) return;
    setValue("skills", [...skillsValue, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setValue("skills", skillsValue.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
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

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-8">

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <button type="button" onClick={handleAvatarClick} className="group relative">
            <Avatar className="h-24 w-24">
              {avatarPreview && <AvatarImage src={avatarPreview} alt="Avatar preview" />}
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
          <p className="mt-2 text-xs text-zinc-500">Click to change avatar (max 2MB)</p>
        </div>

        {/* ── BASIC INFO ── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Basic Info
          </h2>

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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span className={`text-xs ${currentBioCount > 160 ? "text-red-400" : "text-zinc-500"}`}>
                {currentBioCount}/160
              </span>
            </div>
            <Textarea
              id="bio"
              {...register("bio")}
              rows={3}
              className={errors.bio ? "border-red-500" : ""}
            />
            {errors.bio && <p className="text-xs text-red-400">{errors.bio.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input id="phone_number" {...register("phone_number")} placeholder="+234 801 234 5678" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
            <Input id="whatsapp_number" {...register("whatsapp_number")} placeholder="+234 801 234 5678" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter_url">Twitter URL</Label>
            <Input
              id="twitter_url"
              {...register("twitter_url")}
              placeholder="https://twitter.com/username"
              className={errors.twitter_url ? "border-red-500" : ""}
            />
            {errors.twitter_url && (
              <p className="text-xs text-red-400">{errors.twitter_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              {...register("linkedin_url")}
              placeholder="https://linkedin.com/in/username"
              className={errors.linkedin_url ? "border-red-500" : ""}
            />
            {errors.linkedin_url && (
              <p className="text-xs text-red-400">{errors.linkedin_url.message}</p>
            )}
          </div>
        </section>

        {/* ── CREATOR PROFILE ── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Creator Profile
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Help students discover you. Fill this in to appear on the Creators page.
            </p>
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tagline">Tagline</Label>
              <span className={`text-xs ${currentTaglineCount > 100 ? "text-red-400" : "text-zinc-500"}`}>
                {currentTaglineCount}/100
              </span>
            </div>
            <Input
              id="tagline"
              {...register("tagline")}
              placeholder="e.g. I design brands that stand out"
              className={errors.tagline ? "border-red-500" : ""}
            />
            {errors.tagline && (
              <p className="text-xs text-red-400">{errors.tagline.message}</p>
            )}
          </div>

          {/* Creator Type */}
          <div className="space-y-2">
            <Label>Creator Type</Label>
            <Controller
              name="creator_type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CREATOR_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        field.onChange(field.value === type ? null : type)
                      }
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        field.value === type
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
                      }`}
                    >
                      {CREATOR_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="e.g. Logo Design"
                className="flex-1"
                disabled={skillsValue.length >= 10}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addSkill}
                disabled={skillsValue.length >= 10 || !skillInput.trim()}
              >
                Add
              </Button>
            </div>
            {skillsValue.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {skillsValue.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1 rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 text-zinc-500 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-zinc-500">{skillsValue.length}/10 skills</p>
            {errors.skills && (
              <p className="text-xs text-red-400">{errors.skills.message}</p>
            )}
          </div>

          {/* Portfolio URL */}
          <div className="space-y-2">
            <Label htmlFor="portfolio_url">Portfolio URL</Label>
            <Input
              id="portfolio_url"
              {...register("portfolio_url")}
              placeholder="https://yourportfolio.com"
              className={errors.portfolio_url ? "border-red-500" : ""}
            />
            {errors.portfolio_url && (
              <p className="text-xs text-red-400">{errors.portfolio_url.message}</p>
            )}
          </div>
        </section>

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