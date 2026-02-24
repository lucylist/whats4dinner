interface IconProps {
  className?: string;
}

export function CalendarLeafIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="3" y1="9" x2="18" y2="9" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7.5" y1="3" x2="7.5" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13.5" y1="3" x2="13.5" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="12.5" r="0.9" fill="currentColor" opacity="0.5" />
      <circle cx="10.5" cy="12.5" r="0.9" fill="currentColor" opacity="0.5" />
      <circle cx="14" cy="12.5" r="0.9" fill="currentColor" opacity="0.5" />
      <circle cx="7" cy="16" r="0.9" fill="currentColor" opacity="0.5" />
      <circle cx="10.5" cy="16" r="0.9" fill="currentColor" opacity="0.5" />
      {/* Leaf sprig from top-right */}
      <path d="M17.5 4C19 2.8 21.5 2.5 22.5 3C21.5 3.8 19.5 3.8 17.5 4Z" fill="currentColor" opacity="0.55" />
      <path d="M18.5 5.2C20.2 4.2 22.2 4.8 22.5 5.8C21 5.6 19.5 5.5 18.5 5.2Z" fill="currentColor" opacity="0.4" />
      <path d="M17.5 4L19 5.8" stroke="currentColor" strokeWidth="0.5" opacity="0.45" />
    </svg>
  );
}

export function RecipesFlowerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Chef hat puff */}
      <path
        d="M6.5 12C4.5 12 3 10.5 3 8.8C3 7 5 5.5 7 6.2C7.2 4 9.2 2.8 11.2 3.2C12 2.2 13.5 1.8 15 2.5C16.5 1.8 18.5 2.8 18.5 4.8C20.2 4.5 22 6 21.5 8C21.8 9.5 21 11.5 18.5 12"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Hat body */}
      <path d="M6.5 12V16.5C6.5 17.3 7.2 18 8 18H17C17.8 18 18.5 17.3 18.5 16.5V12" stroke="currentColor" strokeWidth="1.4" />
      <line x1="6.5" y1="18" x2="18.5" y2="18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* Small flower left */}
      <circle cx="4.2" cy="19.5" r="0.7" fill="currentColor" opacity="0.5" />
      <circle cx="3.3" cy="18.9" r="0.5" fill="currentColor" opacity="0.3" />
      <circle cx="3.5" cy="20.2" r="0.5" fill="currentColor" opacity="0.3" />
      <circle cx="5" cy="19" r="0.5" fill="currentColor" opacity="0.3" />
      <circle cx="4.8" cy="20.2" r="0.5" fill="currentColor" opacity="0.3" />
      {/* Tiny leaf near left flower */}
      <path d="M2.8 18C2.3 17 3.2 16.8 3.5 17.5" stroke="currentColor" strokeWidth="0.4" opacity="0.35" />
      {/* Small flower right */}
      <circle cx="20.8" cy="19.5" r="0.7" fill="currentColor" opacity="0.5" />
      <circle cx="20" cy="18.9" r="0.5" fill="currentColor" opacity="0.3" />
      <circle cx="20" cy="20.2" r="0.5" fill="currentColor" opacity="0.3" />
      <circle cx="21.6" cy="19" r="0.5" fill="currentColor" opacity="0.3" />
      <circle cx="21.5" cy="20.2" r="0.5" fill="currentColor" opacity="0.3" />
      {/* Tiny leaf near right flower */}
      <path d="M22.2 18C22.7 17 21.8 16.8 21.5 17.5" stroke="currentColor" strokeWidth="0.4" opacity="0.35" />
    </svg>
  );
}

export function PlanHerbIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Slider bars */}
      <line x1="3" y1="8" x2="19" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="16" r="2" stroke="currentColor" strokeWidth="1.5" />
      {/* Rosemary sprig along right edge */}
      <path d="M22 4.5V20" stroke="currentColor" strokeWidth="0.5" opacity="0.4" strokeLinecap="round" />
      <path d="M22 6.5C23 5.8 23.8 6.2 23.2 7C22.7 6.8 22 6.5 22 6.5Z" fill="currentColor" opacity="0.35" />
      <path d="M22 9C23 8.3 23.8 8.7 23.2 9.5C22.7 9.3 22 9 22 9Z" fill="currentColor" opacity="0.35" />
      <path d="M22 11.5C23 10.8 23.8 11.2 23.2 12C22.7 11.8 22 11.5 22 11.5Z" fill="currentColor" opacity="0.35" />
      <path d="M22 14C23 13.3 23.8 13.7 23.2 14.5C22.7 14.3 22 14 22 14Z" fill="currentColor" opacity="0.35" />
      <path d="M22 16.5C23 15.8 23.8 16.2 23.2 17C22.7 16.8 22 16.5 22 16.5Z" fill="currentColor" opacity="0.35" />
      <path d="M22 7.5C21 6.8 20.2 7.2 20.8 8C21.3 7.8 22 7.5 22 7.5Z" fill="currentColor" opacity="0.35" />
      <path d="M22 10C21 9.3 20.2 9.7 20.8 10.5C21.3 10.3 22 10 22 10Z" fill="currentColor" opacity="0.35" />
      <path d="M22 12.5C21 11.8 20.2 12.2 20.8 13C21.3 12.8 22 12.5 22 12.5Z" fill="currentColor" opacity="0.35" />
      <path d="M22 15C21 14.3 20.2 14.7 20.8 15.5C21.3 15.3 22 15 22 15Z" fill="currentColor" opacity="0.35" />
      <path d="M22 17.5C21 16.8 20.2 17.2 20.8 18C21.3 17.8 22 17.5 22 17.5Z" fill="currentColor" opacity="0.35" />
    </svg>
  );
}
