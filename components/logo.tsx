import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const dimensions = {
    sm: { icon: 28, text: "text-lg" },
    md: { icon: 34, text: "text-xl" },
    lg: { icon: 42, text: "text-2xl" },
  };

  const dim = dimensions[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative shrink-0 rounded-xl overflow-hidden shadow-md shadow-brand-500/20"
        style={{ width: dim.icon, height: dim.icon }}
      >
        <Image
          src="/logo.svg"
          alt="Shirt Bazaar Logo"
          width={dim.icon}
          height={dim.icon}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={`font-display font-extrabold tracking-tight gradient-text ${dim.text}`}>
          Shirt Bazaar.
        </span>
      )}
    </div>
  );
}
