import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireCreator } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { creator, error: authError } = await requireCreator();

    if (authError || !creator) {
      return authError || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const videoFile = formData.get("video") as File;
    const thumbnailFile = formData.get("thumbnail") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const isGated = formData.get("isGated") === "true";

    if (!videoFile || !title) {
      return NextResponse.json({ error: "Video file and title are required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Upload Video to Supabase Storage
    const videoExt = videoFile.name.split(".").pop();
    const videoPath = `${creator.id}/${Date.now()}-video.${videoExt}`;
    
    const { data: videoData, error: videoUploadError } = await supabase.storage
      .from("videos")
      .upload(videoPath, videoFile);

    if (videoUploadError) throw videoUploadError;

    const { data: { publicUrl: videoUrl } } = supabase.storage
      .from("videos")
      .getPublicUrl(videoPath);

    // 2. Upload Thumbnail if exists
    let thumbnailUrl = null;
    if (thumbnailFile) {
      const thumbExt = thumbnailFile.name.split(".").pop();
      const thumbPath = `${creator.id}/${Date.now()}-thumb.${thumbExt}`;
      
      const { error: thumbUploadError } = await supabase.storage
        .from("thumbnails")
        .upload(thumbPath, thumbnailFile);

      if (!thumbUploadError) {
          thumbnailUrl = supabase.storage.from("thumbnails").getPublicUrl(thumbPath).data.publicUrl;
      }
    }

    // 3. Create Video record in DB
    const { data: videoRecord, error: dbError } = await supabase
      .from("videos")
      .insert({
        channel_id: creator.id,
        title,
        description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        is_gated: isGated,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ video: videoRecord });
  } catch (error: any) {
    console.error("Video upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload video" },
      { status: 500 }
    );
  }
}
