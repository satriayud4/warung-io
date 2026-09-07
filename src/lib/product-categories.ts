export const PRODUCT_CATEGORIES = ["Makanan", "Minuman", "Snack", "Lainnya"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
