import {
  pgTable,
  serial,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "agent"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  avatarKey: text("avatar_key"),
  coverKey: text("cover_key"),
  location: text("location"),
  facebookUrl: text("facebook_url"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const propertyTypeEnum = pgEnum("property_type", [
  "house",
  "apartment",
  "condo",
  "townhouse",
  "land",
  "commercial",
]);

export const propertyCategoryEnum = pgEnum("property_category", [
  "standard",
  "luxury",
  "affordable",
  "development",
]);

export const propertyStatusEnum = pgEnum("property_status", [
  "for_sale",
  "for_rent",
  "sold",
  "rented",
]);

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull().default("US"),
  type: propertyTypeEnum("type").notNull(),
  status: propertyStatusEnum("status").notNull().default("for_sale"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  squareFeet: numeric("square_feet", { precision: 10, scale: 2 }),
  lotSize: numeric("lot_size", { precision: 10, scale: 2 }),
  yearBuilt: integer("year_built"),
  garage: boolean("garage").default(false),
  pool: boolean("pool").default(false),
  category: propertyCategoryEnum("category").notNull().default("standard"),
  images: text("images").array(),
  listedByAgentId: integer("listed_by_agent_id").references((): AnyPgColumn => agents.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  officePhone: text("office_phone"),
  mobilePhone: text("mobile_phone"),
  contactEmail: text("contact_email"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export const visitingStatusEnum = pgEnum("visiting_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

export const propertyVisitings = pgTable("property_visitings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  visitDate: timestamp("visit_date").notNull(),
  hour: integer("hour").notNull(),
  status: visitingStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  messageId: integer("message_id").references((): AnyPgColumn => messages.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PropertyVisiting = typeof propertyVisitings.$inferSelect;
export type NewPropertyVisiting = typeof propertyVisitings.$inferInsert;

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  city: text("city").notNull(),
  image: text("image").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull(),
  reviews: integer("reviews").notNull().default(0),
  experience: integer("experience").notNull().default(0),
  phone: text("phone").notNull(),
  email: text("email").notNull().unique(),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export const messages = pgTable("messages", {
  id:         serial("id").primaryKey(),
  senderId:   integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: integer("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject:    text("subject").notNull(),
  message:    text("message").notNull(),
  sentAt:     timestamp("sent_at").defaultNow().notNull(),
  seenAt:     timestamp("seen_at"),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export const pendingListingStatusEnum = pgEnum("pending_listing_status", [
  "pending",
  "approved",
  "declined",
]);

export const pendingListings = pgTable("pending_listings", {
  id:           serial("id").primaryKey(),
  messageId:    integer("message_id").references(() => messages.id, { onDelete: "set null" }),
  agentId:      integer("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  submittedBy:  integer("submitted_by").references(() => users.id, { onDelete: "set null" }),
  status:       pendingListingStatusEnum("status").notNull().default("pending"),
  propertyData: jsonb("property_data").notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  reviewedAt:   timestamp("reviewed_at"),
});

export type PendingListing = typeof pendingListings.$inferSelect;
export type NewPendingListing = typeof pendingListings.$inferInsert;
