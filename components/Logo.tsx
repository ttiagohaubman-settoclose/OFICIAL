"use client";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 220 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SetToClose"
    >
      {/* Corner brackets */}
      <path d="M4 4H16V8H8V16H4V4Z" fill="currentColor" />
      <path d="M204 4H216V16H212V8H204V4Z" fill="currentColor" />
      <path d="M4 44H16V40H8V32H4V44Z" fill="currentColor" />
      <path d="M204 44H216V32H212V40H204V44Z" fill="currentColor" />
      {/* Text */}
      <text
        x="110"
        y="33"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="22"
        fill="currentColor"
        letterSpacing="-0.5"
      >
        SetToClose
      </text>
    </svg>
  );
}
