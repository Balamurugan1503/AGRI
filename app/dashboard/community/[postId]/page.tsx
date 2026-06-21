// app/dashboard/community/[postId]/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiClient, PostWithComments, Comment } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export default function PostDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const { profile } = useAuth(); // Get user profile for adding comments
  const postId = params.postId as string;

  const [postData, setPostData] = useState<PostWithComments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      try {
        const data = await apiClient.getPostById(postId);
        setPostData(data);
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.addComment(postId, { content: newComment });
      
      // Optimistically update the UI with the new comment
      const commentToAdd: Comment = {
          commentId: new Date().toISOString(), // Temporary ID
          content: newComment,
          authorName: profile?.name || "You",
          authorId: "", // Not needed for optimistic update
          createdAt: { _seconds: Date.now() / 1000, _nanoseconds: 0 }
      };
      setPostData(prev => prev ? { ...prev, comments: [...prev.comments, commentToAdd] } : null);

      setNewComment("");
      toast({ title: "Success", description: "Your comment has been posted." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getParsedDate = (createdAt: any) => {
    if (!createdAt) return new Date();
    if (typeof createdAt === "string") return new Date(createdAt);
    if (typeof createdAt === "number") return new Date(createdAt < 10000000000 ? createdAt * 1000 : createdAt);
    if (typeof createdAt === "object") {
      if (typeof createdAt._seconds === "number") return new Date(createdAt._seconds * 1000);
      if (typeof createdAt.seconds === "number") return new Date(createdAt.seconds * 1000);
    }
    return new Date();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!postData) {
    return <div className="text-center">Post not found.</div>;
  }

  const { post, comments } = postData;

  return (
    <div className="space-y-6">
      {/* Post Display */}
      <Card className="overflow-hidden">
        {post.imageUrls && post.imageUrls.length > 0 ? (
          <div className="relative w-full h-80 bg-slate-900 group/carousel">
            <Image 
              src={post.imageUrls[activeImageIndex]} 
              alt={post.title} 
              fill 
              className="object-cover transition-all duration-300" 
            />
            {post.imageUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(current => current === 0 ? post.imageUrls!.length - 1 : current - 1);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(current => current === post.imageUrls!.length - 1 ? 0 : current + 1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-full z-10">
                  {post.imageUrls.map((_, dotIdx) => (
                    <button 
                      type="button"
                      key={dotIdx}
                      onClick={() => setActiveImageIndex(dotIdx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${dotIdx === activeImageIndex ? "bg-white scale-125" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : post.imageUrl ? (
          <div className="relative w-full h-80">
            <Image src={post.imageUrl} alt={post.title} fill className="object-cover" />
          </div>
        ) : null}
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{post.title}</CardTitle>
          <CardDescription>
            Posted by {post.authorName} on {getParsedDate(post.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{post.content}</p>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Comments ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.commentId} className="p-4 border rounded-lg bg-muted/50">
              <p className="font-bold">{comment.authorName}</p>
              <p className="text-sm text-muted-foreground">
                {getParsedDate(comment.createdAt).toLocaleString()}
              </p>
              <p className="mt-2">{comment.content}</p>
            </div>
          ))}
          
          {/* Add a Comment Form */}
          <form onSubmit={handleCommentSubmit} className="pt-6 space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={4}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Comment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}