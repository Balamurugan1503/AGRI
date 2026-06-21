import { getIdToken } from "./auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ✅ ADDED: Specific types for handling FastAPI validation errors
type FastAPIValidationError = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

type ErrorBody = {
  detail?: string | FastAPIValidationError[];
};


// --- Main Type Definitions ---

export type CommunityPost = {
  postId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  tags: string[];
  commentCount: number;
  imageUrl?: string;
  imageUrls?: string[];
  location?: string;
  likedBy?: string[];
  likesCount?: number;
};

export type Comment = {
  commentId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
};

export type PostWithComments = {
  post: CommunityPost;
  comments: Comment[];
};


class ApiClient {
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await getIdToken()
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = await this.getHeaders()

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      // ✅ FIX: Assert the type of errorBody to safely access its properties.
      const errorBody = await response.json().catch(() => ({ detail: "An unexpected error occurred" })) as ErrorBody;
      const detail = errorBody.detail || `HTTP Error: ${response.status}`;
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
    
    return response.json() as Promise<T>
  }

  // --- Methods ---

  // Farm management
  async addFarm(farmData: { name: string; location: { lat: number; lon: number }; soil_type: string; area_ha: number }) {
    return this.request("/api/add-farm", {
      method: "POST",
      body: JSON.stringify(farmData),
    })
  }

  async getFarms() {
    return this.request<{ farms: any[] }>("/api/get-farms")
  }

  // Predictions
  async predictYield(predictionData: {
    farm_id: string; crop: string; soil_type?: string; crop_type?: string;
    N: number; P: number; K: number; ph: number; temperature?: number;
    humidity?: number; rainfall?: number; moisture?: number;
    sowing_date: string; area: number; fertilizer: number; pesticide: number;
  }) {
    return this.request("/api/predict", {
      method: "POST",
      body: JSON.stringify(predictionData),
    })
  }

  async getPredictions() {
    return this.request<{ predictions: any[] }>("/api/get-predictions")
  }

  // Profile management
  async updateProfile(profileData: { name: string; email: string; phone?: string; role?: string; }) {
    return this.request("/api/update-profile", {
      method: "POST",
      body: JSON.stringify(profileData),
    })
  }

  // --- Community Forum Methods ---

  async createPost(formData: FormData) {
    const token = await getIdToken();
    const headers: Record<string, string> = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${API_BASE_URL}/api/community/posts`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status}`;
      try {
        // ✅ FIX: Assert the type of errorBody to safely access its properties.
        const errorBody = await response.json() as ErrorBody;
        
        if (Array.isArray(errorBody.detail) && errorBody.detail[0]) {
          const firstError = errorBody.detail[0] as FastAPIValidationError;
          errorMessage = `${firstError.msg} (in ${firstError.loc[1]})`;
        } 
        else if (typeof errorBody.detail === 'string') {
          errorMessage = errorBody.detail;
        }
      } catch (e) {
        // The response was not JSON, so we stick with the original HTTP status message.
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getPosts(): Promise<{ posts: CommunityPost[] }> {
    return this.request<{ posts: CommunityPost[] }>("/api/community/posts", {
      // @ts-ignore - This is for Next.js 13+ App Router caching
      next: { revalidate: 0 },
    });
  }

  async getPostById(postId: string): Promise<PostWithComments> {
    return this.request<PostWithComments>(`/api/community/posts/${postId}`);
  }

  async addComment(postId: string, commentData: { content: string }) {
    return this.request(`/api/community/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(commentData),
    });
  }

  async toggleLike(postId: string): Promise<{ liked: boolean; likesCount: number }> {
    return this.request<{ liked: boolean; likesCount: number }>(`/api/community/posts/${postId}/like`, {
      method: "POST",
    });
  }
}

export const apiClient = new ApiClient()