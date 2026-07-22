export default function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="4.5" cy="10" r="2.5" stroke="#838C9C" strokeWidth="1.4" />
      <path d="M7 10H12.5" stroke="#838C9C" strokeWidth="1.4" />
      <circle cx="15" cy="10" r="4.2" fill="#E3B25A" />
      <path
        d="M13.2 10.1l1.3 1.3 2.4-2.7"
        stroke="#0D1014"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
