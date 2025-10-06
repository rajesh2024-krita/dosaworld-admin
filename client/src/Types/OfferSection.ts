export interface Bucket {
  name: string;
  people: string;
  price: string;
}

export interface OfferSection {
  _id?: string;
  id?: number;
  title: string;
  subtitle: string;
  description: string;
  buckets: {
    S: Bucket;
    M: Bucket;
  };
  backgroundImage: string;
  biryaniImage: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}