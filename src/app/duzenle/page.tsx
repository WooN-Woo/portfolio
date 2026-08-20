import type { Metadata } from "next";
import Link from "next/link";
import { Editor } from "@/components/Editor";
import { content } from "@/content/site";

export const metadata: Metadata = {
  title: "İçerik",
  robots: { index: false, follow: false },
};

export default function DuzenlePage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <main className="shell ed-kapali">
        <h1 className="ed-kapali-baslik">Bu sayfa yalnızca kendi bilgisayarında açılır.</h1>
        <p>
          İçeriği düzenlemek için projeyi bilgisayarında çalıştır, sonra bu adrese dön.
        </p>
        <Link className="btn" href="/">
          Ana sayfaya dön
        </Link>
      </main>
    );
  }

  return <Editor baslangic={content} />;
}
