import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TimelineService from './TimelineService';

export interface Photo {
  id: string;
  uri: string;
  width: number;
  height: number;
  timestamp: number;
  caption?: string;
  userId: string;
}

export interface PhotoResult {
  success: boolean;
  error?: string;
  photo?: Photo;
}

class PhotoService {
  private readonly STORAGE_KEY = 'onlyyou_photos';
  private readonly PHOTOS_DIR = `${FileSystem.documentDirectory}onlyyou/photos/`;

  constructor() {
    // Ensure photos directory exists
    if (Platform.OS !== 'web') {
      this.ensurePhotosDirectory();
    }
  }

  private async ensurePhotosDirectory(): Promise<void> {
    if (Platform.OS === 'web') {
      return; // Skip directory creation on web
    }
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.PHOTOS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.PHOTOS_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to create photos directory:', error);
    }
  }

  // Pick and save photo
  public async pickAndSave(caption?: string): Promise<PhotoResult> {
    if (Platform.OS === 'web') {
      return {
        success: false,
        error: 'Chức năng chọn ảnh không khả dụng trên web',
      };
    }

    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        return {
          success: false,
          error: 'Cần quyền truy cập thư viện ảnh để chọn ảnh',
        };
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled) {
        return {
          success: false,
          error: 'Đã hủy chọn ảnh',
        };
      }

      const asset = result.assets[0];
      const timestamp = Date.now();
      const filename = `photo_${timestamp}.jpg`;
      const localUri = `${this.PHOTOS_DIR}${filename}`;

      // Copy file to local directory
      await FileSystem.copyAsync({
        from: asset.uri,
        to: localUri,
      });

      // Create photo object
      const photo: Photo = {
        id: `photo_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        uri: localUri,
        width: asset.width,
        height: asset.height,
        timestamp,
        caption: caption?.trim(),
        userId: 'current_user',
      };

      // Save to storage
      await this.savePhoto(photo);

      // Add to timeline
      await TimelineService.addEvent({
        id: photo.id,
        type: 'photo',
        timestamp: photo.timestamp,
        data: {
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          caption: photo.caption,
        },
        userId: photo.userId,
      });

      console.log('Photo saved:', photo.id);

      return {
        success: true,
        photo,
      };
    } catch (error) {
      console.error('Failed to pick and save photo:', error);
      return {
        success: false,
        error: 'Không thể lưu ảnh. Vui lòng thử lại.',
      };
    }
  }

  // Take photo with camera
  public async takePhoto(caption?: string): Promise<PhotoResult> {
    if (Platform.OS === 'web') {
      return {
        success: false,
        error: 'Chức năng chụp ảnh không khả dụng trên web',
      };
    }

    try {
      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        return {
          success: false,
          error: 'Cần quyền truy cập camera để chụp ảnh',
        };
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return {
          success: false,
          error: 'Đã hủy chụp ảnh',
        };
      }

      const asset = result.assets[0];
      const timestamp = Date.now();
      const filename = `photo_${timestamp}.jpg`;
      const localUri = `${this.PHOTOS_DIR}${filename}`;

      // Copy file to local directory
      await FileSystem.copyAsync({
        from: asset.uri,
        to: localUri,
      });

      // Create photo object
      const photo: Photo = {
        id: `photo_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        uri: localUri,
        width: asset.width,
        height: asset.height,
        timestamp,
        caption: caption?.trim(),
        userId: 'current_user',
      };

      // Save to storage
      await this.savePhoto(photo);

      // Add to timeline
      await TimelineService.addEvent({
        id: photo.id,
        type: 'photo',
        timestamp: photo.timestamp,
        data: {
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          caption: photo.caption,
        },
        userId: photo.userId,
      });

      console.log('Photo taken and saved:', photo.id);

      return {
        success: true,
        photo,
      };
    } catch (error) {
      console.error('Failed to take photo:', error);
      return {
        success: false,
        error: 'Không thể chụp ảnh. Vui lòng thử lại.',
      };
    }
  }

  // Get all photos
  public async getAllPhotos(): Promise<Photo[]> {
    try {
      const photosData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!photosData) return [];
      
      const photos = JSON.parse(photosData);
      return photos.sort((a: Photo, b: Photo) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get photos:', error);
      return [];
    }
  }

  // Delete photo
  public async deletePhoto(photoId: string): Promise<void> {
    try {
      const photosData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!photosData) return;
      
      const photos = JSON.parse(photosData);
      const photoToDelete = photos.find((photo: Photo) => photo.id === photoId);
      const filteredPhotos = photos.filter((photo: Photo) => photo.id !== photoId);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredPhotos));
      
      // Delete physical file
      if (photoToDelete && photoToDelete.uri.startsWith(this.PHOTOS_DIR)) {
        try {
          await FileSystem.deleteAsync(photoToDelete.uri);
          console.log('Photo file deleted:', photoToDelete.uri);
        } catch (error) {
          console.error('Failed to delete photo file:', error);
        }
      }
      
      // Also remove from timeline
      await TimelineService.deleteEvent(photoId);
      
      console.log('Photo deleted:', photoId);
    } catch (error) {
      console.error('Failed to delete photo:', error);
      throw error;
    }
  }

  // Update photo caption
  public async updateCaption(photoId: string, caption: string): Promise<void> {
    try {
      const photosData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!photosData) return;
      
      const photos = JSON.parse(photosData);
      const photoIndex = photos.findIndex((photo: Photo) => photo.id === photoId);
      
      if (photoIndex !== -1) {
        photos[photoIndex].caption = caption.trim();
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(photos));
        console.log('Photo caption updated:', photoId);
      }
    } catch (error) {
      console.error('Failed to update photo caption:', error);
      throw error;
    }
  }

  // Get photos count
  public async getPhotosCount(): Promise<number> {
    try {
      const photos = await this.getAllPhotos();
      return photos.length;
    } catch (error) {
      console.error('Failed to get photos count:', error);
      return 0;
    }
  }

  // Private: Save photo to storage
  private async savePhoto(photo: Photo): Promise<void> {
    try {
      const photosData = await AsyncStorage.getItem(this.STORAGE_KEY);
      const photos = photosData ? JSON.parse(photosData) : [];
      
      photos.unshift(photo); // Add to beginning (newest first)
      
      // Keep only last 500 photos to prevent storage bloat
      if (photos.length > 500) {
        photos.splice(500);
      }
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(photos));
    } catch (error) {
      console.error('Failed to save photo:', error);
      throw error;
    }
  }
}

export default new PhotoService();