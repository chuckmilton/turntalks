// /src/components/AudioUploader.tsx
import React, { useState } from 'react';

interface AudioUploaderProps {
  onTranscription: (text: string) => void;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ onTranscription }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('audio', file);

    const res = await fetch('/api/transcription', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    onTranscription(data.transcription || '');
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded">
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="px-4 py-2 bg-blue-500 text-white rounded ml-2"
      >
        {loading ? 'Transcribing...' : 'Upload & Transcribe'}
      </button>
    </div>
  );
};

export default AudioUploader;
