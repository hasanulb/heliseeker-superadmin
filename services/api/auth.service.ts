import { Supabase } from "./util";
import { api } from "./http";

export class AuthService extends Supabase {
    async userExist(email: string) {
        // Call backend API to check if the user exists
        await api.get<boolean>(`/api/auth/user-exists?email=${encodeURIComponent(email)}`);
        return true;
    }

    async login({ email, password }: { email: string; password: string }) {
        // Delegate to backend API
        return await api.post(`/api/auth/login`, { email, password });
    }

    async logout() {
        return await api.post(`/api/auth/logout`);
    }

    async getProfile() {
        return await api.get(`/api/auth/profile`);
    }

    async updateProfile(updates: { name?: string; email?: string; img?: string }) {
        return await api.patch(`/api/auth/profile`, updates);
    }

    async uploadProfileImage(file: File): Promise<string> {
        await this.supabase.auth.getUser();
        const fileExt = file.name?.split('.').pop();
        const fileName = `profile_images/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const { data, error } = await this.supabase
            .storage
            .from('assets')
            .upload(fileName, file, { contentType: file.type });
        if (error) throw new Error("Failed to upload image");
        return data?.path;
    }
}