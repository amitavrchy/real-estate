export type User = {
  id: string;
  name: string;
  email: string;
  role: "BUYER" | "AGENT" | "ADMIN";
  avatarUrl?: string;
  bio?: string;
  phone?: string;
};
export type Agent = Pick<
  User,
  "id" | "name" | "avatarUrl" | "bio" | "phone"
> & { _count?: { listings: number }; listings?: Property[] };
export type Media = {
  id: string;
  url: string;
  alt: string;
  kind: string;
  sortOrder: number;
};
export type Neighborhood = {
  id: string;
  slug: string;
  name: string;
  city: string;
  description: string;
  heroImage: string;
  lat: number;
  lng: number;
  statsJson: {
    walk: number;
    transit: number;
    bike: number;
    median: string;
    character: string;
  };
  _count?: { properties: number };
  properties?: Property[];
  posts?: Post[];
};
export type Property = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  listingType: "SALE" | "RENT";
  propertyType: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  lat: number;
  lng: number;
  amenities: string[];
  features: string[];
  isPrivateExclusive: boolean;
  publishedAt: string;
  media: Media[];
  agent: Agent;
  neighborhood?: Neighborhood;
  neighborhoodId?: string;
  yearBuilt?: number;
};
export type PageResult = {
  items: Property[];
  total: number;
  page: number;
  pages: number;
};
export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string;
  publishedAt: string;
};
export type Collection = {
  id: string;
  name: string;
  items: { id: string; note?: string; rank: number; property: Property }[];
};
export type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: "NEW" | "CONTACTED" | "CLOSED";
  createdAt: string;
  property: { title: string; slug: string };
};
export type SavedSearch = {
  id: string;
  name: string;
  filters: Record<string, string>;
};
