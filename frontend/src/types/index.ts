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
  owner: User;
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
  item: Item;
  offeredItem: Item;
  offerer: User;
  itemOwner: User;
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
  item1: Item;
  item2: Item;
  user1: User;
  user2: User;
}

export interface Review {
  id: number;
  reviewerId: number;
  revieweeId: number;
  tradeId: number;
  rating: number;
  title: string;
  comment?: string;
  isPublic: boolean;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt?: string;
  reviewer: User;
  reviewee: User;
}

export interface Subscription {
  id: number;
  userId: number;
  status: 'active' | 'cancelled' | 'past_due' | 'incomplete';
  paymentProvider: 'stripe' | 'paypal';
  amount: number;
  currency: string;
  billingCycle: string;
  nextBillingDate?: string;
  createdAt: string;
  updatedAt?: string;
  cancelledAt?: string;
}
