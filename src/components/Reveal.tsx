"use client";

import { useEffect, useRef, useState } from "react";
import { gecikme } from "@/lib/anim";

/** Bir öğe ekrana girdiğinde true döner; girdikten sonra izlemeyi bırakır. */
export function useGorunur<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [gorunur, setGorunur] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const gozlemci = new IntersectionObserver(
      (kayitlar) => {
        for (const kayit of kayitlar) {
          if (kayit.isIntersecting) {
            setGorunur(true);
            gozlemci.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    gozlemci.observe(node);
    return () => gozlemci.disconnect();
  }, []);

  return { ref, gorunur };
}

/** İçeriği ekrana girdiğinde yumuşakça gösterir. */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "section" | "header" | "li" | "article";
  className?: string;
}) {
  const { ref, gorunur } = useGorunur<HTMLElement>();

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`.trim()}
      data-shown={gorunur}
      style={gecikme(delay)}
    >
      {children}
    </Tag>
  );
}
