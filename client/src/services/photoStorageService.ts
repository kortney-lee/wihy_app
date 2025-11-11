interface PhotoRecord {
  id: string;
  filename: string;
  originalName: string;
  uploadDate: string;
  fileSize: number;
  mimeType: string;
  base64Data: string;
  searchQuery?: string;
  analysisResults?: string;
  userId?: string; // For multi-user support
  sessionId?: string; // For tracking user sessions
}

class PhotoStorageService {
  private storageKey = 'vhealth_photos';

  // Save photo silently in background
  async savePhoto(file: File, searchQuery?: string, userId?: string): Promise<string> {
    try {
      const photoId = this.generatePhotoId();
      const base64Data = await this.fileToBase64(file);
      
      const photoRecord: PhotoRecord = {
        id: photoId,
        filename: `photo_${photoId}`,
        originalName: file.name,
        uploadDate: new Date().toISOString(),
        fileSize: file.size,
        mimeType: file.type,
        base64Data,
        searchQuery,
        userId,
        sessionId: this.getSessionId()
      };

      // Save to localStorage (replace with API call for production)
      await this.saveToStorage(photoRecord);
      
      console.log('Photo saved silently for AI analysis:', photoId);
      return photoId;
    } catch (error) {
      console.error('Error saving photo:', error);
      throw new Error('Failed to save photo');
    }
  }

  // Update photo with AI analysis results
  async updatePhotoAnalysis(photoId: string, analysisResults: string): Promise<boolean> {
    try {
      const photos = await this.getAllPhotos();
      const photoIndex = photos.findIndex(photo => photo.id === photoId);
      
      if (photoIndex === -1) return false;
      
      photos[photoIndex].analysisResults = analysisResults;
      localStorage.setItem(this.storageKey, JSON.stringify(photos));
      console.log('AI analysis saved for photo:', photoId);
      return true;
    } catch (error) {
      console.error('Error updating photo analysis:', error);
      return false;
    }
  }

  // Get photos for AI processing (admin/backend use)
  async getAllPhotos(): Promise<PhotoRecord[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting photos:', error);
      return [];
    }
  }

  // Get photos by user for AI analysis
  async getPhotosByUser(userId: string): Promise<PhotoRecord[]> {
    try {
      const photos = await this.getAllPhotos();
      return photos.filter(photo => photo.userId === userId);
    } catch (error) {
      console.error('Error getting user photos:', error);
      return [];
    }
  }

  // Get photos that need AI analysis
  async getPhotosForAnalysis(): Promise<PhotoRecord[]> {
    try {
      const photos = await this.getAllPhotos();
      return photos.filter(photo => !photo.analysisResults);
    } catch (error) {
      console.error('Error getting photos for analysis:', error);
      return [];
    }
  }

  // Helper methods
  private generatePhotoId(): string {
    return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async saveToStorage(photoRecord: PhotoRecord): Promise<void> {
    const photos = await this.getAllPhotos();
    photos.push(photoRecord);
    localStorage.setItem(this.storageKey, JSON.stringify(photos));
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('vhealth_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('vhealth_session', sessionId);
    }
    return sessionId;
  }

  // For development/debugging - clean up old photos
  async cleanup(daysOld: number = 30): Promise<void> {
    try {
      const photos = await this.getAllPhotos();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const recentPhotos = photos.filter(photo => 
        new Date(photo.uploadDate) > cutoffDate
      );
      
      localStorage.setItem(this.storageKey, JSON.stringify(recentPhotos));
      console.log(`Cleaned up photos older than ${daysOld} days`);
    } catch (error) {
      console.error('Error cleaning up photos:', error);
    }
  }
}

export const photoStorageService = new PhotoStorageService();