"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Loader2,
  Mail,
  MapPin,
  PenLine,
  Phone,
  X,
} from "lucide-react";
import VisitingPropertyCard, { type VisitingRow } from "@/components/VisitingPropertyCard";

/* ── Inline SVG brand icons (not in this lucide-react build) ── */
const FacebookSvg = ({ className = "w-5 h-5 sm:w-4 sm:h-4 shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const LinkedInSvg = ({ className = "w-5 h-5 sm:w-4 sm:h-4 shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
const TwitterSvg = ({ className = "w-5 h-5 sm:w-4 sm:h-4 shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

function toAbsoluteUrl(url: string): string {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

interface Social {
  platform: string;
  handle: string;
  url: string;
}

interface PropertyItem {
  id: string | number;
  title: string;
  image: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
}

interface ProfilePageProps {
  coverImage?: string;
  avatarImage?: string;
  name: string;
  description: string;
  location?: string;
  socials?: { facebook?: string; linkedin?: string; twitter?: string };
  phone: { office: string; mobile: string };
  email: string;
  onChat?: () => void;
  properties?: PropertyItem[];
  onPropertyClick?: (property: PropertyItem) => void;
  visitings?: VisitingRow[];
  /** Return the new public URL on success, or throw on failure. */
  onAvatarChange?: (file: File) => Promise<string>;
  onCoverChange?: (file: File) => Promise<string>;
  isOwnProfile?: boolean;
  onLocationChange?: (location: string) => Promise<void>;
  onSocialsChange?: (socials: { facebook?: string; linkedin?: string; twitter?: string }) => Promise<void>;
  onContactChange?: (contact: { officePhone: string; mobilePhone: string; email: string }) => Promise<void>;
}

export default function ProfilePage({
  coverImage = "",
  avatarImage = "",
  name,
  location = "",
  socials = {},
  phone,
  email,
  visitings = [],
  onAvatarChange,
  onCoverChange,
  isOwnProfile = false,
  onLocationChange,
  onSocialsChange,
  onContactChange,
}: ProfilePageProps) {
  // Internal image display state (overrides prop after a successful upload)
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);
  const [coverOverride, setCoverOverride] = useState<string | null>(null);
  const avatarSrc = avatarOverride ?? avatarImage;
  const coverSrc = coverOverride ?? coverImage;

  // Upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Edit states
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationValue, setLocationValue] = useState(location);
  const [editingSocials, setEditingSocials] = useState(false);
  const [socialsValue, setSocialsValue] = useState(socials);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Contact edit state
  const [editingContact, setEditingContact] = useState<"officePhone" | "mobilePhone" | "email" | null>(null);
  const [contactValue, setContactValue] = useState({ officePhone: phone.office, mobilePhone: phone.mobile, email });
  const [contactSaveError, setContactSaveError] = useState<string | null>(null);
  const contactErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const officePhoneRef = useRef<HTMLInputElement>(null);
  const mobilePhoneRef = useRef<HTMLInputElement>(null);
  const contactEmailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingContact) return;
    const map = { officePhone: officePhoneRef, mobilePhone: mobilePhoneRef, email: contactEmailRef };
    map[editingContact]?.current?.focus();
  }, [editingContact]);

  const showContactError = (msg: string) => {
    setContactSaveError(msg);
    if (contactErrorTimerRef.current) clearTimeout(contactErrorTimerRef.current);
    contactErrorTimerRef.current = setTimeout(() => setContactSaveError(null), 3000);
  };

  const handleSaveContact = async () => {
    if (!onContactChange) return;

    if (contactValue.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue.email)) {
      showContactError("Please enter a valid email address.");
      return;
    }

    setContactSaveError(null);
    setIsSaving(true);
    try {
      await onContactChange(contactValue);
      setEditingContact(null);
    } catch (err) {
      showContactError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  // Hidden file inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);


  const handleFileSelect = async (
    file: File,
    type: "avatar" | "cover",
    callback: (f: File) => Promise<string>,
  ) => {
    setUploadError(null);

    if (!ALLOWED.includes(file.type)) {
      setUploadError("Only JPEG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setUploadError("File must be under 5 MB.");
      return;
    }

    try {
      if (type === "avatar") setUploadingAvatar(true);
      else setUploadingCover(true);

      const newUrl = await callback(file);

      if (type === "avatar") setAvatarOverride(newUrl);
      else setCoverOverride(newUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      if (type === "avatar") setUploadingAvatar(false);
      else setUploadingCover(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!onLocationChange) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await onLocationChange(locationValue);
      setEditingLocation(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save location.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSocials = async () => {
    if (!onSocialsChange) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSocialsChange(socialsValue);
      setEditingSocials(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save socials.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelLocation = () => {
    setLocationValue(location);
    setEditingLocation(false);
  };

  const handleCancelSocials = () => {
    setSocialsValue(socials);
    setEditingSocials(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Cover + Avatar ── */}
      <section className="relative">
        {/* Cover */}
        <div className="relative h-[33vh] overflow-hidden rounded-b-3xl bg-gray-200 group">
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-300 via-gray-200 to-slate-400" />
          )}

          {/* Cover upload overlay */}
          {onCoverChange && (
            <>
              <div
                className={[
                  "absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-200",
                  uploadingCover ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                ].join(" ")}
              >
                {uploadingCover ? (
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium transition-colors border border-white/30"
                  >
                    <Camera className="w-4 h-4" />
                    Change cover
                  </button>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, "cover", onCoverChange);
                  e.target.value = "";
                }}
              />
            </>
          )}
        </div>

        {/* Avatar — overlaps cover bottom-left */}
        <div className="absolute left-16 sm:left-24 bottom-0 translate-y-1/2 z-10">
          <div className="relative group/av">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={name}
                className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-white object-cover shadow-md"
              />
            ) : (
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-white bg-gray-300 shadow-md flex items-center justify-center">
                <span className="text-5xl font-bold text-gray-500 select-none">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Avatar upload overlay */}
            {onAvatarChange && (
              <>
                <div
                  className={[
                    "absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity duration-200",
                    uploadingAvatar ? "opacity-100" : "opacity-0 group-hover/av:opacity-100",
                  ].join(" ")}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      aria-label="Change avatar"
                      className="flex items-center justify-center w-full h-full"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, "avatar", onAvatarChange);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Upload error toast */}
      {uploadError && (
        <div className="max-w-6xl mx-auto w-full px-6 sm:px-10 mt-4 flex items-center gap-3 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <span className="flex-1">{uploadError}</span>
          <button onClick={() => setUploadError(null)} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── User info ── */}
      <div className="max-w-6xl mx-auto w-full px-6 sm:px-10 pt-24 pb-24">
        {/* ml offsets text past avatar: left(64/96px) + avatar(144/176px) + small gap */}
        <div className="ml-36 sm:ml-48">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent leading-tight">
            {name}
          </h1>

          {/* ── Info row: location + social links ── */}
          <div className="mt-1.5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-3 sm:gap-y-2 sm:gap-x-3">

            {/* Location */}
            {editingLocation ? (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={locationValue}
                  onChange={(e) => setLocationValue(e.target.value)}
                  placeholder="City, Country"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveLocation();
                    if (e.key === "Escape") handleCancelLocation();
                  }}
                  className="text-sm border-b border-gray-300 focus:border-slate-800 outline-none bg-transparent w-36 pb-0.5 placeholder:text-gray-300"
                />
                <button
                  onClick={handleSaveLocation}
                  disabled={isSaving}
                  aria-label="Save location"
                  className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleCancelLocation}
                  disabled={isSaving}
                  aria-label="Cancel"
                  className="p-0.5 rounded text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/loc">
                {locationValue ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationValue)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <MapPin className="w-5 h-5 sm:w-[18px] sm:h-[18px] shrink-0" />
                    <span className="text-base sm:text-base font-medium">{locationValue}</span>
                  </a>
                ) : (
                  <>
                    <MapPin className="w-[18px] h-[18px] text-gray-400 shrink-0" />
                    <span className="text-base font-medium text-gray-500">
                      {isOwnProfile && <span className="text-gray-300 italic font-normal">Add location</span>}
                    </span>
                  </>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => setEditingLocation(true)}
                    aria-label="Edit location"
                    className="opacity-0 group-hover/loc:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 ml-0.5"
                  >
                    <PenLine className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            )}

            {/* Separator — hidden on mobile */}
            {!editingLocation && !editingSocials && (locationValue || isOwnProfile) && (
              <span className="hidden sm:inline text-gray-300 select-none text-base font-light">·</span>
            )}

            {/* Social links — display */}
            {!editingSocials ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 group/soc">
                {socialsValue.facebook && (
                  <a
                    href={toAbsoluteUrl(socialsValue.facebook)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    <FacebookSvg />
                    <span className="text-base font-medium">Facebook</span>
                  </a>
                )}
                {socialsValue.linkedin && (
                  <a
                    href={toAbsoluteUrl(socialsValue.linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-700 hover:text-blue-600 transition-colors"
                  >
                    <LinkedInSvg />
                    <span className="text-base font-medium">LinkedIn</span>
                  </a>
                )}
                {socialsValue.twitter && (
                  <a
                    href={toAbsoluteUrl(socialsValue.twitter)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <TwitterSvg />
                    <span className="text-base font-medium">Twitter</span>
                  </a>
                )}
                {isOwnProfile && (socialsValue.facebook || socialsValue.linkedin || socialsValue.twitter) && (
                  <button
                    onClick={() => setEditingSocials(true)}
                    aria-label="Edit social links"
                    className="opacity-0 group-hover/soc:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 ml-0.5"
                  >
                    <PenLine className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
                {isOwnProfile && !socialsValue.facebook && !socialsValue.linkedin && !socialsValue.twitter && (
                  <button
                    onClick={() => setEditingSocials(true)}
                    className="flex items-center gap-1.5 text-base text-gray-300 italic hover:text-gray-500 font-medium transition-colors"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    Add social links
                  </button>
                )}
              </div>
            ) : (
              /* Social links — edit form (expands full width below) */
              <div className="w-full mt-1 flex flex-col gap-2">
                {(
                  [
                    { key: "facebook", Svg: FacebookSvg, placeholder: "Facebook URL" },
                    { key: "linkedin", Svg: LinkedInSvg, placeholder: "LinkedIn URL" },
                    { key: "twitter",  Svg: TwitterSvg,  placeholder: "Twitter / X URL" },
                  ] as const
                ).map(({ key, Svg, placeholder }) => (
                  <div key={key} className="flex items-center gap-2 max-w-sm">
                    <Svg />
                    <input
                      type="text"
                      value={socialsValue[key] || ""}
                      onChange={(e) => setSocialsValue({ ...socialsValue, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                    />
                  </div>
                ))}
                {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                <div className="flex gap-2 mt-0.5">
                  <button
                    onClick={handleSaveSocials}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save
                  </button>
                  <button
                    onClick={handleCancelSocials}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Location save error */}
          {saveError && editingLocation && (
            <p className="text-xs text-red-500 mt-1">{saveError}</p>
          )}
        </div>
      </div>

      {/* ── Contact + Properties ── */}
      <div className="mt-3 flex-1 bg-gray-50">
        <div className="max-w-6xl mx-auto w-full py-12 px-6 sm:px-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        {/* Left: Contact info */}
        <div className="w-full md:w-72 shrink-0 flex flex-col gap-1">
          {editingContact !== null ? (
            <div className="flex flex-col gap-3 bg-white/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex flex-col gap-1 flex-1">
                  <input
                    ref={officePhoneRef}
                    type="tel"
                    value={contactValue.officePhone}
                    onChange={(e) => setContactValue({ ...contactValue, officePhone: e.target.value })}
                    placeholder="Office phone"
                    className="text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                  />
                  <input
                    ref={mobilePhoneRef}
                    type="tel"
                    value={contactValue.mobilePhone}
                    onChange={(e) => setContactValue({ ...contactValue, mobilePhone: e.target.value })}
                    placeholder="Mobile phone"
                    className="text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  ref={contactEmailRef}
                  type="email"
                  value={contactValue.email}
                  onChange={(e) => setContactValue({ ...contactValue, email: e.target.value })}
                  placeholder="Email address"
                  className="text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white flex-1"
                />
              </div>
              {contactSaveError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  {contactSaveError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveContact}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <Check className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  onClick={() => { setContactValue({ officePhone: phone.office, mobilePhone: phone.mobile, email }); setEditingContact(null); }}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 group/contact">
              {contactValue.officePhone && (
                <div className="flex items-center gap-3 group/row">
                  <Phone className="w-5 h-5 text-slate-500 shrink-0" />
                  <a href={`tel:${contactValue.officePhone}`} className="text-base text-slate-700 hover:text-slate-900 transition-colors">
                    {contactValue.officePhone}
                    <span className="text-slate-400 ml-2">(Office)</span>
                  </a>
                  {isOwnProfile && (
                    <button onClick={() => setEditingContact("officePhone")} className="opacity-0 group-hover/row:opacity-100 transition-opacity ml-0.5">
                      <PenLine className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>
              )}
              {contactValue.mobilePhone && (
                <div className="flex items-center gap-3 group/row2">
                  <Phone className="w-5 h-5 text-slate-500 shrink-0" />
                  <a href={`tel:${contactValue.mobilePhone}`} className="text-base text-slate-700 hover:text-slate-900 transition-colors">
                    {contactValue.mobilePhone}
                    <span className="text-slate-400 ml-2">(Mobile)</span>
                  </a>
                  {isOwnProfile && (
                    <button onClick={() => setEditingContact("mobilePhone")} className="opacity-0 group-hover/row2:opacity-100 transition-opacity ml-0.5">
                      <PenLine className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>
              )}
              {contactValue.email && (
                <div className="flex items-center gap-3 group/row3">
                  <Mail className="w-5 h-5 text-slate-500 shrink-0" />
                  <a href={`mailto:${contactValue.email}`} className="text-base text-slate-700 hover:text-slate-900 transition-colors break-all">
                    {contactValue.email}
                  </a>
                  {isOwnProfile && (
                    <button onClick={() => setEditingContact("email")} className="opacity-0 group-hover/row3:opacity-100 transition-opacity ml-0.5">
                      <PenLine className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>
              )}
              {isOwnProfile && !contactValue.officePhone && !contactValue.mobilePhone && !contactValue.email && (
                <button
                  onClick={() => setEditingContact("officePhone")}
                  className="flex items-center gap-1.5 text-base text-slate-400 italic hover:text-slate-600 transition-colors"
                >
                  <PenLine className="w-4 h-4" />
                  Add contact info
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Requested showings grid */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Requested Showings</h2>
          {visitings.length === 0 ? (
            <p className="text-sm text-gray-400 py-6">No showings requested yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {visitings.map((v) => (
                <VisitingPropertyCard key={v.visitingId} visiting={v} />
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
