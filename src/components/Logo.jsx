export default function Logo({ size = 28 }) {
  return (
    <img
      src="/filepilot-logo.png"
      alt="Filepilot logo"
      width={size}
      height={size}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}
