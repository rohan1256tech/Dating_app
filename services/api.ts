// API URL comes from EXPO_PUBLIC_API_URL in .env — updated automatically by dev-start.ps1
// To find your IP manually: ipconfig | Select-String "IPv4"
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://backend-production-1ad4.up.railway.app';
console.log('🌐 API URL:', API_BASE_URL);

// API Response Types
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    statusCode?: number;
}

export interface User {
    id: string;
    phoneNumber: string;
    isVerified: boolean;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

// API Service
class ApiService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    error: data.message || 'Something went wrong',
                    statusCode: response.status,
                };
            }

            return { data, statusCode: response.status };
        } catch (error) {
            console.error('API Error:', error);
            return {
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    // Request OTP
    async requestOTP(phoneNumber: string): Promise<ApiResponse<{ message: string }>> {
        return this.request('/auth/request-otp', {
            method: 'POST',
            body: JSON.stringify({ phoneNumber }),
        });
    }

    // Verify OTP
    async verifyOTP(
        phoneNumber: string,
        otp: string
    ): Promise<ApiResponse<AuthResponse>> {
        return this.request('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ phoneNumber, otp }),
        });
    }

    // Refresh Token
    async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
        return this.request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        });
    }

    // Authenticated request helper
    async authenticatedRequest<T>(
        endpoint: string,
        accessToken: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        return this.request(endpoint, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${accessToken}`,
            },
        });
    }

    // ==================== PROFILE API ====================

    // Get current user's profile
    async getProfile(accessToken: string): Promise<ApiResponse<any>> {
        return this.authenticatedRequest('/profile/me', accessToken);
    }

    // Create or update profile
    async createOrUpdateProfile(
        accessToken: string,
        profileData: {
            name?: string;
            dob?: string;
            gender?: string;
            interests?: string[];
            bio?: string;
            lookingFor?: string;
            location?: {
                latitude: number;
                longitude: number;
                city?: string;
            };
        }
    ): Promise<ApiResponse<{ message: string; profile: any }>> {
        return this.authenticatedRequest('/profile/create-or-update', accessToken, {
            method: 'POST',
            body: JSON.stringify(profileData),
        });
    }

    // Upload photo to Cloudinary
    // Upload photo to Cloudinary
    async uploadPhoto(accessToken: string, photoUri: string): Promise<ApiResponse<{
        success: boolean;
        message: string;
        photoUrl: string;
        profile: any;
    }>> {
        const formData = new FormData();

        // Create file object from URI
        const filename = photoUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('photo', {
            uri: photoUri,
            name: filename,
            type,
        } as any);

        return this.authenticatedRequest('/profile/upload-photo', accessToken, {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            body: formData as any,
        });
    }

    // ==================== DISCOVERY API ====================

    // Get potential matches
    // Get potential matches
    async getPotentialMatches(accessToken: string): Promise<ApiResponse<any>> {
        return this.authenticatedRequest('/discovery/cards', accessToken);
    }

    // Swipe profile
    async swipe(targetId: string, action: 'LIKE' | 'PASS' | 'SUPERLIKE', accessToken: string): Promise<ApiResponse<any>> {
        return this.authenticatedRequest('/discovery/swipe', accessToken, {
            method: 'POST',
            body: JSON.stringify({ targetId, action }),
        });
    }

    // ========================================
    // MATCH ENDPOINTS
    // ========================================

    /**
     * Get all active matches for the logged-in user
     */
    async getMatches(accessToken: string): Promise<ApiResponse<any[]>> {
        return this.authenticatedRequest('/matches', accessToken);
    }

    /**
     * Delete (soft delete) a match
     */
    async deleteMatch(matchId: string, accessToken: string): Promise<ApiResponse<{ message: string }>> {
        return this.authenticatedRequest(`/matches/${matchId}`, accessToken, {
            method: 'DELETE',
        });
    }

    // ========================================
    // CHAT/MESSAGE ENDPOINTS
    // ========================================

    /**
     * Get paginated messages for a match
     */
    async getMessages(
        matchId: string,
        accessToken: string,
        page: number = 1,
        limit: number = 50
    ): Promise<ApiResponse<any>> {
        return this.authenticatedRequest(
            `/chat/${matchId}?page=${page}&limit=${limit}`,
            accessToken
        );
    }

    /**
     * Send a message in a match
     */
    async sendMessage(
        matchId: string,
        content: string,
        accessToken: string
    ): Promise<ApiResponse<any>> {
        return this.authenticatedRequest('/chat/send', accessToken, {
            method: 'POST',
            body: JSON.stringify({ matchId, content }),
        });
    }

    /**
     * Mark all messages in a match as read
     */
    async markMessagesAsRead(matchId: string, accessToken: string): Promise<ApiResponse<{ markedCount: number }>> {
        return this.authenticatedRequest(`/chat/read/${matchId}`, accessToken, {
            method: 'PATCH',
        });
    }

    /**
     * Get unread message count
     */
    async getUnreadCount(accessToken: string): Promise<ApiResponse<{ unreadCount: number }>> {
        return this.authenticatedRequest(`/chat/unread/count`, accessToken);
    }

    // ========================================
    // MAP ENDPOINTS
    // ========================================

    /**
     * Get nearby users on map
     */
    async getNearbyUsers(
        accessToken: string,
        maxDistance: number = 5000
    ): Promise<ApiResponse<any>> {
        return this.authenticatedRequest(
            `/discovery/nearby?maxDistance=${maxDistance}`,
            accessToken
        );
    }

    /**
     * Update map location and visibility
     */
    async updateMapLocation(
        latitude: number,
        longitude: number,
        showOnMap: boolean,
        accessToken: string
    ): Promise<ApiResponse<any>> {
        return this.authenticatedRequest(
            `/discovery/map-location`,
            accessToken,
            {
                method: 'PATCH',
                body: JSON.stringify({ latitude, longitude, showOnMap }),
            }
        );
    }

    // ========================================
    // PREMIUM / SUBSCRIPTION ENDPOINTS
    // ========================================

    /** Get current subscription status + swipesRemaining */
    async getSubscriptionStatus(accessToken: string): Promise<ApiResponse<any>> {
        return this.authenticatedRequest('/subscription/status', accessToken);
    }

    /** Get users who liked you (blurred for FREE, full for PREMIUM) */
    async getLikesReceived(accessToken: string): Promise<ApiResponse<any>> {
        return this.authenticatedRequest('/likes/received', accessToken);
    }

    /** Activate 30-min boost — PREMIUM only */
    async activateBoost(accessToken: string): Promise<ApiResponse<any>> {
        return this.authenticatedRequest('/boost/activate', accessToken, {
            method: 'POST',
        });
    }

    // ========================================
    // PAYMENT ENDPOINTS
    // ========================================

    /**
     * Create a Razorpay order for a plan.
     * Returns { orderId, amount, currency, keyId, merchantName, planId, durationDays }
     */
    async createPaymentOrder(
        accessToken: string,
        planId: 'monthly' | 'quarterly' | 'annual',
    ): Promise<ApiResponse<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        merchantName: string;
        planId: string;
        durationDays: number;
        description: string;
    }>> {
        return this.authenticatedRequest('/payment/create-order', accessToken, {
            method: 'POST',
            body: JSON.stringify({ planId }),
        });
    }

    /**
     * Verify Razorpay payment signature after checkout completes.
     * Returns { success, paymentId, plan, durationDays }
     */
    async verifyPayment(
        accessToken: string,
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string,
        planId: string,
    ): Promise<ApiResponse<{ success: boolean; paymentId: string; plan: string; durationDays: number }>> {
        return this.authenticatedRequest('/payment/verify', accessToken, {
            method: 'POST',
            body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature, planId }),
        });
    }

    /**
     * Verify a Google Play Billing purchase token server-side.
     * Called after purchaseUpdatedListener fires with a successful purchase.
     * Returns { success, plan, expiresAt }
     */
    async verifyIAPPurchase(
        accessToken: string,
        body: { purchaseToken: string; productId: string; packageName: string },
    ): Promise<ApiResponse<{ success: boolean; plan: string; expiresAt: string }>> {
        return this.authenticatedRequest('/payment/verify-iap', accessToken, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    /**
     * Firebase Phone Auth — step 3 of the new login flow.
     * Send Firebase ID token (from confirmation.confirm(otp) → user.getIdToken())
     * to the backend, which verifies it and returns our JWT tokens.
     */
    async firebaseVerify(idToken: string): Promise<ApiResponse<AuthResponse>> {
        return this.request('/auth/firebase-verify', {
            method: 'POST',
            body: JSON.stringify({ idToken }),
        });
    }
}

export const api = new ApiService(API_BASE_URL);
export default api;
