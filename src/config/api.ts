
// API Configuration

export const SMS_API_CONFIG = {
  BASE_URL: "https://customer.smsprovider.com.ng/api/",
  USERNAME: import.meta.env.VITE_SMS_API_USERNAME || "DEMO_USERNAME",
  PASSWORD: import.meta.env.VITE_SMS_API_PASSWORD || "DEMO_PASSWORD",
};

export const WP_API_CONFIG = {
  BASE_URL: import.meta.env.VITE_WP_API_URL || "https://your-wordpress-site.com/wp-json/",
  USERNAME: import.meta.env.VITE_WP_API_USERNAME || "DEMO_WP_USER",
  PASSWORD: import.meta.env.VITE_WP_API_PASSWORD || "DEMO_WP_PASS",
};
