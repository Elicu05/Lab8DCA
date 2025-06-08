import { supabase } from './supabaseConfig';

export interface MediaFileUpload {
    file: File;
    onProgress?: (progress: number) => void;
}

export interface MediaFileMetadata {
    id: string;
    url: string;
    created_at: string;
    name: string;
    type: string;
}

export class MediaStorageService {
    private static STORAGE_BUCKET = 'memes';

    static async uploadMediaFile({ file, onProgress }: MediaFileUpload): Promise<MediaFileMetadata | null> {
        try {
            console.log('MediaStorageService: Starting upload to bucket:', this.STORAGE_BUCKET);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            
            console.log('MediaStorageService: Generated filename:', fileName);
            const { data, error } = await supabase.storage
                .from(this.STORAGE_BUCKET)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('MediaStorageService: Upload error:', error);
                throw error;
            }

            console.log('MediaStorageService: Upload successful, data:', data);

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

            const { data: signedUrlData } = await supabase.storage
                .from(this.STORAGE_BUCKET)
                .createSignedUrl(fileName, 60 * 60 * 24 * 7);
            const url = signedUrlData?.signedUrl || '';

            return {
                id: data.path,
                url,
                created_at: new Date().toISOString(),
                name: file.name,
                type: file.type
            };
        } catch (error) {
            console.error('MediaStorageService: Error in uploadMediaFile:', error);
            return null;
        }
    }

    static async getAllMediaFiles(): Promise<MediaFileMetadata[]> {
        try {
            console.log('MediaStorageService: Fetching files from bucket:', this.STORAGE_BUCKET);
            const { data, error } = await supabase.storage
                .from(this.STORAGE_BUCKET)
                .list();

            if (error) {
                console.error('MediaStorageService: Error listing files:', error);
                throw error;
            }

            console.log('MediaStorageService: Files found:', data);

            const mediaFiles = await Promise.all(
                data.map(async (item) => {
                    const { data: signedUrlData } = await supabase.storage
                        .from(this.STORAGE_BUCKET)
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

            return mediaFiles.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        } catch (error) {
            console.error('MediaStorageService: Error in getAllMediaFiles:', error);
            return [];
        }
    }

    static async deleteMediaFile(id: string): Promise<boolean> {
        try {
            const { error } = await supabase.storage
                .from(this.STORAGE_BUCKET)
                .remove([id]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting media file:', error);
            return false;
        }
    }
} 