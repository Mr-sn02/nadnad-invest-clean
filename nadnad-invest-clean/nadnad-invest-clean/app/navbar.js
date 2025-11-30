// app/navbar.js
"use client";

import { useEffect } from "react";

/**
 * NavbarScroll
 * Komponen kecil untuk menambahkan class "scrolled" ke elemen .navbar
 * saat halaman di-scroll. Dipakai oleh UI Dompet Nadnad.
 */
export default function NavbarScroll() {
  useEffect(() => {
    const nav = document.querySelector(".navbar");
    if (!nav) return;

    const handleScroll = () => {
      if (window.scrollY > 20) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
}
