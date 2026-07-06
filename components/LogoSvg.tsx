const LogoSvg = ({ size = 32 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 600 600"
    style={{ borderRadius: "8px", flexShrink: 0 }}
    aria-hidden
  >
    <rect width="600" height="600" rx="125" ry="125" fill="#0A0A0F" />
    <svg
      x="75"
      y="75"
      width="450"
      height="450"
      viewBox="0 0 24 24"
      fill="#0A0A0F"
      stroke="#2D6FFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  </svg>
);

export default LogoSvg;
