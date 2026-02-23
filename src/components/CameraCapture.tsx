// Camera capture component for taking photos

import React, { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import Button from './Button';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onCapture(selectedFile);
      // Clean up
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Take or Upload Photo
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!previewUrl ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                Take a photo of your fridge or upload an existing image
              </p>

              {/* Camera button */}
              <Button
                fullWidth
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </Button>

              {/* Upload button */}
              <Button
                fullWidth
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload Photo
              </Button>

              {/* Hidden inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-900">
                  <strong>💡 Tip:</strong> For best results:
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
                  <li>• Take clear, well-lit photos</li>
                  <li>• Show ingredients clearly</li>
                  <li>• Avoid cluttered backgrounds</li>
                  <li>• Get close to items for better recognition</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>

              <p className="text-sm text-gray-600 text-center">
                Ready to analyze this image?
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  fullWidth
                  onClick={handleConfirm}
                  className="flex items-center justify-center gap-2"
                >
                  ✨ Analyze Image
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => {
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                >
                  Retake
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
