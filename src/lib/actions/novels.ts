"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { uploadToB2, generateFileName } from "@/lib/storage/b2";

export async function createNovel(data: {
  title: string;
  description: string;
  genre: string;
  monetization: "free" | "freemium";
  free_chapters_count: number;
  coins_per_chapter: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: novel, error } = await supabase
    .from("novels")
    .insert({
      author_id: user.id,
      title: data.title,
      description: data.description,
      genre: data.genre,
      monetization: data.monetization,
      free_chapters_count: data.free_chapters_count,
      coins_per_chapter: data.coins_per_chapter,
      is_published: true,
    })
    .select()
    .single();

  if (error) return { error: "Failed to create novel" };

  revalidatePath("/novels");
  return { success: true, novelId: novel.id };
}

export async function uploadNovelCover(formData: FormData) {
  const file = formData.get("cover") as File;
  if (!file) return { error: "No file provided" };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Only JPG, PNG, and WEBP images are allowed" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "File must be less than 5MB" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = `${user.id}-${generateFileName(file.name)}`;

  try {
    const url = await uploadToB2(buffer, fileName, "listings", file.type);
    return { success: true, url };
  } catch {
    return { error: "Failed to upload cover" };
  }
}

export async function updateNovelCover(novelId: string, coverUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("novels")
    .update({ cover_image_url: coverUrl })
    .eq("id", novelId)
    .eq("author_id", user.id);

  if (error) return { error: "Failed to update cover" };
  revalidatePath(`/novels/${novelId}`);
  return { success: true };
}

