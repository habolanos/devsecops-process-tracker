'use client';

import { useState } from 'react';
import { TaskState, EvidenceImage } from '@/lib/types';
import { useProcessStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n-context';
import { X, Upload, Link as LinkIcon, Trash2, FileText, Image as ImageIcon } from 'lucide-react';

interface EvidenceModalProps {
  task: TaskState;
  phaseId: string;
  onClose: () => void;
}

export default function EvidenceModal({ task, phaseId, onClose }: EvidenceModalProps) {
  const { t } = useI18n();
  const updateTaskEvidence = useProcessStore((state) => state?.updateTaskEvidence);
  
  const [textEvidence, setTextEvidence] = useState(task?.evidence?.text ?? '');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingUrl, setIsUploadingUrl] = useState(false);

  const evidenceConfig = task?.evidenceConfig;
  const needsText = evidenceConfig?.type === 'text' || evidenceConfig?.type === 'both';
  const needsImage = evidenceConfig?.type === 'image' || evidenceConfig?.type === 'both';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      // Step 1: Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          isPublic: false
        })
      });

      if (!presignedRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, cloudStoragePath } = await presignedRes.json();

      // Step 2: Upload file to S3
      const uploadHeaders: HeadersInit = {
        'Content-Type': file.type
      };

      // Check if Content-Disposition is in signed headers
      const url = new URL(uploadUrl);
      const signedHeaders = url.searchParams.get('X-Amz-SignedHeaders');
      if (signedHeaders?.includes('content-disposition')) {
        uploadHeaders['Content-Disposition'] = 'attachment';
      }

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: uploadHeaders,
        body: file
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file');

      // Step 3: Get file URL
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloudStoragePath,
          isPublic: false
        })
      });

      if (!completeRes.ok) throw new Error('Failed to complete upload');
      const { url: fileUrl } = await completeRes.json();

      // Add to evidence
      const newImage: EvidenceImage = {
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        cloudStoragePath,
        isPublic: false,
        url: fileUrl,
        source: 'file',
        uploadedAt: new Date().toISOString()
      };

      const currentImages = task?.evidence?.images ?? [];
      updateTaskEvidence?.(phaseId, task?.id ?? '', {
        images: [...currentImages, newImage]
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error al subir la imagen');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!imageUrl.trim()) return;

    setIsUploadingUrl(true);
    try {
      // Validate URL
      const url = new URL(imageUrl);
      const fileName = url.pathname.split('/').pop() || 'image.jpg';

      // Fetch image
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });

      // Upload to S3
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          isPublic: false
        })
      });

      if (!presignedRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, cloudStoragePath } = await presignedRes.json();

      const uploadHeaders: HeadersInit = {
        'Content-Type': file.type
      };

      const uploadUrlObj = new URL(uploadUrl);
      const signedHeaders = uploadUrlObj.searchParams.get('X-Amz-SignedHeaders');
      if (signedHeaders?.includes('content-disposition')) {
        uploadHeaders['Content-Disposition'] = 'attachment';
      }

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: uploadHeaders,
        body: file
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file');

      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloudStoragePath,
          isPublic: false
        })
      });

      if (!completeRes.ok) throw new Error('Failed to complete upload');
      const { url: fileUrl } = await completeRes.json();

      const newImage: EvidenceImage = {
        id: `${Date.now()}-${fileName}`,
        name: fileName,
        cloudStoragePath,
        isPublic: false,
        url: fileUrl,
        source: 'url',
        originalUrl: imageUrl,
        uploadedAt: new Date().toISOString()
      };

      const currentImages = task?.evidence?.images ?? [];
      updateTaskEvidence?.(phaseId, task?.id ?? '', {
        images: [...currentImages, newImage]
      });

      setImageUrl('');
    } catch (error) {
      console.error('URL upload error:', error);
      alert('Error al cargar imagen desde URL');
    } finally {
      setIsUploadingUrl(false);
    }
  };

  const handleDeleteImage = async (imageId: string, cloudStoragePath: string) => {
    try {
      // Delete from S3
      if (cloudStoragePath) {
        await fetch('/api/upload/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cloudStoragePath })
        });
      }

      // Remove from evidence
      const currentImages = task?.evidence?.images ?? [];
      updateTaskEvidence?.(phaseId, task?.id ?? '', {
        images: currentImages.filter((img) => img?.id !== imageId)
      });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSave = () => {
    updateTaskEvidence?.(phaseId, task?.id ?? '', {
      text: textEvidence
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{task?.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('evidence.title')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Text Evidence */}
          {needsText && (
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <FileText className="w-4 h-4" />
                {t('evidence.text')}
                {evidenceConfig?.required && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={textEvidence}
                onChange={(e) => setTextEvidence(e.target.value)}
                placeholder={t('evidence.text.placeholder')}
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          {/* Image Evidence */}
          {needsImage && (
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <ImageIcon className="w-4 h-4" />
                {t('evidence.images')}
                {evidenceConfig?.required && <span className="text-red-500">*</span>}
              </label>

              {/* Upload buttons */}
              <div className="flex gap-3 mb-4">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploadingFile}
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="font-medium">
                      {isUploadingFile ? t('upload.loading') : t('evidence.upload')}
                    </span>
                  </div>
                </label>
              </div>

              {/* URL input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={t('evidence.url.placeholder')}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleUrlUpload}
                  disabled={!imageUrl.trim() || isUploadingUrl}
                  className="px-4 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span className="font-medium">
                    {isUploadingUrl ? t('upload.loading') : t('evidence.add.url')}
                  </span>
                </button>
              </div>

              {/* Image grid */}
              {task?.evidence?.images && task.evidence.images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {task.evidence.images.map((img) => (
                    <div
                      key={img?.id}
                      className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
                    >
                      {img?.url && (
                        <img
                          src={img.url}
                          alt={img?.name ?? 'evidence'}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        onClick={() => handleDeleteImage(img?.id ?? '', img?.cloudStoragePath ?? '')}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs truncate">
                        {img?.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
          >
            {t('evidence.close')}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            {t('evidence.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
