"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function NewPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use e.currentTarget to ensure correct TypeScript typing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files && e.currentTarget.files[0]) {
      setFile(e.currentTarget.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and content for your post.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);

    // Use window.FormData to resolve type conflicts
    const formData = new window.FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("tags", tags);
    if (file) {
      formData.append("files", file);
    }

    try {
      await apiClient.createPost(formData);
      toast({
        title: "Success!",
        description: "Your post has been published.",
      });
      router.push("/dashboard/community");
      router.refresh(); 
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Post Creation Failed",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Post</CardTitle>
          <CardDescription>Share your thoughts, questions, or insights with the community.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                placeholder="Enter a descriptive title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.currentTarget.value)}
                placeholder="Write your post here..."
                rows={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.currentTarget.value)}
                placeholder="e.g., irrigation, pest-control, rice"
              />
              <p className="text-xs text-muted-foreground">Separate tags with a comma.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Image (optional)</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/gif"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Publishing..." : "Publish Post"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}