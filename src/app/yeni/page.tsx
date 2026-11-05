import type { Metadata } from "next";
import { BmoSahne } from "@/components/sahne/BmoSahne";
import { Pil } from "@/components/sahne/Pil";

export const metadata: Metadata = {
  title: "Yeni tasarım",
  robots: { index: false, follow: false },
};

export default function YeniPage() {
  return (
    <>
      <BmoSahne />
      <Pil />
    </>
  );
}