export async function createChapter(data: {
  novelId: string;
  title: string;
  content: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify novel ownership
  const { data: novel } = await supabase
    .from("novels")
    .select("id, author_id, free_chapters_count, monetization, total_chapters")
    .eq("id", data.novelId)
    .eq("author_id", user.id)
    .single();

  if (!novel) return { error: "Novel not found or not authorized" };

  const nextChapterNumber = (novel.total_chapters ?? 0) + 1;
  const isFree =
    novel.monetization === "free" ||
    nextChapterNumber <= novel.free_chapters_count;

  const wordCount = data.content.trim().split(/\s+/).length;

  const { data: chapter, error } = await supabase
    .from("novel_chapters")
    .insert({
      novel_id: data.novelId,
      author_id: user.id,
      chapter_number: nextChapterNumber,
      title: data.title,
      content: data.content,
      word_count: wordCount,
      is_free: isFree,
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return { error: "Failed to create chapter" };

  // Update novel chapter count
  await supabase
    .from("novels")
    .update({
      total_chapters: nextChapterNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.novelId);

  revalidatePath(`/novels/${data.novelId}`);
  return { success: true, chapterId: chapter.id, chapterNumber: nextChapterNumber };
}

export async function getNovels(filters?: {
  genre?: string;
  search?: string;
  authorId?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("novels")
    .select(`
      id, title, description, genre, cover_image_url, status,
      monetization, total_chapters, total_reads, is_featured,
      created_at, updated_at,
      author:profiles!novels_author_id_fkey(id, full_name, avatar_url)
    `)
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("total_reads", { ascending: false });

  if (filters?.genre) query = query.eq("genre", filters.genre);
  if (filters?.authorId) query = query.eq("author_id", filters.authorId);
  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) return { error: "Failed to fetch novels", novels: [] };
  return { novels: data ?? [] };
}

export async function getNovelById(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: novel, error } = await supabase
    .from("novels")
    .select(`
      *,
      author:profiles!novels_author_id_fkey(id, full_name, avatar_url, bio, tagline)
    `)
    .eq("id", id)
    .single();

  if (error || !novel) return { error: "Novel not found" };

  const { data: chapters } = await supabase
    .from("novel_chapters")
    .select("id, chapter_number, title, word_count, is_free, reads_count, published_at")
    .eq("novel_id", id)
    .eq("is_published", true)
    .order("chapter_number", { ascending: true });

  // Check if user follows this author
  let isFollowing = false;
  let isBookmarked = false;
  if (user) {
    const { data: follow } = await supabase
      .from("novel_follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("author_id", novel.author_id)
      .single();
    isFollowing = !!follow;

    const { data: bookmark } = await supabase
      .from("novel_bookmarks")
      .select("id, last_chapter_read")
      .eq("user_id", user.id)
      .eq("novel_id", id)
      .single();
    isBookmarked = !!bookmark;
  }

  return {
    novel,
    chapters: chapters ?? [],
    isFollowing,
    isBookmarked,
    currentUserId: user?.id,
  };
}

export async function getChapter(novelId: string, chapterNumber: number) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: novel } = await supabase
    .from("novels")
    .select("id, author_id, monetization, free_chapters_count, coins_per_chapter, title")
    .eq("id", novelId)
    .single();

  if (!novel) return { error: "Novel not found" };

  const { data: chapter } = await supabase
    .from("novel_chapters")
    .select("*")
    .eq("novel_id", novelId)
    .eq("chapter_number", chapterNumber)
    .eq("is_published", true)
    .single();

  if (!chapter) return { error: "Chapter not found" };

  // Check access
  const isAuthor = user?.id === novel.author_id;
  const isFreeChapter = chapter.is_free;
  let hasAccess = isAuthor || isFreeChapter;
  let hasUnlocked = false;

  if (!hasAccess && user) {
    const { data: unlock } = await supabase
      .from("chapter_unlocks")
      .select("id")
      .eq("user_id", user.id)
      .eq("chapter_id", chapter.id)
      .single();
    hasUnlocked = !!unlock;
    hasAccess = hasUnlocked;
  }

  // Get prev/next chapters
  const { data: prevChapter } = await supabase
    .from("novel_chapters")
    .select("chapter_number, title")
    .eq("novel_id", novelId)
    .eq("chapter_number", chapterNumber - 1)
    .eq("is_published", true)
    .single();

  const { data: nextChapter } = await supabase
    .from("novel_chapters")
    .select("chapter_number, title")
    .eq("novel_id", novelId)
    .eq("chapter_number", chapterNumber + 1)
    .eq("is_published", true)
    .single();

  // Increment reads if has access
  if (hasAccess && user) {
    await adminClient
      .from("novel_chapters")
      .update({ reads_count: (chapter.reads_count ?? 0) + 1 })
      .eq("id", chapter.id);

    await adminClient
      .from("novels")
      .update({ total_reads: (novel as any).total_reads + 1 })
      .eq("id", novelId);

    // Update bookmark
    await adminClient
      .from("novel_bookmarks")
      .upsert({
        user_id: user.id,
        novel_id: novelId,
        last_chapter_read: chapterNumber,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,novel_id" });
  }

  // Get comments
  const { data: comments } = await supabase
    .from("novel_comments")
    .select(`
      id, content, created_at,
      user:profiles!novel_comments_user_id_fkey(id, full_name, avatar_url)
    `)
    .eq("chapter_id", chapter.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return {
    novel,
    chapter: hasAccess ? chapter : { ...chapter, content: null },
    hasAccess,
    hasUnlocked,
    isFreeChapter,
    isAuthor,
    prevChapter: prevChapter ?? null,
    nextChapter: nextChapter ?? null,
    comments: comments ?? [],
    currentUserId: user?.id,
    coinsRequired: novel.coins_per_chapter,
  };
}

export async function postComment(chapterId: string, novelId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 500) {
    return { error: "Comment must be between 1 and 500 characters" };
  }

  const { error } = await supabase
    .from("novel_comments")
    .insert({
      chapter_id: chapterId,
      novel_id: novelId,
      user_id: user.id,
      content: trimmed,
    });

  if (error) return { error: "Failed to post comment" };

  revalidatePath(`/novels`);
  return { success: true };
}

export async function toggleFollow(authorId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (user.id === authorId) return { error: "Cannot follow yourself" };

  const { data: existing } = await supabase
    .from("novel_follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("author_id", authorId)
    .single();

  if (existing) {
    await supabase
      .from("novel_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("author_id", authorId);
    return { success: true, following: false };
  } else {
    await supabase
      .from("novel_follows")
      .insert({ follower_id: user.id, author_id: authorId });
    return { success: true, following: true };
  }
}

export async function getMyNovels() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", novels: [] };

  const { data, error } = await supabase
    .from("novels")
    .select("id, title, genre, cover_image_url, status, total_chapters, total_reads, monetization, is_published, created_at")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: "Failed to fetch novels", novels: [] };
  return { novels: data ?? [] };
}

export async function getAuthorEarnings() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data } = await adminClient
    .from("author_coin_earnings")
    .select("coins_earned, naira_value, withdrawn, created_at")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const total = (data ?? []).reduce((sum, e) => sum + e.naira_value, 0);
  const withdrawn = (data ?? [])
    .filter((e) => e.withdrawn)
    .reduce((sum, e) => sum + e.naira_value, 0);
  const pending = total - withdrawn;

  return {
    earnings: data ?? [],
    totalEarned: total,
    totalWithdrawn: withdrawn,
    pendingPayout: pending,
  };
}