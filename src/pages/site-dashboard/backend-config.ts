export const BACKEND_URL = 'https://trade-with-hunna-bot-b.onrender.com';

export interface Bot {
    id: string;
    name: string;
    description: string;
    image_url: string;
    bot_file_url: string;
    bot_file_name: string;
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

export interface UserSession {
    login_id: string;
    started_at: string;
    last_seen_at: string;
    ended_at: string | null;
    ip_address: string;
    user_agent: string;
    status?: 'active' | 'idle' | 'ended';
}
