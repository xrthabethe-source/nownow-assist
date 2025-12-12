import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
}

export const TyreIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const BatteryIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <rect x="2" y="7" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M20 11H22V15H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 11V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M5 13H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M13 13H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const FuelIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <path
      d="M4 22V6C4 4.89543 4.89543 4 6 4H14C15.1046 4 16 4.89543 16 6V22"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M4 22H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <rect x="6" y="8" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="2" />
    <path
      d="M16 10L18 8C18.5523 7.44772 19 7 20 7V7C21 7 21 8 21 9V16C21 17 20 18 19 18C18 18 18 17 18 16V14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const PumpIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <ellipse cx="12" cy="18" rx="8" ry="3" stroke="currentColor" strokeWidth="2" />
    <path d="M4 18V12C4 9.79086 7.58172 8 12 8C16.4183 8 20 9.79086 20 12V18" stroke="currentColor" strokeWidth="2" />
    <path d="M12 8V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="14" r="2" fill="currentColor" />
  </svg>
);

export const MapPinIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <path
      d="M12 21C12 21 19 14.5 19 9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9C5 14.5 12 21 12 21Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const WrenchIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <path
      d="M14.7 6.3C14.3 5.1 13.2 4.2 11.9 4C10.1 3.8 8.4 4.9 7.8 6.6C7.4 7.8 7.6 9.1 8.4 10.1L3.7 14.8C3.3 15.2 3 15.8 3 16.5C3 17.9 4.1 19 5.5 19C6.2 19 6.8 18.7 7.2 18.3L11.9 13.6C12.9 14.4 14.2 14.6 15.4 14.2C17.1 13.6 18.2 11.9 18 10.1C17.8 8.8 16.9 7.7 15.7 7.3L13 10L12 9L14.7 6.3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CarIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <path
      d="M5 11L6.5 6.5C6.8 5.6 7.7 5 8.6 5H15.4C16.3 5 17.2 5.6 17.5 6.5L19 11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect x="3" y="11" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
    <circle cx="7" cy="15" r="1.5" fill="currentColor" />
    <circle cx="17" cy="15" r="1.5" fill="currentColor" />
  </svg>
);
