import type { ComponentType } from "react";
import type { FeatureIconName, SocialIconName } from "@/content/homepage";
import type { WhyChooseIconName } from "@/content/about";

// Shared inline SVG icons (feather-style strokes) sized via className.

export interface IconProps {
  className?: string;
}

function StrokeIcon({
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </StrokeIcon>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </StrokeIcon>
  );
}

export function IconClose(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </StrokeIcon>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <polyline points="6 9 12 15 18 9" />
    </StrokeIcon>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </StrokeIcon>
  );
}

export function IconUser(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </StrokeIcon>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </StrokeIcon>
  );
}

export function IconCart(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </StrokeIcon>
  );
}

export function IconPin(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </StrokeIcon>
  );
}

export function IconClock(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </StrokeIcon>
  );
}

export function IconTag(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </StrokeIcon>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </StrokeIcon>
  );
}

export function IconChat(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </StrokeIcon>
  );
}

export function IconSend(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </StrokeIcon>
  );
}

export function IconLeaf(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </StrokeIcon>
  );
}

export function IconStar(props: IconProps) {
  return (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
    </svg>
  );
}

function IconCreditCard(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </StrokeIcon>
  );
}

function IconPackage(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </StrokeIcon>
  );
}

function IconAward(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </StrokeIcon>
  );
}

export function IconTruck(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </StrokeIcon>
  );
}

export function IconRefreshCcw(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <polyline points="1 4 1 10 7 10" />
      <polyline points="23 20 23 14 17 14" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </StrokeIcon>
  );
}

export function IconPercent(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </StrokeIcon>
  );
}

export function IconShieldCheck(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </StrokeIcon>
  );
}

export function IconWhatsApp(props: IconProps) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.9 11.9L4 20l4.2-1.1a7.9 7.9 0 0 0 3.85 1h0a7.94 7.94 0 0 0 5.55-13.58zM12.05 18.53h0a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.5.66.67-2.43-.16-.25a6.6 6.6 0 0 1 10.2-8.3 6.55 6.55 0 0 1 1.94 4.67 6.6 6.6 0 0 1-6.55 6.6zm3.6-4.94c-.2-.1-1.17-.58-1.35-.64-.18-.07-.31-.1-.44.1-.13.2-.5.63-.62.76-.11.13-.23.14-.42.05-.2-.1-.83-.3-1.58-.97a5.9 5.9 0 0 1-1.1-1.36c-.11-.2 0-.3.09-.4.09-.1.2-.24.3-.36.1-.12.13-.2.2-.33.06-.13.03-.25-.02-.35-.05-.1-.44-1.06-.6-1.45-.16-.38-.32-.33-.44-.34h-.38c-.13 0-.34.05-.52.25-.18.2-.68.67-.68 1.62s.7 1.88.8 2.01c.1.13 1.38 2.1 3.34 2.95.47.2.83.32 1.12.41.47.15.9.13 1.24.08.38-.06 1.17-.48 1.33-.94.17-.46.17-.86.12-.94-.05-.09-.18-.14-.38-.24z" />
    </svg>
  );
}

// Traced from /public/cart_icon.svg (the client-supplied asset) so it can be
// rendered inline and take `currentColor` — an <img>/next/image reference to
// the file can't be recolored via CSS, which is why the button rendered it
// black regardless of the button's white text. Deliberately a separate
// component from IconCart above (the header's cart icon uses that one) so
// this only affects the Add to Cart button.
export function IconCartSolid(props: IconProps) {
  return (
    <svg
      className={props.className}
      viewBox="0 0 275.58 274.53"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M254.59,170.49c-3.49,15.75-17.25,29.27-33.73,29.26l-128.98-.05c-17.07,0-30.23-14.36-33.6-30.08L27.3,24.95l-16.56-.1C4.1,24.82-.51,17.44.05,11.66.66,5.29,5.94.1,12.84.08l24.06-.08c6.23.09,11.54,4,12.88,10.23l11.22,52.27,201.3.02c7.55,0,14.74,6.57,13.02,14.31l-20.73,93.66ZM217.32,175.02c6.51,0,11.54-3.9,12.86-9.87l17.18-77.6H66.35s16.55,77.24,16.55,77.24c1.31,6.11,5.8,9.84,12.15,10.23h122.27Z" />
      <circle cx="86.85" cy="249.52" r="25.01" />
      <circle cx="224.35" cy="249.53" r="25" />
    </svg>
  );
}

function IconFacebook(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </StrokeIcon>
  );
}

function IconInstagram(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </StrokeIcon>
  );
}

export const featureIcons: Record<FeatureIconName, ComponentType<IconProps>> = {
  payment: IconCreditCard,
  stocks: IconPackage,
  quality: IconAward,
  delivery: IconTruck,
  price: IconTag,
  returns: IconRefreshCcw,
  support: IconChat,
  deals: IconPercent,
  whatsapp: IconWhatsApp,
};

export const whyChooseIcons: Record<WhyChooseIconName, ComponentType<IconProps>> = {
  organic: IconLeaf,
  delivery: IconTruck,
  trust: IconShieldCheck,
};

export const socialIcons: Record<SocialIconName, ComponentType<IconProps>> = {
  facebook: IconFacebook,
  instagram: IconInstagram,
};
