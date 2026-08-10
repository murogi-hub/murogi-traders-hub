export const BACKEND_URL = 'https://trade-with-hunna-bot-b.onrender.com';

export interface Bot {
    id: string;
    name: string;
    description: string;
    image_url: string;
    display_order: number;
    is_active: boolean;
}

export interface SiteSettings {
    id: number;
    logo_url: string;
    color_bg: string;
    color_accent: string;
    color_primary: string;
}
