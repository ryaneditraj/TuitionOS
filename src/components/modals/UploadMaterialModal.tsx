'use client';

import React, { useState, useEffect } from 'react';
import { X, UploadCloud, BookOpen, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: 'material' | 'photo';
}

export default function UploadMaterialModal({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'material',
}: UploadModalProps) {
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [uploadMode, setUploadMode] = useState<'material' | 'photo'>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('sub-phy');
  const [batchId, setBatchId] = useState('batch-12-cbse-a');
  const [fileType, setFileType] = useState<'pdf' | 'pptx' | 'docx' | 'image' | 'link'>('pdf');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUploadMode(defaultType);
      fetch('/api/metadata')
        .then((res) => res.json())
        .then((data) => {
          setBatches(data.batches || []);
          setSubjects(data.subjects || []);
        })
        .catch(console.error);
    }
  }, [isOpen, defaultType]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      if (!title) {
        setTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setErrorMsg('');

    try {
      let finalUrl = fileUrl;
      let finalFileName = title;
      let finalSize = '2.4 MB';

      // If a real file is selected, upload it through /api/upload
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('bucket', uploadMode === 'photo' ? 'board-photos' : 'class-notes');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'File upload failed');

        finalUrl = uploadData.url;
        finalFileName = uploadData.fileName;
        finalSize = uploadData.fileSize;
      }

      if (!finalUrl) {
        // Fallback for quick link or demo default
        finalUrl = uploadMode === 'photo' 
          ? '/uploads/board-photos/physics_electrostatics_board.jpg'
          : '/uploads/class-notes/electrostatics_handwritten_notes.pdf';
      }

      if (uploadMode === 'material') {
        const res = await fetch('/api/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batch_id: batchId,
            subject_id: subjectId,
            title,
            description,
            file_name: finalFileName,
            file_url: finalUrl,
            file_type: fileType,
            file_size: finalSize,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Failed to save notes');
        }
      } else {
        const res = await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batch_id: batchId,
            subject_id: subjectId,
            title,
            photo_url: finalUrl,
            caption: description,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Failed to save board photo');
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Academic Resource</h2>
              <p className="text-xs text-slate-500">Class notes, handouts, or high-res board photos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border-b border-rose-100 flex items-center gap-2 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Mode Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setUploadMode('material')}
              className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                uploadMode === 'material' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Class Notes / PDF
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('photo')}
              className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                uploadMode === 'photo' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Board Photo
            </button>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={uploadMode === 'material' ? 'e.g. Electrostatics Handwritten Derivations' : 'e.g. Gauss Law Sphere Derivation Board'}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batch</label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.full_label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File Picker */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select File or Photo</label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center hover:border-indigo-300 transition-colors bg-slate-50/50">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                accept={uploadMode === 'photo' ? 'image/*' : '.pdf,.pptx,.docx,image/*'}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Tap to browse or drop file here'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {uploadMode === 'photo' ? 'JPEG, PNG, WebP up to 25MB' : 'PDF, DOCX, PPTX up to 25MB'}
                </p>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Caption / Summary (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Important remarks or formulas covered in this material..."
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              Upload & Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
