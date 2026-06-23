'use client';

import Link from 'next/link';
import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { cn, buildShareUrl } from '@/lib/utils';
import type { Publication } from '@/types';

interface AdminUploadFormProps {
  onSuccess?: (publication: Publication) => void;
}

type Status = 'idle' | 'uploading' | 'success' | 'error';

function useBlobUpload(): boolean {
  if (typeof window === 'undefined') return false;
  return !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
}

export default function AdminUploadForm({ onSuccess }: AdminUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [uploadStep, setUploadStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<Publication | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUpload = useBlobUpload();

  const setFileAndTitle = useCallback(
    (f: File) => {
      setFile(f);
      if (!title) {
        const derived = f.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim();
        setTitle(derived);
      }
    },
    [title]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf' || f?.name.endsWith('.pdf')) setFileAndTitle(f);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFileAndTitle(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setStatus('uploading');
    setErrorMsg('');
    setUploadStep('');

    try {
      let data: Publication;

      if (blobUpload) {
        setUploadStep('Uploading PDF to cloud storage…');
        const { upload } = await import('@vercel/blob/client');
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/blob/upload',
        });

        setUploadStep('Saving publication…');
        const res = await fetch('/api/publications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            publishedAt,
            pdfUrl: blob.url,
            fileSize: file.size,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error((json as { error?: string }).error || 'Failed to save publication');
        data = json as Publication;
      } else {
        setUploadStep('Uploading…');
        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('publishedAt', publishedAt);

        const res = await fetch('/api/publications', { method: 'POST', body: formData });
        const json = await res.json();
        if (!res.ok) throw new Error((json as { error?: string }).error || 'Upload failed');
        data = json as Publication;
      }

      setResult(data);
      setStatus('success');
      onSuccess?.(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setErrorMsg(msg);
      setStatus('error');
    } finally {
      setUploadStep('');
    }
  };

  const reset = () => {
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
    setFile(null);
    setTitle('');
    setDescription('');
    setPublishedAt(new Date().toISOString().split('T')[0]);
  };

  if (status === 'success' && result) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
        <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={28} className="text-teal-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Publication published!</h3>
        <p className="text-gray-500 text-sm mb-6">Your flipbook is live and ready to share.</p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-medium text-gray-500 mb-1">Public URL</p>
          <a
            href={buildShareUrl(result.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pvpa-teal hover:underline text-sm break-all font-medium"
          >
            {buildShareUrl(result.slug)}
          </a>
        </div>

        <div className="flex gap-3 justify-center">
          <Link
            href={`/flipbook/${result.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-pvpa-navy text-white rounded-xl hover:bg-pvpa-blue transition-colors text-sm font-medium"
          >
            <ExternalLink size={14} />
            View Flipbook
          </Link>
          <button
            onClick={reset}
            className="px-5 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Upload Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
      <h2 className="text-base font-semibold text-gray-900">Upload New Publication</h2>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all select-none',
          isDragging
            ? 'border-pvpa-teal bg-teal-50 scale-[1.01]'
            : file
            ? 'border-teal-300 bg-teal-50/30'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText size={22} className="text-teal-600 shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setFile(null); }}
              className="ml-1 p-1 rounded-full hover:bg-gray-200 transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={28} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">Drop PDF here or click to browse</p>
            <p className="text-xs text-gray-400 mt-0.5">PDF files up to 100 MB</p>
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. PVPA Annual Report 2024"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pvpa-teal focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of the publication..."
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pvpa-teal focus:border-transparent transition resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Publication Date</label>
        <input
          type="date"
          value={publishedAt}
          onChange={e => setPublishedAt(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pvpa-teal focus:border-transparent transition"
        />
      </div>

      {status === 'error' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Upload failed</p>
            <p className="mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!file || !title.trim() || status === 'uploading'}
        className={cn(
          'w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all',
          !file || !title.trim() || status === 'uploading'
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-pvpa-navy text-white hover:bg-pvpa-blue active:scale-[0.99] shadow-sm'
        )}
      >
        {status === 'uploading' ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            {uploadStep || 'Publishing…'}
          </span>
        ) : (
          'Publish Flipbook'
        )}
      </button>
    </form>
  );
}
