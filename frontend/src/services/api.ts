import {
  Item,
  ItemCategory,
  ItemPhoto,
  ItemSummary,
  PlanOption,
  PublicUserProfile,
  Review,
  SubscriptionStatus,
  Trade,
  TradeOffer,
  User,
  UserSummary,
} from '../types';

export class ApiError extends Error {
  status: number;
  code?: string;
  pricingUrl?: string;

  constructor(message: string, status: number, code?: string, pricingUrl?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.pricingUrl = pricingUrl;
  }
}

export const isPaymentRequiredError = (err: unknown): err is ApiError =>
  err instanceof ApiError && err.status === 402;

function resolveApiBase(): string {
  const configured = (process.env.REACT_APP_API_URL || '').trim();
  // Avoid double /api/api/... when REACT_APP_API_URL is accidentally set to "/api"
  if (configured === '/api' || configured === '/api/') {
    return '';
  }
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveApiBase();

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken');
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let code: string | undefined;
    let pricingUrl: string | undefined;

    try {
      const errBody = await response.json();
      if (typeof errBody?.detail === 'string') {
        message = errBody.detail;
      } else if (errBody?.detail && typeof errBody.detail === 'object') {
        message = errBody.detail.message || message;
        code = errBody.detail.code;
        pricingUrl = errBody.detail.pricing_url;
      }
    } catch {
      // Ignore non-JSON error bodies
    }
    throw new ApiError(message, response.status, code, pricingUrl);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

// --- Mappers (snake_case API -> camelCase UI) ---

export function mapUserSummary(raw: any): UserSummary {
  return {
    id: raw.id,
    username: raw.username,
    fullName: raw.full_name,
    city: raw.city ?? undefined,
    state: raw.state ?? undefined,
    profilePicture: raw.profile_picture ?? undefined,
    isVerified: Boolean(raw.is_verified),
  };
}

export function mapUser(raw: any): User {
  return {
    id: raw.id,
    email: raw.email,
    username: raw.username,
    fullName: raw.full_name,
    phoneNumber: raw.phone_number ?? undefined,
    phoneVerified: raw.phone_verified ?? false,
    zipCode: raw.zip_code ?? undefined,
    city: raw.city ?? undefined,
    state: raw.state ?? undefined,
    bio: raw.bio ?? undefined,
    profilePicture: raw.profile_picture ?? undefined,
    isActive: raw.is_active ?? true,
    isVerified: raw.is_verified ?? false,
    createdAt: raw.created_at,
    lastLogin: raw.last_login ?? undefined,
    itemsCount: raw.items_count,
    tradesCompleted: raw.trades_completed,
    averageRating: raw.average_rating,
    reviewsCount: raw.reviews_count,
  };
}

export function mapPublicUserProfile(raw: any): PublicUserProfile {
  return {
    ...mapUserSummary(raw),
    bio: raw.bio ?? undefined,
    createdAt: raw.created_at,
    itemsCount: raw.items_count ?? 0,
    tradesCompleted: raw.trades_completed ?? 0,
    averageRating: raw.average_rating ?? null,
    reviewsCount: raw.reviews_count ?? 0,
  };
}

export function mapItemPhoto(raw: any): ItemPhoto {
  return {
    id: raw.id,
    itemId: raw.item_id,
    photoUrl: resolveMediaUrl(raw.photo_url),
    isPrimary: Boolean(raw.is_primary),
    orderIndex: raw.order_index ?? 0,
    createdAt: raw.created_at,
  };
}

export function mapItemSummary(raw: any): ItemSummary {
  return {
    id: raw.id,
    title: raw.title,
    condition: raw.condition,
    status: raw.status,
    city: raw.city,
    state: raw.state,
    photos: (raw.photos || []).map(mapItemPhoto),
  };
}

export function mapItem(raw: any): Item {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    condition: raw.condition,
    status: raw.status,
    isVisible: Boolean(raw.is_visible),
    ownerId: raw.owner_id,
    categoryId: raw.category_id,
    zipCode: raw.zip_code,
    city: raw.city,
    state: raw.state,
    latitude: raw.latitude ?? undefined,
    longitude: raw.longitude ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at ?? undefined,
    photos: (raw.photos || []).map(mapItemPhoto),
    category: raw.category,
    owner: mapUserSummary(raw.owner),
  };
}

export function mapTradeOffer(raw: any): TradeOffer {
  return {
    id: raw.id,
    status: raw.status,
    itemId: raw.item_id,
    itemOwnerId: raw.item_owner_id,
    offererId: raw.offerer_id,
    offeredItemId: raw.offered_item_id,
    message: raw.message ?? undefined,
    isCounterOffer: Boolean(raw.is_counter_offer),
    parentOfferId: raw.parent_offer_id ?? undefined,
    createdAt: raw.created_at,
    respondedAt: raw.responded_at ?? undefined,
    item: mapItemSummary(raw.item),
    offeredItem: mapItemSummary(raw.offered_item),
    offerer: mapUserSummary(raw.offerer),
    itemOwner: mapUserSummary(raw.item_owner),
    counterOffers: (raw.counter_offers || []).map(mapTradeOffer),
  };
}

