import type { Metadata } from "next";
import { BmoSahne } from "@/components/sahne/BmoSahne";
import { profile } from "@/content/site";

export const metadata: Metadata = {
  title: `Macera modu — ${profile.name}`,
  description:
    "Masadaki defteri karıştır, kartuşu BMO'ya tak, projeleri onun ekranında aç.",
};

export default function MaceraPage() {
  return <BmoSahne />;
}
