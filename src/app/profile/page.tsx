"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfilePage from "@/components/ProfilePage";
import AdminPanel from "@/components/AdminPanel";
import { type VisitingRow } from "@/components/VisitingPropertyCard";
import { type Property } from "@/db/schema";

type UserProfile = {
  id: number;
  username: string;
  role: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  officePhone: string | null;
  mobilePhone: string | null;
  contactEmail: string | null;
};

type ListingRow = Property & { coverImage: string | null };

export default function ProfileRoute() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [visitings, setVisitings] = useState<VisitingRow[]>([]);
  const [listings, setListings] = useState<ListingRow[]>([]);

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setProfile)
      .catch(() => router.replace("/auth"));

    fetch("/api/visitings/my")
      .then((r) => (r.ok ? r.json() : []))
      .then(setVisitings)
      .catch(() => {});

    fetch("/api/properties/my")
      .then((r) => (r.ok ? r.json() : []))
      .then(setListings)
      .catch(() => {});
  }, [router]);

  const makeUploadHandler = (type: "avatar" | "cover") => async (file: File): Promise<string> => {
    const body = new FormData();
    body.append("type", type);
    body.append("file", file);

    const res = await fetch("/api/user/upload-image", { method: "POST", body });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? "Upload failed.");
    }
    const { publicUrl } = await res.json();
    return publicUrl;
  };

  const handleLocationChange = async (location: string) => {
    const res = await fetch("/api/user/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? "Failed to update location.");
    }
    setProfile(await res.json());
  };

  const handleSocialsChange = async (socials: { facebook?: string; linkedin?: string; twitter?: string }) => {
    const res = await fetch("/api/user/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facebookUrl: socials.facebook,
        linkedinUrl: socials.linkedin,
        twitterUrl: socials.twitter,
      }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? "Failed to update socials.");
    }
    setProfile(await res.json());
  };

  const handleContactChange = async (contact: { officePhone: string; mobilePhone: string; email: string }) => {
    const res = await fetch("/api/user/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        officePhone: contact.officePhone,
        mobilePhone: contact.mobilePhone,
        contactEmail: contact.email,
      }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? "Failed to update contact info.");
    }
    setProfile(await res.json());
  };

  if (!profile) return null;

  if (profile.role === "admin") return <AdminPanel />;

  return (
    <>
      <ProfilePage
        avatarImage={profile.avatarUrl ?? ""}
        coverImage={profile.coverUrl ?? ""}
        name={profile.username}
        description={profile.role === "admin" ? "Administrator" : "Member"}
        location={profile.location ?? ""}
        socials={{
          facebook: profile.facebookUrl ?? undefined,
          linkedin: profile.linkedinUrl ?? undefined,
          twitter: profile.twitterUrl ?? undefined,
        }}
        phone={{ office: profile.officePhone ?? "", mobile: profile.mobilePhone ?? "" }}
        email={profile.contactEmail ?? ""}
        visitings={visitings}
        listings={listings}
        onAvatarChange={makeUploadHandler("avatar")}
        onCoverChange={makeUploadHandler("cover")}
        isOwnProfile={true}
        onLocationChange={handleLocationChange}
        onSocialsChange={handleSocialsChange}
        onContactChange={handleContactChange}
      />
    </>
  );
}
