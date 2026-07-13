import React from "react";

// Fills its parent (100% × 100%). The parent controls size, border-radius,
// border and overflow — Avatar only decides photo-vs-initials.
export default function Avatar({
  image,
  name,
  fontSize,
}: {
  image: string | null;
  name: string | null;
  fontSize: number;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={name ?? "Guide"}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  }
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(150deg, var(--rihla-pine, #054239), var(--rihla-wine-dark, #4a151e))",
        color: "var(--rihla-cream, #edebe0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--rihla-font-display, Georgia, serif)",
        fontWeight: 500,
        fontSize,
      }}
    >
      {name ? name.substring(0, 1).toUpperCase() : "R"}
    </div>
  );
}
