// app/dashboard/community/page.tsx

"use client"

import React, { useState, useEffect, useRef } from "react"
import { apiClient, CommunityPost, Comment } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Camera, 
  Video, 
  Sprout, 
  MapPin, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Bell, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  TrendingUp, 
  Sparkles,
  Leaf,
  MessageSquare
} from "lucide-react"

// Helper to determine deterministic initial likes
const getInitialLikes = (postId: string) => {
  let hash = 0
  for (let i = 0; i < postId.length; i++) {
    hash = postId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash % 150) + 18
}

// Helper to compute time ago
const getTimeAgo = (createdAt: any, t: (key: string) => string) => {
  if (!createdAt) return ""
  let ms = 0
  if (typeof createdAt === "string") {
    ms = Date.parse(createdAt)
  } else if (typeof createdAt === "number") {
    if (createdAt < 10000000000) {
      ms = createdAt * 1000
    } else {
      ms = createdAt
    }
  } else if (typeof createdAt === "object") {
    if (typeof createdAt._seconds === "number") {
      ms = createdAt._seconds * 1000
    } else if (typeof createdAt.seconds === "number") {
      ms = createdAt.seconds * 1000
    } else if (createdAt instanceof Date) {
      ms = createdAt.getTime()
    } else if (typeof createdAt.toDate === "function") {
      ms = createdAt.toDate().getTime()
    }
  }

  if (!ms || isNaN(ms)) return ""

  const diffMs = Date.now() - ms
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return t("Just now")
  if (diffMinutes < 60) return `${diffMinutes}m ${t("ago")}`
  if (diffHours < 24) return `${diffHours}h ${t("ago")}`
  return `${diffDays}d ${t("ago")}`
}

