import ReactGA from "react-ga4";

let isInitialized = false;

export const initAnalytics = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) {
    console.warn("Analytics not initialized: VITE_GA_MEASUREMENT_ID is missing.");
    return;
  }
  
  if (!isInitialized) {
    ReactGA.initialize(measurementId);
    isInitialized = true;
  }
};

export const trackPageView = (path: string) => {
  if (isInitialized) {
    ReactGA.send({ hitType: "pageview", page: path });
  }
};

export const trackEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (isInitialized) {
    ReactGA.event(eventName, params);
  }
};
