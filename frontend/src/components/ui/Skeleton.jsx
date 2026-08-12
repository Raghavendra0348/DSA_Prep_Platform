export default function Skeleton({ width = '100%', height = 16, count = 1, style = {} }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            width,
            height,
            marginBottom: count > 1 ? 8 : 0,
            ...style,
          }}
        />
      ))}
    </>
  );
}
