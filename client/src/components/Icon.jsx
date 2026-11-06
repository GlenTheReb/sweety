const paths = {
  add: "M12 5v14M5 12h14",
  previous: "m15 6-6 6 6 6",
  next: "m9 6 6 6-6 6",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z",
  logout: "M9 4H4v16h5M10 12h11m-4-4 4 4-4 4",
  arrow: "M6 18 18 6M6 6h12v12",
};
export default function Icon({ name }) {
  return (
    <svg
      className="ui-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