export default function CommunityPage() {
  const { user, profile, t } = useAuth()
  const { toast } = useToast()
  
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Interactive UI states
  const [likesState, setLikesState] = useState<Record<string, { liked: boolean, count: number }>>({})
  const [savesState, setSavesState] = useState<Record<string, boolean>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({})
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({})
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({})
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({})
  
  const previewsRef = useRef<string[]>([])
  useEffect(() => {
    previewsRef.current = imagePreviews
  }, [imagePreviews])

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview)
        }
      })
    }
  }, [])
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null)

  // Create Post Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [caption, setCaption] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [selectedCrops, setSelectedCrops] = useState<string[]>([])
  const [postLocation, setPostLocation] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmittingPost, setIsSubmittingPost] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch posts on mount
  const fetchPosts = async () => {
    try {
      const data = await apiClient.getPosts()
      setPosts(data.posts)
      
      // Initialize likes state
      const initialLikes: Record<string, { liked: boolean, count: number }> = {}
      data.posts.forEach((post) => {
        const isLiked = post.likedBy ? post.likedBy.includes(user?.uid || "") : false
        const likesCount = typeof post.likesCount === "number" ? post.likesCount : (post.likedBy ? post.likedBy.length : getInitialLikes(post.postId))
        initialLikes[post.postId] = {
          liked: isLiked,
          count: likesCount
        }
      })
      setLikesState(initialLikes)
    } catch (error) {
      console.error("Failed to fetch posts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Handle uploader files selected
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    processFiles(Array.from(files))
  }

  const processFiles = (filesList: File[]) => {
    const validFiles = filesList.filter(file => file.type.startsWith("image/"))
    if (selectedImages.length + validFiles.length > 5) {
      toast({
        title: t("Limit reached"),
        description: t("You can upload a maximum of 5 images."),
        variant: "destructive"
      })
      return
    }

    const newImages = [...selectedImages, ...validFiles]
    setSelectedImages(newImages)

    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviews([...imagePreviews, ...newPreviews])
  }

  const removeImage = (index: number) => {
    const updatedImages = [...selectedImages]
    updatedImages.splice(index, 1)
    setSelectedImages(updatedImages)

    const updatedPreviews = [...imagePreviews]
    URL.revokeObjectURL(updatedPreviews[index])
    updatedPreviews.splice(index, 1)
    setImagePreviews(updatedPreviews)
  }

  // Create Post Submit Handler
  const handleCreatePost = async () => {
    if (!caption.trim()) {
      toast({
        title: t("Empty Caption"),
        description: t("Please write something to share."),
        variant: "destructive"
      })
      return
    }

    setIsSubmittingPost(true)
    try {
      const formData = new FormData()
      
      // Compute automatic title
      const rawTitle = caption.split("\n")[0]
      const finalTitle = rawTitle.length > 50 ? rawTitle.substring(0, 47) + "..." : rawTitle
      
      // Append fields
      formData.append("title", finalTitle)
      formData.append("content", caption)
      
      // Combine tag input and selected crops
      const tagList = tagsInput
        .split(" ")
        .filter(t => t.startsWith("#"))
        .map(t => t.substring(1))
      
      const allTags = Array.from(new Set([...tagList, ...selectedCrops]))
      formData.append("tags", allTags.join(","))

      if (postLocation) {
        formData.append("location", postLocation) // Location saved in caption content if needed, but append to tags/metadata
      }

      // Append files
      selectedImages.forEach((img) => {
        formData.append("files", img)
      })

      await apiClient.createPost(formData)
      
      toast({
        title: t("Post published"),
        description: t("Your post has been successfully shared with the community.")
      })

      // Reset Form State
      setCaption("")
      setTagsInput("")
      setSelectedCrops([])
      setPostLocation("")
      setSelectedImages([])
      setImagePreviews([])
      setIsModalOpen(false)

      // Refresh Feed
      setIsLoading(true)
      await fetchPosts()

    } catch (error: any) {
      toast({
        title: t("Failed to create post"),
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSubmittingPost(false)
    }
  }

  // Toggle Like State
  const toggleLike = async (postId: string) => {
    // Optimistic update
    setLikesState(prev => {
      const current = prev[postId] || { liked: false, count: 0 }
      return {
        ...prev,
        [postId]: {
          liked: !current.liked,
          count: current.liked ? Math.max(0, current.count - 1) : current.count + 1
        }
      }
    })

    try {
      const result = await apiClient.toggleLike(postId)
      setLikesState(prev => ({
        ...prev,
        [postId]: {
          liked: result.liked,
          count: result.likesCount
        }
      }))
    } catch (err: any) {
      // Revert optimistic update on error
      setLikesState(prev => {
        const current = prev[postId] || { liked: false, count: 0 }
        return {
          ...prev,
          [postId]: {
            liked: !current.liked,
            count: !current.liked ? Math.max(0, current.count - 1) : current.count + 1
          }
        }
      })
      toast({
        title: t("Error"),
        description: err.message || t("Failed to toggle like"),
        variant: "destructive"
      })
    }
  }

  // Toggle Save State
  const toggleSave = (postId: string) => {
    setSavesState(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  // Load comments dynamically when expanding inline
  const handleToggleComments = async (postId: string) => {
    const isExpanded = !!expandedComments[postId]
    setExpandedComments(prev => ({ ...prev, [postId]: !isExpanded }))

    if (!isExpanded && !commentsMap[postId]) {
      setCommentLoading(prev => ({ ...prev, [postId]: true }))
      try {
        const data = await apiClient.getPostById(postId)
        setCommentsMap(prev => ({ ...prev, [postId]: data.comments }))
      } catch (err) {
        console.error("Failed to load comments:", err)
      } finally {
        setCommentLoading(prev => ({ ...prev, [postId]: false }))
      }
    }
  }

  // Add Comment Handler
  const handleAddComment = async (postId: string) => {
    const text = newCommentText[postId] || ""
    if (!text.trim()) return

    try {
      await apiClient.addComment(postId, { content: text })
      
      // Optimistically append comment
      const commentToAdd: Comment = {
        commentId: new Date().toISOString(),
        content: text,
        authorName: profile?.name || "Farmer",
        authorId: user?.uid || "",
        createdAt: { _seconds: Date.now() / 1000, _nanoseconds: 0 }
      }

      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), commentToAdd]
      }))

      // Increment count locally in posts state
      setPosts(prev => prev.map(post => {
        if (post.postId === postId) {
          return { ...post, commentCount: post.commentCount + 1 }
        }
        return post
      }))

      // Clear input
      setNewCommentText(prev => ({ ...prev, [postId]: "" }))
      
      toast({
        title: t("Comment posted"),
        description: t("Your comment has been shared.")
      })
    } catch (err: any) {
      toast({
        title: t("Error"),
        description: err.message,
        variant: "destructive"
      })
    }
  }

  // Filter posts by query and active tag
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery.trim() === "" ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTag = !activeTagFilter || post.tags.includes(activeTagFilter)

    return matchesSearch && matchesTag
  })

  const trendingTags = ["OrganicFarming", "PestControl", "Rice", "Cotton", "WeatherAlert", "Fertilizer"]
  
  const userInitials = profile?.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "U"

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-950 dark:to-slate-900 pb-16">
      
      {/* Sticky header navbar */}
      <div className="sticky top-20 z-20 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/40 py-3 px-4 sm:px-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] mb-8">
        <div className="max-w-[900px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-6 h-6 text-green-600 dark:text-green-500 animate-bounce" />
            <span className="font-extrabold text-lg text-slate-800 dark:text-slate-200 tracking-tight">{t("Community")}</span>
          </div>

          <div className="flex-1 max-w-sm relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              type="text" 
              placeholder={t("Search farms, predictions...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 h-9 rounded-full bg-white/50 border-slate-200 dark:border-slate-800 focus:bg-white text-xs focus:ring-2 focus:ring-green-400 focus:border-green-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            {activeTagFilter && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTagFilter(null)}
                className="rounded-full h-8 text-xs border-green-200 bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1.5"
              >
                Clear #{activeTagFilter} <X size={12} />
              </Button>
            )}
            
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="rounded-full bg-green-600 hover:bg-green-500 text-white font-semibold shadow-md shadow-green-500/10 flex items-center gap-1 text-xs h-9 px-4"
            >
              <Plus size={16} /> {t("New Post")}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[950px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-6 w-full max-w-[700px] mx-auto">
          
          {/* Create Post Placeholder Card */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-[24px] overflow-hidden">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10 ring-2 ring-green-100 dark:ring-green-950">
                  <AvatarFallback className="bg-green-100 text-green-700 font-bold text-sm">{userInitials}</AvatarFallback>
                </Avatar>
                <div 
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 h-10 px-4 rounded-full bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-950/70 border border-slate-200/50 dark:border-slate-800/50 flex items-center cursor-pointer transition-colors"
                >
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Share your farming experience...</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <button 
                  onClick={() => { setIsModalOpen(true); setTimeout(() => fileInputRef.current?.click(), 100) }}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-950/30 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-500 transition-colors text-xs font-semibold"
                >
                  <Camera size={16} className="text-sky-500" /> Photo
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-950/30 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-500 transition-colors text-xs font-semibold"
                >
                  <Video size={16} className="text-amber-500" /> Video
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-950/30 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-500 transition-colors text-xs font-semibold"
                >
                  <Sprout size={16} className="text-emerald-500" /> Crop
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-950/30 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-500 transition-colors text-xs font-semibold"
                >
                  <MapPin size={16} className="text-rose-500" /> Location
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Social Feed List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              <p className="text-xs font-medium text-slate-400 animate-pulse uppercase tracking-wider">Loading feed...</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            <AnimatePresence>
              {filteredPosts.map((post, postIndex) => {
                const likeData = likesState[post.postId] || { liked: false, count: 0 }
                const isSaved = !!savesState[post.postId]
                const comments = commentsMap[post.postId] || []
                const commentsExpanded = !!expandedComments[post.postId]
                const isLoadingComments = !!commentLoading[post.postId]

                return (
                  <motion.div
                    key={post.postId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-[24px] overflow-hidden">
                      <CardContent className="p-0">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-850">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-slate-100 dark:border-slate-850">
                              <AvatarFallback className="bg-gradient-to-tr from-green-500 to-emerald-600 text-white font-bold text-xs uppercase">
                                {post.authorName ? post.authorName.split(" ").map(n => n[0]).slice(0,2).join("") : "F"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{post.authorName}</p>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <span>{post.location || (post.tags.includes("Rice") ? "Punjab, India" : post.tags.includes("Cotton") ? "Haryana, India" : "Village Farm")}</span>
                                <span>•</span>
                                <span>{getTimeAgo(post.createdAt, t)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-slate-600">
                            <MoreHorizontal size={18} />
                          </Button>
                        </div>

                        {/* Caption Content */}
                        <div className="px-4 py-3 space-y-2">
                          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {post.content}
                          </p>
                          
                          {/* Render Tags */}
                          {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {post.tags.map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => setActiveTagFilter(tag)}
                                  className="text-xs font-semibold text-green-600 hover:underline dark:text-green-500 mr-2"
                                >
                                  #{tag}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Media Carousel */}
                        {post.imageUrls && post.imageUrls.length > 0 ? (
                          <div className="relative w-full aspect-video bg-slate-900 border-t border-b border-slate-100 dark:border-slate-850 overflow-hidden group/carousel">
                            <img 
                              src={post.imageUrls[activeImageIndices[post.postId] || 0]} 
                              alt={post.title} 
                              className="w-full h-full object-cover transition-all duration-300"
                            />
                            
                            {post.imageUrls.length > 1 && (
                              <>
                                {/* Left Arrow */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIdx = activeImageIndices[post.postId] || 0;
                                    const nextIdx = currentIdx === 0 ? post.imageUrls!.length - 1 : currentIdx - 1;
                                    setActiveImageIndices(prev => ({ ...prev, [post.postId]: nextIdx }));
                                  }}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                
                                {/* Right Arrow */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIdx = activeImageIndices[post.postId] || 0;
                                    const nextIdx = currentIdx === post.imageUrls!.length - 1 ? 0 : currentIdx + 1;
                                    setActiveImageIndices(prev => ({ ...prev, [post.postId]: nextIdx }));
                                  }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
                                >
                                  <ChevronRight size={16} />
                                </button>

                                {/* Navigation Dots */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-full z-10">
                                  {post.imageUrls.map((_, dotIdx) => (
                                    <button 
                                      type="button"
                                      key={dotIdx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveImageIndices(prev => ({ ...prev, [post.postId]: dotIdx }));
                                      }}
                                      className={`w-1.5 h-1.5 rounded-full transition-all ${dotIdx === (activeImageIndices[post.postId] || 0) ? "bg-white scale-125" : "bg-white/40"}`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ) : post.imageUrl ? (
                          <div className="relative w-full aspect-video bg-slate-900 border-t border-b border-slate-100 dark:border-slate-850 overflow-hidden">
                            <img 
                              src={post.imageUrl} 
                              alt={post.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : null}

                        {/* Interactive Buttons */}
                        <div className="flex items-center justify-between p-3 px-4 border-t border-slate-50 dark:border-slate-850">
                          <div className="flex items-center gap-4">
                            
                            {/* Like Button */}
                            <button
                              onClick={() => toggleLike(post.postId)}
                              className={`flex items-center gap-1.5 text-xs font-semibold hover:scale-105 transition-transform ${likeData.liked ? "text-rose-500" : "text-slate-500 hover:text-rose-500"}`}
                            >
                              <Heart size={18} className={likeData.liked ? "fill-current" : ""} />
                              <span>{likeData.count}</span>
                            </button>

                            {/* Comment Accordion Trigger */}
                            <button
                              onClick={() => handleToggleComments(post.postId)}
                              className={`flex items-center gap-1.5 text-xs font-semibold hover:scale-105 transition-transform ${commentsExpanded ? "text-green-600" : "text-slate-500 hover:text-green-600"}`}
                            >
                              <MessageCircle size={18} />
                              <span>{post.commentCount}</span>
                            </button>

                          </div>

                          <div className="flex items-center gap-3">
                            {/* Save Button */}
                            <button
                              onClick={() => toggleSave(post.postId)}
                              className={`text-slate-400 hover:text-green-600 transition-colors ${isSaved ? "text-green-600" : ""}`}
                            >
                              <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
                            </button>
                          </div>
                        </div>

                        {/* Inline Comments Section (Drawer/Collapse) */}
                        <AnimatePresence>
                          {commentsExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden border-t border-slate-100 dark:border-slate-850 bg-slate-50/[0.4] dark:bg-slate-950/20"
                            >
                              <div className="p-4 space-y-4">
                                {isLoadingComments ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                  </div>
                                ) : comments.length > 0 ? (
                                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                    {comments.map((comment) => (
                                      <div key={comment.commentId} className="flex gap-2 text-xs items-start">
                                        <Avatar className="w-6 h-6 shrink-0">
                                          <AvatarFallback className="bg-slate-200 text-slate-600 font-bold uppercase text-[9px]">
                                            {comment.authorName ? comment.authorName.charAt(0) : "U"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-2xl">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{comment.authorName}</span>
                                            <span className="text-[9px] text-slate-400">{comment.createdAt ? getTimeAgo(comment.createdAt, t) : ""}</span>
                                          </div>
                                          <p className="text-slate-600 dark:text-slate-350 mt-1 leading-relaxed">{comment.content}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-center text-xs text-slate-400 py-3">{t("No comments yet. Be the first to reply!")}</p>
                                )}

                                {/* Add a Comment form inline */}
                                <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/40 pt-3">
                                  <Input
                                    value={newCommentText[post.postId] || ""}
                                    onChange={(e) => setNewCommentText(prev => ({ ...prev, [post.postId]: e.target.value }))}
                                    placeholder={t("Write a comment...")}
                                    className="rounded-full text-xs h-9 bg-white dark:bg-slate-950"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleAddComment(post.postId)
                                      }
                                    }}
                                  />
                                  <Button 
                                    onClick={() => handleAddComment(post.postId)}
                                    size="sm" 
                                    className="rounded-full h-9 bg-green-600 hover:bg-green-500 text-white font-semibold"
                                  >
                                    {t("Send")}
                                  </Button>
                                </div>

                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          ) : (
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-[24px]">
              <CardContent className="py-16 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center text-green-500 border border-green-100 dark:border-green-900/40">
                  <Sprout size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Posts Found</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                  Be the first to share your farming knowledge 🌱
                </p>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Sidebar Column */}
        <div className="hidden lg:block lg:col-span-4 sticky top-28 space-y-6">
          
          {/* Trending Card */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-[24px]">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                <TrendingUp size={16} className="text-green-600" />
                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">Trending Tags</span>
              </div>
              
              <div className="space-y-3">
                {trendingTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTagFilter(tag)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      activeTagFilter === tag
                        ? "bg-green-50/50 border-green-300 dark:bg-green-950/20 dark:border-green-900 text-green-700 dark:text-green-400 font-bold"
                        : "border-slate-100/50 bg-white/20 dark:border-slate-800/50 dark:bg-slate-950/20 hover:border-green-200 text-slate-600 dark:text-slate-400 hover:text-green-600 hover:bg-green-50/[0.15]"
                    }`}
                  >
                    <span className="text-xs">#{tag}</span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats/Tips Card */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-[24px] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Leaf className="w-24 h-24 text-green-500" />
            </div>
            <CardContent className="p-5 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400">
                <Sparkles size={11} /> Crop Advisory
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Monsoon is early this season! 🌧️</p>
              <p className="text-[11px] leading-relaxed text-slate-400">Ensure your crop channels are cleared and soil moisture levels are monitored via your predicted forecasts.</p>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* CREATE POST FULL-SCREEN MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            
            {/* Backdrop cancel trigger */}
            <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[28px] shadow-2xl z-10 space-y-4"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sprout className="text-green-600" /> {t("Create New Post")}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Input details */}
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                
                {/* Author context */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9 border border-slate-100 dark:border-slate-850">
                    <AvatarFallback className="bg-green-100 text-green-700 font-bold text-xs uppercase">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{profile?.name || "Farmer"}</span>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-0.5">
                      <MapPin size={10} />
                      <input 
                        type="text" 
                        value={postLocation}
                        onChange={(e) => setPostLocation(e.target.value)}
                        placeholder="Add location (e.g. Punjab, India)"
                        className="bg-transparent border-none outline-none p-0 focus:ring-0 text-[10px] w-48 text-slate-600 dark:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Caption Area */}
                <div className="space-y-1">
                  <Textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Share your farming experience (tips, pests updates, harvest yield)..."
                    rows={4}
                    className="w-full text-sm rounded-xl border-slate-200 dark:border-slate-800 focus:border-green-500 bg-white/50 dark:bg-slate-950/50"
                  />
                </div>

                {/* Tags and Hashtags */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hashtags</Label>
                    <Input
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="#fertilizer #rice"
                      className="rounded-xl border-slate-200 dark:border-slate-800 h-9 bg-white/50 dark:bg-slate-950/50 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Crop category</Label>
                    <Select 
                      onValueChange={(val: string) => {
                        if (!selectedCrops.includes(val)) {
                          setSelectedCrops([...selectedCrops, val])
                        }
                      }}
                    >
                      <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-9 bg-white/50 dark:bg-slate-950/50 text-xs">
                        <SelectValue placeholder="Select Crop tag" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Rice" className="cursor-pointer">Rice</SelectItem>
                        <SelectItem value="Cotton" className="cursor-pointer">Cotton</SelectItem>
                        <SelectItem value="Wheat" className="cursor-pointer">Wheat</SelectItem>
                        <SelectItem value="Organic" className="cursor-pointer">Organic</SelectItem>
                        <SelectItem value="PestControl" className="cursor-pointer">Pest Control</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Render Selected Crop Badges */}
                {selectedCrops.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCrops.map(c => (
                      <span 
                        key={c}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200/50"
                      >
                        #{c} 
                        <button onClick={() => setSelectedCrops(selectedCrops.filter(item => item !== c))}>
                          <X size={10} className="hover:text-rose-500" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Drag and Drop Image Box */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Upload Images (Max 5)</Label>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800/80 hover:border-green-500 dark:hover:border-green-500/80 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-1"
                  >
                    <ImageIcon size={28} className="text-slate-400 dark:text-slate-600 mb-1" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Click to upload photos</p>
                    <p className="text-[10px] text-slate-400">Supports JPG, JPEG, PNG</p>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Image Previews Carousel */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-5 gap-2.5 pt-1">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative aspect-square rounded-xl border border-slate-200/50 dark:border-slate-800 overflow-hidden group">
                        <img 
                          src={src} 
                          alt={`preview-${index}`} 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Submit Section */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                <Button 
                  variant="outline" 
                  disabled={isSubmittingPost}
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full h-10 px-5 border-slate-200 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePost}
                  disabled={isSubmittingPost || !caption.trim()}
                  className="rounded-full h-10 px-6 bg-green-600 hover:bg-green-500 text-white font-semibold text-xs shadow-md shadow-green-500/10 flex items-center gap-1.5"
                >
                  {isSubmittingPost ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Publishing...
                    </>
                  ) : (
                    <>Post</>
                  )}
                </Button>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  )
}