"use client";

import { useEffect } from "react";

export default function NavbarScroll() {
  useEffect(() => {
    const nav = document.querySelector(".navbar");

    const handleScroll = () => {
      if (window.scrollY > 20) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
}
