import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  variant?: "horizontal" | "icon-only";
}

export function Logo({
  size = "md",
  showText = true,
  className = "",
}: LogoProps) {
  const dimensions = {
    sm: {
      icon: 28,
      titleText: "text-lg",
      subtitleText: "text-[9px] tracking-[0.2em]",
      gap: "gap-2",
    },
    md: {
      icon: 36,
      titleText: "text-xl",
      subtitleText: "text-[10px] tracking-[0.25em]",
      gap: "gap-2.5",
    },
    lg: {
      icon: 46,
      titleText: "text-2xl",
      subtitleText: "text-xs tracking-[0.3em]",
      gap: "gap-3",
    },
  };

  const dim = dimensions[size];

  return (
    <div className={`flex items-center ${dim.gap} select-none ${className}`}>
      {/* FHD Store Teal Shopping Bag & Arrow Icon */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform hover:scale-105"
        style={{ width: dim.icon, height: dim.icon }}
      >
        <Image
          src="/logo.svg"
          alt="FHD Store Logo"
          width={dim.icon}
          height={dim.icon}
          className="object-contain w-full h-full"
          priority
        />
      </div>

      {/* FHD STORE Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-1">
            <span
              className={`font-black tracking-tight text-[#1E3A8A] dark:text-sky-400 ${dim.titleText}`}
              style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
            >
              FHD
            </span>
            <span
              className={`font-bold uppercase text-slate-500 dark:text-slate-400 ${dim.subtitleText}`}
              style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
            >
              STORE
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
