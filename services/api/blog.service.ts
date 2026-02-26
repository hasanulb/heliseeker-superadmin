import { Supabase } from "./util";
import { api } from "./http";

export class BlogService extends Supabase {
    constructor() {
        super();
    }

    private async convertToWebP(file: File): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onloadend = () => {
                img.src = reader.result as string;
            };

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject("Canvas context not available");

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Convert image to WebP
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob); // Return the WebP image as Blob
                        } else {
                            reject('Error converting image to WebP');
                        }
                    },
                    'image/webp',
                    0.85 // quality setting (0 to 1)
                );
            };

            img.onerror = (error) => {
                reject('Error loading image');
            };

            reader.onerror = () => {
                reject('Error reading file');
            };

            reader.readAsDataURL(file);
        });
    }

    private async checkAuth(): Promise<boolean> {
        const { session } = (await this.supabase.auth.getSession()).data;
        return !!session?.access_token;
    }

    private async ensureAuthenticated() {
        const isAuthenticated = await this.checkAuth();
        if (!isAuthenticated) {
            throw new Error('Authentication required. Please log in.');
        }
    }

    async createBlog(data: any) {
        return await api.post(`/api/blogs`, data);
    }

    async updateBlog(id: string, data: any) {
        return await api.patch(`/api/blogs/${id}`, data);
    }

    async deleteBlog(id: string) {
        return await api.delete<{ id: string }>(`/api/blogs/${id}`);
    }

    async getBlog(id: string) {
        return await api.get(`/api/blogs/${id}`);
    }

    async getBlogs({ search = "", status = "", page = 1, pageSize = 10, sort = { field: "published_at", dir: "desc" } }) {
        const params = new URLSearchParams({
            search,
            status,
            page: String(page),
            pageSize: String(pageSize),
            sortField: String(sort.field),
            sortDir: String(sort.dir),
        });
        return await api.get<{ data: any[]; count: number }>(`/api/blogs?${params.toString()}`);
    }

    async uploadImages(files: File[]): Promise<string[]> {
        await this.ensureAuthenticated();

        const uploadedPaths: string[] = [];

        for (const file of files) {
            const fileName = `blog_images/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webp`;  // Always save as .webp

            try {
                // Convert the image to WebP
                const webpBlob = await this.convertToWebP(file);

                // Upload the WebP image to Supabase Storage
                const { data, error } = await this.supabase
                    .storage
                    .from('assets')
                    .upload(fileName, webpBlob, { contentType: 'image/webp' });

                if (error) {
                    throw new Error(`Failed to upload image: ${error.message}`);
                }

                uploadedPaths.push(data?.path);
            } catch (error) {
                console.error(`Error processing ${file.name}`);
                // Handle the error (e.g., skip the file or notify the user)
            }
        }

        return uploadedPaths;
    }
}