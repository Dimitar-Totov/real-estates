"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  PenLine,
  Phone,
  User,
  X,
} from "lucide-react";
import VisitingPropertyCard, { type VisitingRow, formatHour } from "@/components/VisitingPropertyCard";
import PropertyCard from "@/components/PropertyCard";
import { type Property, type Meeting } from "@/db/schema";

type ListingRow = Property & { coverImage: string | null };

/* ── Inline SVG brand icons ── */
const FacebookSvg = ({ className = "w-4 h-4 shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const LinkedInSvg = ({ className = "w-4 h-4 shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
const TwitterSvg = ({ className = "w-4 h-4 shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;
const CARD_SCROLL_STEP = 344;

function toAbsoluteUrl(url: string): string {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
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
  visitings?: VisitingRow[];
  listings?: ListingRow[];
  onFetchMeetings?: (page: number) => Promise<{ rows: Meeting[]; total: number }>;
  onAvatarChange?: (file: File) => Promise<string>;
  onCoverChange?: (file: File) => Promise<string>;
  isOwnProfile?: boolean;
  onLocationChange?: (location: string) => Promise<void>;
  onSocialsChange?: (socials: { facebook?: string; linkedin?: string; twitter?: string }) => Promise<void>;
  onContactChange?: (contact: { officePhone: string; mobilePhone: string; email: string }) => Promise<void>;
  onAcceptVisiting?: (visitingId: number) => Promise<void>;
  onDeclineVisiting?: (visitingId: number) => Promise<void>;
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
  listings: listingsProp = [],
  onFetchMeetings,
  onAvatarChange,
  onCoverChange,
  isOwnProfile = false,
  onLocationChange,
  onSocialsChange,
  onContactChange,
  onAcceptVisiting,
  onDeclineVisiting,
}: ProfilePageProps) {
  const [listings, setListings] = useState<ListingRow[]>(listingsProp);
  useEffect(() => { setListings(listingsProp); }, [listingsProp]);

  const [visitingsState, setVisitingsState] = useState<VisitingRow[]>(visitings);
  useEffect(() => { setVisitingsState(visitings); }, [visitings]);

  const isAgent = listingsProp.length > 0 || listings.length > 0;
  const [activeTab, setActiveTab] = useState<"showings" | "listings" | "meetings">("showings");

  // Images
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);
  const [coverOverride, setCoverOverride] = useState<string | null>(null);
  const avatarSrc = avatarOverride ?? avatarImage;
  const coverSrc = coverOverride ?? coverImage;
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Toasts
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showSuccessToast = (msg: string) => {
    setSuccessToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSuccessToast(null), 4000);
  };

  // Location edit
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationValue, setLocationValue] = useState(location);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Socials edit
  const [editingSocials, setEditingSocials] = useState(false);
  const [socialsValue, setSocialsValue] = useState(socials);

  // Contact edit (null = not editing)
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

  // Carousel
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) { setCanScrollLeft(false); setCanScrollRight(false); return; }
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    if (carouselRef.current) carouselRef.current.scrollLeft = 0;
    // Small timeout to allow DOM to settle after tab switch
    const t = setTimeout(checkScroll, 50);
    return () => clearTimeout(t);
  }, [activeTab, checkScroll]);

  useEffect(() => {
    const t = setTimeout(checkScroll, 50);
    return () => clearTimeout(t);
  }, [visitingsState.length, listings.length, checkScroll]);

  const scrollCarouselLeft = () => carouselRef.current?.scrollBy({ left: -CARD_SCROLL_STEP, behavior: "smooth" });
  const scrollCarouselRight = () => carouselRef.current?.scrollBy({ left: CARD_SCROLL_STEP, behavior: "smooth" });

  // Meetings pagination
  const [meetingsList, setMeetingsList] = useState<Meeting[]>([]);
  const [meetingsTotal, setMeetingsTotal] = useState(0);
  const [meetingsPage, setMeetingsPage] = useState(1);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const meetingsTotalPages = Math.ceil(meetingsTotal / 5);

  const fetchMeetingsPage = useCallback(async (page: number) => {
    if (!onFetchMeetings) return;
    setMeetingsLoading(true);
    try {
      const { rows, total } = await onFetchMeetings(page);
      setMeetingsList(rows);
      setMeetingsTotal(total);
      setMeetingsPage(page);
    } finally {
      setMeetingsLoading(false);
    }
  }, [onFetchMeetings]);

  useEffect(() => {
    if (activeTab === "meetings") fetchMeetingsPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Handlers ──

  const handleFileSelect = async (file: File, type: "avatar" | "cover", callback: (f: File) => Promise<string>) => {
    setUploadError(null);
    if (!ALLOWED.includes(file.type)) { setUploadError("Only JPEG, PNG, or WebP images are allowed."); return; }
    if (file.size > MAX_SIZE) { setUploadError("File must be under 5 MB."); return; }
    try {
      if (type === "avatar") setUploadingAvatar(true); else setUploadingCover(true);
      const newUrl = await callback(file);
      if (type === "avatar") setAvatarOverride(newUrl); else setCoverOverride(newUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      if (type === "avatar") setUploadingAvatar(false); else setUploadingCover(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!onLocationChange) return;
    setSaveError(null); setIsSaving(true);
    try { await onLocationChange(locationValue); setEditingLocation(false); }
    catch (err) { setSaveError(err instanceof Error ? err.message : "Failed to save location."); }
    finally { setIsSaving(false); }
  };

  const handleSaveSocials = async () => {
    if (!onSocialsChange) return;
    setSaveError(null); setIsSaving(true);
    try { await onSocialsChange(socialsValue); setEditingSocials(false); }
    catch (err) { setSaveError(err instanceof Error ? err.message : "Failed to save socials."); }
    finally { setIsSaving(false); }
  };

  const handleSaveContact = async () => {
    if (!onContactChange) return;
    if (contactValue.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue.email)) {
      showContactError("Please enter a valid email address."); return;
    }
    setContactSaveError(null); setIsSaving(true);
    try { await onContactChange(contactValue); setEditingContact(null); }
    catch (err) { showContactError(err instanceof Error ? err.message : "Failed to save."); }
    finally { setIsSaving(false); }
  };

  const handleAcceptVisiting = async (visitingId: number) => {
    if (!onAcceptVisiting) return;
    await onAcceptVisiting(visitingId);
    setVisitingsState((prev) => prev.filter((v) => v.visitingId !== visitingId));
    showSuccessToast("Showing confirmed! A meeting has been scheduled.");
    fetchMeetingsPage(meetingsPage);
  };

  const handleDeclineVisiting = async (visitingId: number) => {
    if (!onDeclineVisiting) return;
    await onDeclineVisiting(visitingId);
    setVisitingsState((prev) => prev.filter((v) => v.visitingId !== visitingId));
  };

  const hasContactInfo = !!(contactValue.officePhone || contactValue.mobilePhone || contactValue.email);
  const hasSocials = !!(socialsValue.facebook || socialsValue.linkedin || socialsValue.twitter);

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Cover + Avatar ── */}
      <section className="relative">
        <div className="relative h-[33vh] overflow-hidden rounded-b-3xl bg-gray-200 group">
          {coverSrc
            ? <img src={coverSrc} alt="Cover" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
            : <div className="w-full h-full bg-gradient-to-br from-slate-300 via-gray-200 to-slate-400" />}
          {onCoverChange && (
            <>
              <div className={["absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-200", uploadingCover ? "opacity-100" : "opacity-0 group-hover:opacity-100"].join(" ")}>
                {uploadingCover
                  ? <Loader2 className="w-7 h-7 text-white animate-spin" />
                  : <button onClick={() => coverInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium border border-white/30"><Camera className="w-4 h-4" />Change cover</button>}
              </div>
              <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, "cover", onCoverChange!); e.target.value = ""; }} />
            </>
          )}
        </div>

        <div className="absolute left-16 sm:left-24 bottom-0 translate-y-1/2 z-10">
          <div className="relative group/av">
            {avatarSrc
              ? <img src={avatarSrc} alt={name} className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-white object-cover shadow-md" /> // eslint-disable-line @next/next/no-img-element
              : <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-white bg-gray-300 shadow-md flex items-center justify-center"><span className="text-5xl font-bold text-gray-500 select-none">{name.charAt(0).toUpperCase()}</span></div>}
            {onAvatarChange && (
              <>
                <div className={["absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity duration-200", uploadingAvatar ? "opacity-100" : "opacity-0 group-hover/av:opacity-100"].join(" ")}>
                  {uploadingAvatar
                    ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                    : <button onClick={() => avatarInputRef.current?.click()} aria-label="Change avatar" className="flex items-center justify-center w-full h-full"><Camera className="w-6 h-6 text-white" /></button>}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, "avatar", onAvatarChange!); e.target.value = ""; }} />
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Toasts ── */}
      {uploadError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm shadow-lg">
            <span className="flex-1">{uploadError}</span>
            <button onClick={() => setUploadError(null)}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      {successToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm shadow-lg">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1">{successToast}</span>
            <button onClick={() => setSuccessToast(null)}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* ── User info header ── */}
      <div className="max-w-6xl mx-auto w-full px-6 sm:px-10 pt-24 pb-8">
        <div className="ml-36 sm:ml-48">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent leading-tight">
            {name}
          </h1>

          {/* ── Info row: location · socials · contact ── */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">

            {/* Location */}
            {editingLocation ? (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <input type="text" value={locationValue} onChange={(e) => setLocationValue(e.target.value)}
                  placeholder="City, Country" autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveLocation(); if (e.key === "Escape") { setLocationValue(location); setEditingLocation(false); } }}
                  className="text-sm border-b border-gray-300 focus:border-slate-800 outline-none bg-transparent w-36 pb-0.5 placeholder:text-gray-300" />
                <button onClick={handleSaveLocation} disabled={isSaving} className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => { setLocationValue(location); setEditingLocation(false); }} disabled={isSaving} className="p-0.5 rounded text-gray-400 hover:bg-gray-100 disabled:opacity-50">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 group/loc">
                {locationValue
                  ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationValue)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium">
                      <MapPin className="w-4 h-4 shrink-0" />{locationValue}
                    </a>
                  : isOwnProfile && <button onClick={() => setEditingLocation(true)} className="flex items-center gap-1 text-sm text-gray-300 italic hover:text-gray-500 transition-colors"><MapPin className="w-4 h-4" />Add location</button>}
                {isOwnProfile && locationValue && (
                  <button onClick={() => setEditingLocation(true)} aria-label="Edit location" className="opacity-0 group-hover/loc:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 ml-0.5">
                    <PenLine className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            )}

            {/* Dot separators + socials */}
            {!editingLocation && !editingSocials && (locationValue || isOwnProfile) && (hasSocials || isOwnProfile) && (
              <span className="hidden sm:inline text-gray-300 select-none font-light">·</span>
            )}

            {!editingSocials ? (
              <div className="flex items-center gap-3 group/soc">
                {socialsValue.facebook && (
                  <a href={toAbsoluteUrl(socialsValue.facebook)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-500 transition-colors text-sm font-medium">
                    <FacebookSvg />Facebook
                  </a>
                )}
                {socialsValue.linkedin && (
                  <a href={toAbsoluteUrl(socialsValue.linkedin)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-700 hover:text-blue-600 transition-colors text-sm font-medium">
                    <LinkedInSvg />LinkedIn
                  </a>
                )}
                {socialsValue.twitter && (
                  <a href={toAbsoluteUrl(socialsValue.twitter)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium">
                    <TwitterSvg />Twitter
                  </a>
                )}
                {isOwnProfile && hasSocials && (
                  <button onClick={() => setEditingSocials(true)} aria-label="Edit social links" className="opacity-0 group-hover/soc:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100">
                    <PenLine className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
                {isOwnProfile && !hasSocials && (
                  <button onClick={() => setEditingSocials(true)} className="flex items-center gap-1 text-sm text-gray-300 italic hover:text-gray-500 transition-colors">
                    <PenLine className="w-3.5 h-3.5" />Add social links
                  </button>
                )}
              </div>
            ) : (
              /* Socials edit — full-width below (rendered outside the flex row below) */
              null
            )}

            {/* Separator before contact */}
            {!editingLocation && !editingSocials && editingContact === null && (hasContactInfo || isOwnProfile) && (hasSocials || locationValue) && (
              <span className="hidden sm:inline text-gray-300 select-none font-light">·</span>
            )}

            {/* Contact info inline */}
            {editingContact === null && (
              <div className="flex flex-wrap items-center gap-3 group/contact">
                {contactValue.officePhone && (
                  <a href={`tel:${contactValue.officePhone}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />{contactValue.officePhone}
                    <span className="text-gray-400 text-xs">(Office)</span>
                  </a>
                )}
                {contactValue.mobilePhone && (
                  <a href={`tel:${contactValue.mobilePhone}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />{contactValue.mobilePhone}
                    <span className="text-gray-400 text-xs">(Mobile)</span>
                  </a>
                )}
                {contactValue.email && (
                  <a href={`mailto:${contactValue.email}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors break-all">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-gray-400" />{contactValue.email}
                  </a>
                )}
                {isOwnProfile && hasContactInfo && (
                  <button onClick={() => setEditingContact("officePhone")} aria-label="Edit contact" className="opacity-0 group-hover/contact:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100">
                    <PenLine className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
                {isOwnProfile && !hasContactInfo && (
                  <button onClick={() => setEditingContact("officePhone")} className="flex items-center gap-1 text-sm text-gray-300 italic hover:text-gray-500 transition-colors">
                    <PenLine className="w-3.5 h-3.5" />Add contact info
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Location save error */}
          {saveError && editingLocation && <p className="text-xs text-red-500 mt-1">{saveError}</p>}

          {/* Socials edit form — expanded below info row */}
          {editingSocials && (
            <div className="mt-3 flex flex-col gap-2 max-w-sm">
              {([
                { key: "facebook", Svg: FacebookSvg, placeholder: "Facebook URL" },
                { key: "linkedin", Svg: LinkedInSvg, placeholder: "LinkedIn URL" },
                { key: "twitter",  Svg: TwitterSvg,  placeholder: "Twitter / X URL" },
              ] as const).map(({ key, Svg, placeholder }) => (
                <div key={key} className="flex items-center gap-2">
                  <Svg />
                  <input type="text" value={socialsValue[key] || ""} onChange={(e) => setSocialsValue({ ...socialsValue, [key]: e.target.value })}
                    placeholder={placeholder} className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white" />
                </div>
              ))}
              {saveError && <p className="text-xs text-red-500">{saveError}</p>}
              <div className="flex gap-2 mt-0.5">
                <button onClick={handleSaveSocials} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Save
                </button>
                <button onClick={() => { setSocialsValue(socials); setEditingSocials(false); }} disabled={isSaving} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Contact edit form — expanded below info row */}
          {editingContact !== null && (
            <div className="mt-3 flex flex-col gap-3 bg-white/80 rounded-2xl p-4 shadow-sm max-w-sm border border-gray-100">
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-slate-500 shrink-0 mt-2" />
                <div className="flex flex-col gap-1 flex-1">
                  <input ref={officePhoneRef} type="tel" value={contactValue.officePhone}
                    onChange={(e) => setContactValue({ ...contactValue, officePhone: e.target.value })}
                    placeholder="Office phone" className="text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white" />
                  <input ref={mobilePhoneRef} type="tel" value={contactValue.mobilePhone}
                    onChange={(e) => setContactValue({ ...contactValue, mobilePhone: e.target.value })}
                    placeholder="Mobile phone" className="text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <input ref={contactEmailRef} type="email" value={contactValue.email}
                  onChange={(e) => setContactValue({ ...contactValue, email: e.target.value })}
                  placeholder="Email address" className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white" />
              </div>
              {contactSaveError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                  <X className="w-3.5 h-3.5 shrink-0" />{contactSaveError}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleSaveContact} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}<Check className="w-3.5 h-3.5" />Save
                </button>
                <button onClick={() => { setContactValue({ officePhone: phone.office, mobilePhone: phone.mobile, email }); setEditingContact(null); }} disabled={isSaving}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-100 disabled:opacity-50 border border-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Cards section — full screen width ── */}
      <div className="flex-1 bg-gray-50 py-10">

        {/* Tab switcher — agents only */}
        {isAgent && (
          <div className="flex justify-center mb-8 px-6">
            <div className="flex flex-wrap justify-center items-center bg-gray-100 rounded-2xl p-1.5 gap-1">
              {(["showings", "listings", "meetings"] as const).map((tab) => {
                const labels = { showings: "Requested Showings", listings: "My Listings", meetings: "Meetings" };
                const counts = { showings: visitingsState.length, listings: listings.length, meetings: meetingsTotal };
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={["px-4 sm:px-6 py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 whitespace-nowrap", activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"].join(" ")}>
                    {labels[tab]}
                    {counts[tab] > 0 && (
                      <span className={["ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold", activeTab === tab ? "bg-gray-900 text-white" : "bg-gray-300 text-gray-600"].join(" ")}>
                        {counts[tab]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* User-role "Requested Showings" heading — centered, big */}
        {!isAgent && (
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-800 mb-8 px-6">
            Requested Showings
          </h2>
        )}

        {/* ── Showings carousel ── */}
        {(!isAgent || activeTab === "showings") && (
          visitingsState.length === 0
            ? <p className="w-full text-center text-xl text-gray-400">No showings requested yet.</p>
            : (
              <div className="relative">
                {canScrollLeft && (
                  <button onClick={scrollCarouselLeft}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                )}
                <div ref={carouselRef} onScroll={checkScroll}
                  className="flex justify-center gap-5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-6 sm:px-10 pb-4">
                  {visitingsState.map((v) => (
                    <div key={v.visitingId} className="w-80 shrink-0">
                      <VisitingPropertyCard
                        visiting={v}
                        showActions={isAgent}
                        onAccept={isAgent && onAcceptVisiting ? () => handleAcceptVisiting(v.visitingId) : undefined}
                        onDecline={isAgent && onDeclineVisiting ? () => handleDeclineVisiting(v.visitingId) : undefined}
                      />
                    </div>
                  ))}
                </div>
                {canScrollRight && (
                  <button onClick={scrollCarouselRight}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                )}
              </div>
            )
        )}

        {/* ── Listings carousel ── */}
        {isAgent && activeTab === "listings" && (
          listings.length === 0
            ? <p className="px-6 sm:px-10 text-sm text-gray-400">No listings yet.</p>
            : (
              <div className="relative">
                {canScrollLeft && (
                  <button onClick={scrollCarouselLeft}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                )}
                <div ref={carouselRef} onScroll={checkScroll}
                  className="flex justify-center gap-5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-6 sm:px-10 pb-4">
                  {listings.map((listing) => (
                    <div key={listing.id} className="w-80 shrink-0">
                      <PropertyCard property={listing} coverImage={listing.coverImage} />
                    </div>
                  ))}
                </div>
                {canScrollRight && (
                  <button onClick={scrollCarouselRight}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                )}
              </div>
            )
        )}

        {/* ── Meetings list ── */}
        {isAgent && activeTab === "meetings" && (
          <div className="w-full">
            {/* Spinner */}
            {meetingsLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-gray-400 tracking-wide">Loading meetings…</p>
              </div>
            )}

            {/* Empty state */}
            {!meetingsLoading && meetingsList.length === 0 && (
              <p className="text-base text-gray-400 text-center py-10">No meetings yet.</p>
            )}

            {/* Meeting rows */}
            {!meetingsLoading && meetingsList.length > 0 && (
              <>
                <div>
                  {meetingsList.map((meeting) => {
                    const d = new Date(meeting.meetingDate);
                    const dateLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                    const timeLabel = formatHour(d.getHours());
                    return (
                      <div key={meeting.id} className="py-5 border-b border-gray-300 last:border-b-0 px-4 sm:px-6">
                        {/* Mobile: stacked */}
                        <div className="flex flex-col gap-2 lg:hidden">
                          <span className="text-base font-semibold text-indigo-600">{dateLabel} · {timeLabel}</span>
                          <span className="flex items-center gap-2 text-base font-medium text-gray-800">
                            <User className="w-4 h-4 text-gray-400 shrink-0" />{meeting.requesterUsername}
                          </span>
                          <span className="text-base font-medium text-gray-700">{meeting.propertyTitle}</span>
                          <span className="flex items-center gap-2 text-base text-gray-500">
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />{meeting.propertyAddress}
                          </span>
                          <span className="flex items-center gap-2 text-base text-gray-500">
                            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                            {meeting.requesterPhone ?? <span className="text-gray-300">—</span>}
                          </span>
                          <span className="flex items-center gap-2 text-base text-gray-500">
                            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                            {meeting.requesterEmail ?? <span className="text-gray-300">—</span>}
                          </span>
                        </div>
                        {/* Desktop: aligned grid */}
                        <div className="hidden lg:grid items-center mx-auto" style={{ gridTemplateColumns: "11rem 8rem 12rem 14rem 10rem 1fr", width: "fit-content", gap: "0 3rem" }}>
                          <span className="text-base font-semibold text-indigo-600 whitespace-nowrap">{dateLabel} · {timeLabel}</span>
                          <span className="flex items-center gap-2 text-base font-medium text-gray-800 truncate">
                            <User className="w-4 h-4 text-gray-400 shrink-0" />{meeting.requesterUsername}
                          </span>
                          <span className="text-base font-medium text-gray-700 truncate">{meeting.propertyTitle}</span>
                          <span className="flex items-center gap-2 text-base text-gray-500 truncate">
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />{meeting.propertyAddress}
                          </span>
                          <span className="flex items-center gap-2 text-base text-gray-500 whitespace-nowrap">
                            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                            {meeting.requesterPhone ?? <span className="text-gray-300">—</span>}
                          </span>
                          <span className="flex items-center gap-2 text-base text-gray-500 truncate">
                            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                            {meeting.requesterEmail ?? <span className="text-gray-300">—</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {meetingsTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => fetchMeetingsPage(meetingsPage - 1)}
                      disabled={meetingsPage === 1}
                      className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: meetingsTotalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => fetchMeetingsPage(p)}
                        className={[
                          "w-9 h-9 rounded-full text-sm font-semibold transition-colors",
                          p === meetingsPage
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "border border-gray-300 text-gray-600 hover:bg-gray-100",
                        ].join(" ")}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      onClick={() => fetchMeetingsPage(meetingsPage + 1)}
                      disabled={meetingsPage === meetingsTotalPages}
                      className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
