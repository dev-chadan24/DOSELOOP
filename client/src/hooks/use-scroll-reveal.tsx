import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Global scroll-reveal. Any element marked with `data-reveal` smoothly fades and
 * rises into view as it enters the viewport. Re-scans on every route change so
 * navigating between features replays the entrance animation.
 */
export function ScrollReveal() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (reduceMotion) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    // Reset state on route change so the animation replays for the new view.
    elements.forEach((el) => el.classList.remove("is-visible"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    // Use a microtask so freshly-mounted route content is in the DOM.
    const id = window.requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => observer.observe(el));
    });

    return () => {
      window.cancelAnimationFrame(id);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
