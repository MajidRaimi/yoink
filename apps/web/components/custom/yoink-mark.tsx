type YoinkMarkProps = {
  className?: string;
};

export const YoinkMark = ({ className }: YoinkMarkProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path
      transform="matrix(0.014826 0 0 -0.014826 2.3855 21.8369)"
      d="M424 0V422L-26 1327H408L867 391V0ZM895 484 680 920 898 1327H1323Z"
    />
  </svg>
);
