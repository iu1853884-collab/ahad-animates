export type ProjectFilterCategory = string;

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  filterCategory: string;
  image: string;
  imageAlt: string;
  url: string;
  videoUrl?: string | null;
  featured?: boolean;
  isPlaceholder?: boolean;
  statusBadge?: string;
  tags: string[];
}

export interface ServiceItem {
  number: string;
  iconName:
    | "Compass"
    | "Lightbulb"
    | "Boxes"
    | "Package"
    | "Sparkles"
    | "Megaphone"
    | "ShoppingBag"
    | "WandSparkles";
  title: string;
  description: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  projectType: string;
  message: string;
}
