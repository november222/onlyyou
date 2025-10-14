﻿import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Camera, ImageIcon, Trash2, X } from 'lucide-react-native';
import PhotoService, { Photo } from '@/services/PhotoService';
import { isFeatureEnabled } from '@/config/features';
import WebRTCService from '@/services/WebRTCService';

const { width: screenWidth } = Dimensions.get('window');
const itemSize = (screenWidth - 60) / 3; // 3 columns with padding

export default function SharedGalleryScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation('touch');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [partnerName, setPartnerName] = useState<string>('My Love');

  useEffect(() => {
    loadPhotos();
    loadPartnerName();
  }, []);

  const loadPartnerName = () => {
    const savedConnection = WebRTCService.getSavedConnection();
    if (savedConnection?.partnerName) {
      setPartnerName(savedConnection.partnerName);
    }
  };

  const loadPhotos = async () => {
    if (!isFeatureEnabled('sharedGallery')) return;
    
    try {
      const allPhotos = await PhotoService.getAllPhotos();
      setPhotos(allPhotos);
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  };

  const handleAddPhoto = () => {
    Alert.alert(
      'ThÃªm áº¢nh',
      'Chá»n cÃ¡ch thÃªm áº£nh vÃ o thÆ° viá»‡n',
      [
        { text: 'Há»§y', style: 'cancel' },
        { text: 'Chá»¥p áº¢nh', onPress: takePhoto },
        { text: 'Chá»n Tá»« ThÆ° Viá»‡n', onPress: pickPhoto },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const result = await PhotoService.takePhoto();
      
      if (result.success) {
        Alert.alert('ThÃ nh cÃ´ng! ðŸ“¸', 'áº¢nh Ä‘Ã£ Ä‘Æ°á»£c thÃªm vÃ o thÆ° viá»‡n');
        loadPhotos();
      } else {
        Alert.alert('Lá»—i', result.error || 'KhÃ´ng thá»ƒ chá»¥p áº£nh');
      }
    } catch (error) {
      Alert.alert('Lá»—i', 'CÃ³ lá»—i xáº£y ra khi chá»¥p áº£nh');
    }
  };

  const pickPhoto = async () => {
    try {
      const result = await PhotoService.pickAndSave();
      
      if (result.success) {
        Alert.alert('ThÃ nh cÃ´ng! ðŸ“¸', 'áº¢nh Ä‘Ã£ Ä‘Æ°á»£c thÃªm vÃ o thÆ° viá»‡n');
        loadPhotos();
      } else {
        Alert.alert('Lá»—i', result.error || 'KhÃ´ng thá»ƒ chá»n áº£nh');
      }
    } catch (error) {
      Alert.alert('Lá»—i', 'CÃ³ lá»—i xáº£y ra khi chá»n áº£nh');
    }
  };

  const handlePhotoPress = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowFullScreen(true);
  };

  const handleDeletePhoto = (photo: Photo) => {
    Alert.alert(
      'XÃ³a áº£nh?',
      'Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a áº£nh nÃ y khá»i thÆ° viá»‡n?',
      [
        { text: 'Há»§y', style: 'cancel' },
        {
          text: 'XÃ³a',
          style: 'destructive',
          onPress: async () => {
            try {
              await PhotoService.deletePhoto(photo.id);
              setShowFullScreen(false);
              setSelectedPhoto(null);
              loadPhotos();
            } catch (error) {
              Alert.alert('Lá»—i', 'KhÃ´ng thá»ƒ xÃ³a áº£nh. Vui lÃ²ng thá»­ láº¡i.');
            }
          },
        },
      ]
    );
  };

  const renderPhoto = ({ item }: { item: Photo }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => handlePhotoPress(item)}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.photoImage}
        resizeMode="cover"
      />
      {item.caption && (
        <View style={styles.photoCaptionOverlay}>
          <Text style={styles.photoCaptionText} numberOfLines={1}>
            {item.caption}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.onBackground || '#111'} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('common:sharedGallery')}</Text>
          <Text style={styles.partnerNameSubtitle}>Vá»›i {partnerName} ðŸ’•</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPhoto}>
          <Plus size={24} color="#ff6b9d" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Photos Grid */}
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={item => item.id}
        numColumns={3}
        style={styles.photosList}
        contentContainerStyle={styles.photosContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ImageIcon size={64} color="#333" strokeWidth={1} />
            <Text style={styles.emptyText}>{t('touch:galleryEmptyTitle')}</Text>
            <Text style={styles.emptySubtext}>{t('touch:galleryEmptyHint')}</Text>
          </View>
        }
      />

      {/* Full Screen Photo Modal */}
      <Modal
        visible={showFullScreen}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowFullScreen(false)}
      >
        <View style={styles.fullScreenModal}>
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              style={styles.fullScreenCloseButton}
              onPress={() => setShowFullScreen(false)}
            >
              <X size={24} color={theme.onBackground || '#111'} strokeWidth={2} />
            </TouchableOpacity>
            
            {selectedPhoto && (
              <TouchableOpacity
                style={styles.fullScreenDeleteButton}
                onPress={() => handleDeletePhoto(selectedPhoto)}
              >
                <Trash2 size={24} color="#ef4444" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
          
          {selectedPhoto && (
            <View style={styles.fullScreenContent}>
              <Image
                source={{ uri: selectedPhoto.uri }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              
              {selectedPhoto.caption && (
                <View style={styles.fullScreenCaption}>
                  <Text style={styles.fullScreenCaptionText}>
                    {selectedPhoto.caption}
                  </Text>
                </View>
              )}
              
              <View style={styles.fullScreenInfo}>
                <Text style={styles.fullScreenInfoText}>
                  {new Date(selectedPhoto.timestamp).toLocaleString('vi-VN')}
                </Text>
                <Text style={styles.fullScreenInfoText}>
                  {selectedPhoto.width} Ã— {selectedPhoto.height}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  partnerNameSubtitle: {
    fontSize: 12,
    color: '#ff6b9d',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
    marginRight: -8,
  },
  photosList: {
    flex: 1,
  },
  photosContent: {
    padding: 20,
    paddingTop: 10,
  },
  photoItem: {
    width: itemSize,
    height: itemSize,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoCaptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  photoCaptionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
  },
  fullScreenModal: {
    flex: 1,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  fullScreenCloseButton: {
    padding: 8,
  },
  fullScreenDeleteButton: {
    padding: 8,
  },
  fullScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenImage: {
    width: '100%',
    height: '70%',
  },
  fullScreenCaption: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  fullScreenCaptionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fullScreenInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  fullScreenInfoText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
});


