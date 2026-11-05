import type { Metadata } from "next";
import { BmoSahne } from "@/components/sahne/BmoSahne";
import { Ekran } from "@/components/sahne/Ekran";
import { Pil } from "@/components/sahne/Pil";
import { Not } from "@/components/sahne/Not";

export const metadata: Metadata = {
  title: "Yeni tasarım",
  robots: { index: false, follow: false },
};

export default function YeniPage() {
  return (
    <>
      {/* sahne sabit durur, sayfa onun üstünde kayar */}
      <div className="sahne-sabit">
        <BmoSahne />
      </div>

      <Ekran />
      <Pil />
      <Not />

      {/* kaydırma alanı — yüksekliği koreografinin uzunluğunu belirliyor */}
      <div className="kaydirma-alani" aria-hidden="true" />
    </>
  );
}
