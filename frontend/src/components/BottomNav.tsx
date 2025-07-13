// src/components/BottomNav.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Home, User, ShoppingCart, Shirt } from "lucide-react";

// ícones customizados
const HangerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 16L12 10 4 16" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    <path d="M12 10V6a2 2 0 1 1 4 0" />
  </svg>
);
const MannequinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="4" r="2" />
    <path d="M10 8h4l2 4-2 4h-4l-2-4 2-4Z" />
    <path d="M12 16v4" />
    <path d="M9 20h6" />
  </svg>
);
const MarketplaceIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <ShoppingCart {...props} />
);

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/roupas", icon: HangerIcon, label: "Roupas" },
  { to: "/marketplace", icon: MarketplaceIcon, label: "Marketplace" },
  { to: "/outfits", icon: Shirt, label: "Outfits" },
  { to: "/profile", icon: User, label: "Perfil" },
];

export function BottomNav() {
  return (
    <>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="aziraGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A02CFF" />
            <stop offset="50%" stopColor="#FF2DAF" />
            <stop offset="100%" stopColor="#FF6D00" />
          </linearGradient>
        </defs>
      </svg>
      <nav className="fixed bottom-0 z-50 w-full bg-white border-t border-gray-200 flex justify-around py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className="flex flex-col items-center justify-center px-2"
          >
            {({ isActive }) => (
              <>
                <Icon
                  stroke={isActive ? "url(#aziraGradient)" : "currentColor"}
                  className={`w-5 h-5 mb-1 ${
                    isActive ? "" : "text-gray-500 hover:text-gray-700"
                  }`}
                />
                <span
                  className={`text-xs ${
                    isActive
                      ? "text-transparent bg-clip-text bg-gradient-to-br from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
