export interface UserSummary {
  id: number;
  username: string;
  fullName: string;
  city?: string;
  state?: string;
  profilePicture?: string;
  isVerified: boolean;
}

export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  zipCode?: string;
  city?: string;
  state?: string;
  bio?: string;
  profilePicture?: string;
  isActive: boolean;
  isVerified?: boolean;
  createdAt: string;
  lastLogin?: string;
  itemsCount?: number;
  tradesCompleted?: number;
  averageRating?: number | null;
  reviewsCount?: number;
}

export interface PublicUserProfile extends UserSummary {
  bio?: string;
  createdAt: string;
  itemsCount: number;
  tradesCompleted: number;
  averageRating?: number | null;
  reviewsCount: number;
}

export interface ItemPhoto {
  id: number;
  itemId: number;
  photoUrl: string;
  isPrimary: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface ItemCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

export interface ItemSummary {
  id: number;
  title: string;
  condition: string;
  status: 'active' | 'traded' | 'archived';
  city: string;
  state: string;
  photos: ItemPhoto[];
}

export interface Item {
  id: number;
  title: string;
  description: string;
  condition: string;
  status: 'active' | 'traded' | 'archived';
  isVisible: boolean;
  ownerId: number;
  categoryId: number;
  zipCode: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt?: string;
  photos: ItemPhoto[];
  category: ItemCategory;
  owner: UserSummary;
}

export interface TradeOffer {
  id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'withdrawn';
  itemId: number;
  itemOwnerId: number;
  offererId: number;
  offeredItemId: number;
  message?: string;
  isCounterOffer: boolean;
  parentOfferId?: number;
  createdAt: string;
  respondedAt?: string;
  item: ItemSummary;
  offeredItem: ItemSummary;
  offerer: UserSummary;
  itemOwner: UserSummary;
  counterOffers: TradeOffer[];
}

export interface Trade {
  id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  item1Id: number;
  item2Id: number;
  user1Id: number;
  user2Id: number;
  notes?: string;
  meetingLocation?: string;
  meetingTime?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  item1: ItemSummary;
  item2: ItemSummary;
  user1: UserSummary;
  user2: UserSummary;
}

export interface Review {
  id: number;
  reviewerId?: number | null;
  revieweeId: number;
  tradeId: number;
  rating: number;
  title: string;
  comment?: string;
  isPublic: boolean;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt?: string;
  reviewer?: UserSummary | null;
  reviewee: UserSummary;
}

export interface PlanOption {
  id: 'monthly' | 'annual';
  name: string;
  priceCents: number;
  priceDisplay: string;
  currency: string;
  interval: 'month' | 'year';
  savingsPercent: number;
  highlighted: boolean;
  description: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  status: 'none' | 'trialing' | 'active' | 'past_due' | 'cancelled' | 'incomplete' | 'unpaid';
  planType?: 'monthly' | 'annual' | null;
  amountCents?: number | null;
  currency: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string | null;
  freeListingLimit: number;
}
