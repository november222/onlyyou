import React, { useState, useEffect } from 'react';
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
import { useTheme, useThemeColors } from '@/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ArrowLeft, Plus, ImageIcon, Trash2, X } from 'lucide-react-native';
import PhotoService, { Photo } from '@/services/PhotoService';
import { isFeatureEnabled } from '@/config/features';
import WebRTCService from '@/services/WebRTCService';

const { width: screenWidth } = Dimensions.get('window');
const itemSize = (screenWidth - 60) / 3; // 3 columns with padding

export default function SharedGalleryScreen() {
  const { theme } = useTheme();
  const colors = useThemeColors();
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
      t('common:addPhoto'),
      t('touch:galleryAddChoose'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        { text: t('common:takePhoto'), onPress: takePhoto },
        { text: t('common:pickFromLibrary'), onPress: pickPhoto },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const result = await PhotoService.takePhoto();
      if (result.success) {
        Alert.alert(t('common:success'), t('touch:galleryAddSuccess'));
        loadPhotos();
      } else {
        Alert.alert(t('common:error'), result.error || t('touch:galleryTakeFailed'));
      }
    } catch (error) {
      Alert.alert(t('common:error'), t('touch:galleryTakeError'));
    }
  };

  const pickPhoto = async () => {
    try {
      const result = await PhotoService.pickAndSave();
      if (result.success) {
        Alert.alert(t('common:success'), t('touch:galleryAddSuccess'));
        loadPhotos();
      } else {
        Alert.alert(t('common:error'), result.error || t('touch:galleryPickFailed'));
      }
    } catch (error) {
      Alert.alert(t('common:error'), t('touch:galleryPickError'));
    }
  };

  const handlePhotoPress = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowFullScreen(true);
  };

  const handleDeletePhoto = (photo: Photo) => {
    Alert.alert(
      t('touch:galleryDeleteTitle'),
      t('touch:galleryDeleteMessage'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('common:delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await PhotoService.deletePhoto(photo.id);
              setShowFullScreen(false);
              setSelectedPhoto(null);
              loadPhotos();
            } catch (error) {
              Alert.alert(t('common:error'), t('touch:galleryDeleteFailed'));
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft
            size={24}
            color={theme.onBackground || '#111'}
            strokeWidth={2}
          />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t('common:sharedGallery')}
          </Text>
          <Text style={[styles.partnerNameSubtitle, { color: theme.primary }]}>
            {t('touch:forPartner', { name: partnerName })}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPhoto}>
          <Plus size={24} color={theme.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Photos Grid */}
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={3}
        style={styles.photosList}
        contentContainerStyle={styles.photosContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ImageIcon
              size={64}
              color={theme.border || colors.mutedText || theme.text}
              strokeWidth={1}
            />
            <Text style={styles.emptyText}>{t('touch:galleryEmptyTitle')}</Text>
            <Text style={styles.emptySubtext}>
              {t('touch:galleryEmptyHint')}
            </Text>
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
        <View
          style={[
            styles.fullScreenModal,
            { backgroundColor: theme.background },
          ]}
        >
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              style={styles.fullScreenCloseButton}
              onPress={() => setShowFullScreen(false)}
            >
              <X
                size={24}
                color={theme.onBackground || colors.text}
                strokeWidth={2}
              />
            </TouchableOpacity>

            {selectedPhoto && (
              <TouchableOpacity
                style={styles.fullScreenDeleteButton}
                onPress={() => handleDeletePhoto(selectedPhoto)}
              >
                <Trash2
                  size={24}
                  color={theme.danger || '#ef4444'}
                  strokeWidth={2}
                />
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
                  <Text
                    style={[
                      styles.fullScreenCaptionText,
                      { color: theme.onBackground || '#fff' },
                    ]}
                  >
                    {selectedPhoto.caption}
                  </Text>
                </View>
              )}

              <View style={styles.fullScreenInfo}>
                <Text
                  style={[
                    styles.fullScreenInfoText,
                    {
                      color: colors.mutedText || theme.mutedText || theme.text,
                    },
                  ]}
                >
                  {new Date(selectedPhoto.timestamp).toLocaleString()}
                </Text>
                <Text
                  style={[
                    styles.fullScreenInfoText,
                    {
                      color: colors.mutedText || theme.mutedText || theme.text,
                    },
                  ]}
                >
                  {selectedPhoto.width} x {selectedPhoto.height}
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: { padding: 8, marginLeft: -8 },
  titleContainer: { flex: 1, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  partnerNameSubtitle: { fontSize: 12, color: '#ff6b9d', marginTop: 2 },
  addButton: { padding: 8, marginRight: -8 },
  photosList: { flex: 1 },
  photosContent: { padding: 20, paddingTop: 10 },
  photoItem: {
    width: itemSize,
    height: itemSize,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  photoCaptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  photoCaptionText: { fontSize: 12, color: '#fff', fontWeight: '500' },
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
  emptySubtext: { fontSize: 14, color: '#888' },
  fullScreenModal: { flex: 1 },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  fullScreenCloseButton: { padding: 8 },
  fullScreenDeleteButton: { padding: 8 },
  fullScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenImage: { width: '100%', height: '70%' },
  fullScreenCaption: { marginTop: 20, paddingHorizontal: 20 },
  fullScreenCaptionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fullScreenInfo: { marginTop: 20, alignItems: 'center' },
  fullScreenInfoText: { fontSize: 14, color: '#888', marginBottom: 4 },
});

