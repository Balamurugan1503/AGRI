"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient, CommunityPost } from "@/lib/api";
import { Loader2, MessageSquare, ArrowRight } from "lucide-react";

export function RecentPosts() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const { posts } = await apiClient.getPosts();
        setPosts(posts.slice(0, 3)); // Display the 3 most recent posts
      } catch (error) {
        console.error("Failed to fetch recent posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecentPosts();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Community Activity</CardTitle>
          <CardDescription>Latest discussions from the forum</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/community">
            View Forum <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <Link href={`/dashboard/community/${post.postId}`} key={post.postId} className="block hover:bg-muted/50 p-3 rounded-lg -m-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold truncate">{post.title}</p>
                      <p className="text-sm text-muted-foreground">
                        by {post.authorName}
                      </p>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground flex-shrink-0 ml-4">
                      <MessageSquare className="mr-1.5 h-3 w-3" />
                      {post.commentCount}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">
                No community posts yet.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}