import type { Metadata } from "next";
import { Sahne } from "@/components/sahne/Sahne";

export const metadata: Metadata = {
  title: "Yeni tasarım",
  robots: { index: false, follow: false },
};

export default function YeniPage() {
  return (
    <main style={{ position: "fixed", inset: 0 }}>
      <Sahne />
    </main>
  );
}
