// Connection URLs with fallbacks
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/leaderboard';

export interface Bug {
  id: string;
  titleDefault: string;
  descriptionDefault: string;
}

export const BUGS: Record<string, Bug> = {
  bug_price: {
    id: "bug_price",
    titleDefault: "Negative Price on Moto G Power",
    descriptionDefault: "The Moto G Power is listed in the catalog with a negative price of -$999.00."
  },
  bug_layout: {
    id: "bug_layout",
    titleDefault: "Overlapping Checkout Button",
    descriptionDefault: "The main checkout button in the cart drawer overlaps the total amount text, making it unreadable."
  },
  bug_loop: {
    id: "bug_loop",
    titleDefault: "Quantity Reset Loop",
    descriptionDefault: "Increasing the product quantity inside the shopping cart resets the quantity back to zero, preventing checkout."
  },
  bug_text: {
    id: "bug_text",
    titleDefault: "Broken Raw HTML in Razr Description",
    descriptionDefault: "The Motorola Razr description shows raw HTML tags and corrupted characters instead of styled text."
  },
  bug_filter: {
    id: "bug_filter",
    titleDefault: "Blank Screen Category Filter",
    descriptionDefault: "Selecting the 'Accessories' category filter empties the entire store view, displaying a completely blank catalog page."
  }
};

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: "premium" | "intermediate" | "accessories";
  description: string;
  specs?: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: "moto_razr",
    name: "Motorola Razr 50 Ultra",
    price: 999.99,
    originalPrice: 1099.99,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", // generic fallback mobile phone image
    category: "premium",
    // BUG_TEXT is embedded here
    description: "Experience the absolute peak of pocketable design with a massive external screen. <div class='text-red-500 font-bold'><script>alert('corrupted')</script></div> &Aacute;  Ultra-fast 165Hz Refresh Rate.",
    specs: ["12GB RAM", "512GB Storage", "50MP Dual Camera"]
  },
  {
    id: "moto_edge_pro",
    name: "Motorola Edge 50 Ultra",
    price: 849.00,
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "premium",
    description: "Blurring the line between art and technology. Pantone certified colors and premium vegan leather backing.",
    specs: ["16GB RAM", "1TB Storage", "64MP Periscope Zoom"]
  },
  {
    id: "moto_g_power",
    name: "Moto G Power 5G (2026)",
    // BUG_PRICE is embedded here: it should be -999.00
    price: -999.00,
    originalPrice: 299.99,
    image: "https://images.unsplash.com/photo-1565630916779-e303be97b6f5?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "intermediate",
    description: "Incredible two-day battery life with blazing fast 5G connectivity. Now with a beautiful leather-like finish.",
    specs: ["8GB RAM", "128GB Storage", "5000mAh Battery"]
  },
  {
    id: "moto_g_stylus",
    name: "Moto G Stylus 5G",
    price: 349.99,
    image: "https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "intermediate",
    description: "Express your creativity with the built-in stylus. Perfect for sketch notes, precision edits, and seamless navigation.",
    specs: ["8GB RAM", "256GB Storage", "Built-in Stylus"]
  },
  {
    id: "moto_buds",
    name: "Moto Buds+ (Bose Sound)",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "accessories",
    description: "Premium earbuds co-created with Bose. High-res audio with Active Noise Cancellation and Dolby Atmos support.",
    specs: ["Bose Sound Tuning", "Hi-Res Audio", "Dolby Atmos Tracking"]
  },
  {
    id: "moto_charger",
    name: "TurboPower 125W Charger",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1622445262465-2481c4574875?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "accessories",
    description: "Unbelievably fast charging speeds. Charges your compatible Motorola device to 100% in under 20 minutes.",
    specs: ["125W Max Output", "USB-C PD 3.0", "Overheat Protection"]
  }
];