export function mapTrade(raw: any): Trade {
  return {
    id: raw.id,
    status: raw.status,
    item1Id: raw.item1_id,
    item2Id: raw.item2_id,
    user1Id: raw.user1_id,
    user2Id: raw.user2_id,
    notes: raw.notes ?? undefined,
    meetingLocation: raw.meeting_location ?? undefined,
    meetingTime: raw.meeting_time ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at ?? undefined,
    completedAt: raw.completed_at ?? undefined,
    item1: mapItemSummary(raw.item1),
    item2: mapItemSummary(raw.item2),
    user1: mapUserSummary(raw.user1),
    user2: mapUserSummary(raw.user2),
  };
}

export function mapReview(raw: any): Review {
  return {
    id: raw.id,
    reviewerId: raw.reviewer_id ?? null,
    revieweeId: raw.reviewee_id,
    tradeId: raw.trade_id,
    rating: raw.rating,
    title: raw.title,
    comment: raw.comment ?? undefined,
    isPublic: Boolean(raw.is_public),
    isAnonymous: Boolean(raw.is_anonymous),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at ?? undefined,
    reviewer: raw.reviewer ? mapUserSummary(raw.reviewer) : null,
    reviewee: mapUserSummary(raw.reviewee),
  };
}

export function mapSubscriptionStatus(raw: any): SubscriptionStatus {
  return {
    isActive: Boolean(raw.is_active),
    status: raw.status,
    planType: raw.plan_type ?? null,
    amountCents: raw.amount_cents ?? null,
    currency: raw.currency || 'USD',
    currentPeriodEnd: raw.current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(raw.cancel_at_period_end),
    trialEnd: raw.trial_end ?? null,
    freeListingLimit: raw.free_listing_limit ?? 1,
  };
}

export function mapPlanOption(raw: any): PlanOption {
  return {
    id: raw.id,
    name: raw.name,
    priceCents: raw.price_cents,
    priceDisplay: raw.price_display,
    currency: raw.currency,
    interval: raw.interval,
    savingsPercent: raw.savings_percent,
    highlighted: Boolean(raw.highlighted),
    description: raw.description,
  };
}

// --- API Modules ---

export const authApi = {
  async login(email: string, password: string): Promise<{ accessToken: string; user: User }> {
    const data = await apiFetch<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return { accessToken: data.access_token, user: mapUser(data.user) };
  },

  async register(payload: {
    email: string;
    username: string;
    fullName: string;
    password: string;
    phoneNumber?: string;
    zipCode?: string;
    city?: string;
    state?: string;
  }): Promise<{ accessToken: string; user: User }> {
    const data = await apiFetch<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        username: payload.username,
        full_name: payload.fullName,
        password: payload.password,
        phone_number: payload.phoneNumber || undefined,
        zip_code: payload.zipCode || undefined,
        city: payload.city || undefined,
        state: payload.state || undefined,
      }),
    });
    return { accessToken: data.access_token, user: mapUser(data.user) };
  },
};

export const usersApi = {
  async getMe(): Promise<User> {
    const data = await apiFetch<any>('/api/users/me');
    return mapUser(data);
  },

  async updateMe(payload: {
    fullName?: string;
    phoneNumber?: string;
    zipCode?: string;
    city?: string;
    state?: string;
    bio?: string;
  }): Promise<User> {
    const data = await apiFetch<any>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({
        full_name: payload.fullName,
        phone_number: payload.phoneNumber || null,
        zip_code: payload.zipCode || null,
        city: payload.city || null,
        state: payload.state || null,
        bio: payload.bio || null,
      }),
    });
    return mapUser(data);
  },

  async getPublicProfile(userId: number): Promise<PublicUserProfile> {
    const data = await apiFetch<any>(`/api/users/${userId}`);
    return mapPublicUserProfile(data);
  },
};

export interface BrowseItemsParams {
  q?: string;
  categoryId?: number;
  location?: string;
  sort?: 'newest' | 'oldest' | 'category';
  limit?: number;
  offset?: number;
}

