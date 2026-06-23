"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import AdminUploadForm from "@/components/AdminUploadForm";
import PublicationCard from "@/components/PublicationCard";
import type { PublicationListItem } from "@/types";

export default function AdminPage() {
  const [publications, setPublications] = useState<PublicationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPublications = useCallback(async () => {
    try {
      const res = await fetch("/api/publications");
      const data = await res.json();
      setPublications(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  const handleDelete = async (id: string) => {
    const pub = publications.find((p) => p.id === id);
    if (!pub || !confirm(`Delete "${pub.title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/publications/${pub.slug}/delete`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchPublications();
    } catch {
      alert("Failed to delete publication");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Publication Manager</h1>
          <p className="mt-1 text-sm text-gray-600">
            Upload PDFs and manage your digital flipbook library
          </p>
        </div>

        <div className="mb-10">
          <AdminUploadForm onSuccess={() => fetchPublications()} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            All Publications ({publications.length})
          </h2>

          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : publications.length === 0 ? (
            <p className="text-gray-500 text-sm">No publications yet. Upload your first PDF above.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {publications.map((pub) => (
                <PublicationCard
                  key={pub.id}
                  publication={pub}
                  isAdmin
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
