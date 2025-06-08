import { supabase } from './supabaseConfig';

export interface MemeUpload {
    file: File;
    onProgress?: (progress: number) => void;
}

export interface MemeMetadata {
    id: string;
    url: string;
    created_at: string;
    name: string;
    type: string;
}

export class StorageService {
    private static BUCKET_NAME = 'memes';

    

    static async uploadMeme({ file, onProgress }: MemeUpload): Promise<MemeMetadata | null> {
        try {
            console.log('StorageService: Starting upload to bucket:', this.BUCKET_NAME);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            
            console.log('StorageService: Generated filename:', fileName);
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('StorageService: Upload error:', error);
                throw error;
            }

            console.log('StorageService: Upload successful, data:', data);

            // Simulate upload progress since Supabase doesn't provide it directly
            if (onProgress) {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    if (progress >= 100) {
                        clearInterval(interval);
                    }
                    onProgress(progress);
                }, 200);
            }

            // Genera signed URL válida por 1 semana
            const { data: signedUrlData } = await supabase.storage
                .from(this.BUCKET_NAME)
                .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 1 semana
            const url = signedUrlData?.signedUrl || '';

            return {
                id: data.path,
                url,
                created_at: new Date().toISOString(),
                name: file.name,
                type: file.type
            };
        } catch (error) {
            console.error('StorageService: Error in uploadMeme:', error);
            return null;
        }
    }

    static async getMemes(): Promise<MemeMetadata[]> {
        try {
            console.log('StorageService: Fetching memes from bucket:', this.BUCKET_NAME);
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .list();

            if (error) {
                console.error('StorageService: Error listing files:', error);
                throw error;
            }

            console.log('StorageService: Files found:', data);

            const memes = await Promise.all(
                data.map(async (item) => {
                    // Genera signed URL válida por 1 semana
                    const { data: signedUrlData } = await supabase.storage
                        .from(this.BUCKET_NAME)
                        .createSignedUrl(item.name, 60 * 60 * 24 * 7);
                    const url = signedUrlData?.signedUrl || '';

                    return {
                        id: item.id,
                        url,
                        created_at: item.created_at,
                        name: item.name,
                        type: item.metadata?.mimetype || 'image/jpeg'
                    };
                })
            );

            return memes.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        } catch (error) {
            console.error('StorageService: Error in getMemes:', error);
            return [];
        }
    }

    static async deleteMeme(id: string): Promise<boolean> {
        try {
            const { error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .remove([id]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting meme:', error);
            return false;
        }
    }
} 