export const itemsApi = {
  async getCategories(): Promise<ItemCategory[]> {
    return apiFetch<ItemCategory[]>('/api/items/categories');
  },

  async browseItems(params: BrowseItemsParams = {}): Promise<Item[]> {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.categoryId) qs.set('category_id', String(params.categoryId));
    if (params.location) qs.set('location', params.location);
    if (params.sort) qs.set('sort', params.sort);
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.offset) qs.set('offset', String(params.offset));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const data = await apiFetch<any[]>(`/api/items/${suffix}`);
    return data.map(mapItem);
  },

  async getItem(itemId: number): Promise<Item> {
    const data = await apiFetch<any>(`/api/items/${itemId}`);
    return mapItem(data);
  },

  async getMyListings(): Promise<Item[]> {
    const data = await apiFetch<any[]>('/api/items/my/listings');
    return data.map(mapItem);
  },

  async createItem(payload: {
    title: string;
    description: string;
    condition: string;
    categoryId: number;
    zipCode: string;
    city: string;
    state: string;
  }): Promise<Item> {
    const data = await apiFetch<any>('/api/items/', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        condition: payload.condition,
        category_id: Number(payload.categoryId),
        zip_code: payload.zipCode,
        city: payload.city,
        state: payload.state,
        photos: [],
      }),
    });
    return mapItem(data);
  },

  async uploadPhotos(itemId: number, files: File[]): Promise<ItemPhoto[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));
    const data = await apiFetch<any[]>(`/api/items/${itemId}/photos`, {
      method: 'POST',
      body: formData,
    });
    return data.map(mapItemPhoto);
  },

  async deleteItem(itemId: number): Promise<void> {
    await apiFetch(`/api/items/${itemId}`, { method: 'DELETE' });
  },
};

export const tradesApi = {
  async createOffer(payload: {
    itemId: number;
    offeredItemId: number;
    message?: string;
  }): Promise<TradeOffer> {
    const data = await apiFetch<any>('/api/trades/offers', {
      method: 'POST',
      body: JSON.stringify({
        item_id: payload.itemId,
        offered_item_id: payload.offeredItemId,
        message: payload.message || undefined,
      }),
    });
    return mapTradeOffer(data);
  },

  async getReceivedOffers(): Promise<TradeOffer[]> {
    const data = await apiFetch<any[]>('/api/trades/offers/received');
    return data.map(mapTradeOffer);
  },

  async getMadeOffers(): Promise<TradeOffer[]> {
    const data = await apiFetch<any[]>('/api/trades/offers/made');
    return data.map(mapTradeOffer);
  },

  async acceptOffer(offerId: number): Promise<Trade> {
    const data = await apiFetch<any>(`/api/trades/offers/${offerId}/accept`, {
      method: 'POST',
    });
    return mapTrade(data);
  },

  async rejectOffer(offerId: number): Promise<void> {
    await apiFetch(`/api/trades/offers/${offerId}/reject`, { method: 'POST' });
  },

  async getActiveTrades(): Promise<Trade[]> {
    const data = await apiFetch<any[]>('/api/trades/active');
    return data.map(mapTrade);
  },

  async getTradeHistory(): Promise<Trade[]> {
    const data = await apiFetch<any[]>('/api/trades/history');
    return data.map(mapTrade);
  },

  async completeTrade(tradeId: number): Promise<void> {
    await apiFetch(`/api/trades/${tradeId}/complete`, { method: 'POST' });
  },

  async cancelTrade(tradeId: number): Promise<void> {
    await apiFetch(`/api/trades/${tradeId}/cancel`, { method: 'POST' });
  },
};

export const reviewsApi = {
  async createReview(payload: {
    tradeId: number;
    revieweeId: number;
    rating: number;
    title: string;
    comment?: string;
    isAnonymous?: boolean;
  }): Promise<Review> {
    const data = await apiFetch<any>('/api/reviews/', {
      method: 'POST',
      body: JSON.stringify({
        trade_id: payload.tradeId,
        reviewee_id: payload.revieweeId,
        rating: payload.rating,
        title: payload.title,
        comment: payload.comment || undefined,
        is_public: true,
        is_anonymous: Boolean(payload.isAnonymous),
      }),
    });
    return mapReview(data);
  },

  async getUserReviews(userId: number): Promise<Review[]> {
    const data = await apiFetch<any[]>(`/api/reviews/user/${userId}`);
    return data.map(mapReview);
  },
};

export const paymentsApi = {
  async getPlans(): Promise<{ plans: PlanOption[]; stripeConfigured: boolean }> {
    const data = await apiFetch<any>('/api/payments/plans');
    return {
      plans: (data.plans || []).map(mapPlanOption),
      stripeConfigured: Boolean(data.stripe_configured),
    };
  },

  async getStatus(): Promise<SubscriptionStatus> {
    const data = await apiFetch<any>('/api/payments/status');
    return mapSubscriptionStatus(data);
  },

  async createCheckout(plan: 'monthly' | 'annual'): Promise<{ checkoutUrl: string; sessionId: string }> {
    const data = await apiFetch<any>('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
    return { checkoutUrl: data.checkout_url, sessionId: data.session_id };
  },

  async createPortal(): Promise<{ portalUrl: string }> {
    const data = await apiFetch<any>('/api/payments/portal', {
      method: 'POST',
    });
    return { portalUrl: data.portal_url };
  },
};
