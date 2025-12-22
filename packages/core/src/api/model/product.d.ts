import { Message } from "./message";
export interface CustomProduct {
    name: string;
    description: string;
    priceAmount1000: number;
    currency: string;
    url?: string;
}
export interface CartItem {
    id: string;
    name: string;
    qty: number;
    thumbnailId: string;
    thumbnailUrl: string;
}
export interface Product {
    id: string;
    isHidden?: boolean;
    catalogWid?: string;
    url?: string;
    name?: string;
    description?: string;
    availability?: number | "unknown";
    reviewStatus?: "NO_REVIEW" | "PENDING" | "REJECTED" | "APPROVED" | "OUTDATED";
    imageCdnUrl?: string;
    imageCount?: number;
    additionalImageCdnUrl?: string[];
    priceAmount1000?: number;
    retailerId?: string;
    t?: number;
    currency: string;
}
export interface Order {
    id: string;
    createdAt: number;
    currency: string;
    products: CartItem[];
    sellerJid: string;
    subtotal: `${number}`;
    total: `${number}`;
    message?: Message;
}
//# sourceMappingURL=product.d.ts.map