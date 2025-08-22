"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { Trash2, Download, FileText, Upload, Eye } from "lucide-react";

interface Faculty {
  id: string;
  name: string;
  email: string;
  institution?: string;
}

interface Session {
  id: string;
  title: string;
  startTime: string;
}

interface FileItem {
  id: string;
  filePath: string;
  fileType?: string;
  fileSize?: number | string;
  originalFilename?: string;
  title?: string; // For presentations
  uploadedAt: string;
  faculty: Faculty;
  session?: Session; // For presentations
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  facultyId?: string;
}

export default function FacultyDocumentsModal({
  isOpen,
  onClose,
  facultyId,
}: Props) {
  const [cv, setCv] = useState<FileItem | null>(null);
  const [presentations, setPresentations] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchFiles();
  }, [isOpen, facultyId]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const cvUrl = facultyId
        ? `/api/faculty/cv/upload?facultyId=${facultyId}`
        : `/api/faculty/cv/upload`;
      const presUrl = facultyId
        ? `/api/faculty/presentations/upload?facultyId=${facultyId}`
        : `/api/faculty/presentations/upload`;

      const [cvRes, presRes] = await Promise.all([
        fetch(cvUrl, { credentials: "include" }),
        fetch(presUrl, { credentials: "include" }),
      ]);

      if (!cvRes.ok) {
        const errorText = await cvRes.text();
        console.error("CV API Error:", errorText);
        throw new Error(`Failed to fetch CV: ${cvRes.status}`);
      }

      if (!presRes.ok) {
        const errorText = await presRes.text();
        console.error("Presentations API Error:", errorText);
        throw new Error(`Failed to fetch Presentations: ${presRes.status}`);
      }

      const cvContentType = cvRes.headers.get("content-type");
      const presContentType = presRes.headers.get("content-type");

      if (!cvContentType?.includes("application/json")) {
        throw new Error("CV API returned non-JSON response");
      }

      if (!presContentType?.includes("application/json")) {
        throw new Error("Presentations API returned non-JSON response");
      }

      const cvData = await cvRes.json();
      const presData = await presRes.json();

      // Debug logs
      console.log("Raw CV Data:", JSON.stringify(cvData, null, 2));
      console.log("Raw Presentations Data:", JSON.stringify(presData, null, 2));

      // ✅ UPDATED: Better data handling for the new API structure
      const allCvFiles = cvData.data?.cvs || [];
      const allPresentationFiles = presData.data?.presentations || [];

      // Ensure CV has only one file (take the most recent if multiple)
      const cvFile =
        allCvFiles.length > 0
          ? allCvFiles.sort(
              (a: FileItem, b: FileItem) =>
                new Date(b.uploadedAt).getTime() -
                new Date(a.uploadedAt).getTime()
            )[0]
          : null;

      setCv(cvFile);
      setPresentations(allPresentationFiles);
    } catch (err: any) {
      console.error("Modal fetch error:", err);
      setError(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    fileId: string,
    fileType: "cv" | "presentation"
  ) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    setDeletingId(fileId);

    try {
      // Try different endpoint patterns - you may need to adjust these based on your server setup
      let deleteUrl;

      // Pattern 1: Separate delete endpoints
      if (fileType === "cv") {
        deleteUrl = `/api/faculty/cv/delete`;
      } else {
        deleteUrl = `/api/faculty/presentations/delete`;
      }

      // Pattern 2: Alternative endpoint structure (uncomment if Pattern 1 doesn't work)
      // deleteUrl = `/api/faculty/${fileType}/delete`;

      // Pattern 3: Another alternative (uncomment if others don't work)
      // deleteUrl = `/api/faculty/delete/${fileType}`;

      // Pattern 4: With fileId in URL (uncomment if others don't work)
      // deleteUrl = `/api/faculty/${fileType}/delete/${fileId}`;

      const response = await fetch(deleteUrl, {
        method: "POST", // Start with POST, change to DELETE if your server supports it
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fileId: fileId,
          facultyId: facultyId,
        }),
      });

      if (!response.ok) {
        // Enhanced error handling
        const contentType = response.headers.get("content-type");
        let errorMessage = `Failed to delete file: ${response.status}`;

        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            // Server returned HTML or plain text
            const errorText = await response.text();
            console.error("Server returned non-JSON response:", errorText);

            // Common HTTP status code meanings
            switch (response.status) {
              case 404:
                errorMessage =
                  "Delete endpoint not found. Check server configuration.";
                break;
              case 405:
                errorMessage =
                  "Delete method not allowed. Server may need DELETE method implementation.";
                break;
              case 500:
                errorMessage = "Server error occurred during deletion.";
                break;
              default:
                errorMessage = `Server error (${response.status}): Check server logs`;
            }
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorMessage = `Network error (${response.status})`;
        }

        throw new Error(errorMessage);
      }

      // Handle successful response
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          console.log("Delete successful:", result);
        } else {
          console.log("Delete successful (non-JSON response)");
        }
      } catch (parseError) {
        // Response might be empty, which is OK for delete operations
        console.log("Delete successful (empty response)");
      }

      // Refresh the data after successful deletion
      await fetchFiles();
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(`Failed to delete file: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ UPDATED: Simplified and more reliable file size formatting
  const formatFileSize = (bytes: number | string | null | undefined) => {
    if (!bytes || bytes === 0 || bytes === "0") return "0.00";

    let numericBytes: number;

    if (typeof bytes === "string") {
      // Handle string formats like "0.11 MB" or "113000"
      if (bytes.includes("MB")) {
        return parseFloat(bytes.replace("MB", "").trim()).toFixed(2);
      }
      if (bytes.includes("KB")) {
        return (parseFloat(bytes.replace("KB", "").trim()) / 1024).toFixed(2);
      }
      numericBytes = parseInt(bytes, 10);
    } else {
      numericBytes = bytes;
    }

    if (isNaN(numericBytes) || numericBytes === 0) return "0.00";

    // Convert bytes to MB
    return (numericBytes / (1024 * 1024)).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getFileName = (
    file: FileItem,
    index: number,
    type: "cv" | "presentation"
  ) => {
    if (type === "presentation") {
      // For presentations, use title first, then fallback to originalFilename
      return (
        file?.title || file?.originalFilename || `Presentation ${index + 1}`
      );
    } else {
      // For CV, use originalFilename first
      return file?.originalFilename || file?.title || "CV";
    }
  };

  // ✅ UPDATED: Simplified file type display with better fallbacks
  const getFileType = (file: FileItem) => {
    // First try the fileType from API
    if (file?.fileType && file.fileType !== "Unknown") {
      // Clean up common MIME types for display
      switch (file.fileType) {
        case "application/pdf":
          return "PDF";
        case "application/vnd.ms-powerpoint":
          return "PowerPoint (PPT)";
        case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
          return "PowerPoint (PPTX)";
        case "application/msword":
          return "Word Document (DOC)";
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          return "Word Document (DOCX)";
        case "image/jpeg":
          return "JPEG Image";
        case "image/png":
          return "PNG Image";
        default:
          return file.fileType;
      }
    }

    // Fallback: Extract from filename extension
    const filename = file?.originalFilename || file?.title || "";
    const extension = filename.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return "PDF";
      case "doc":
        return "Word Document (DOC)";
      case "docx":
        return "Word Document (DOCX)";
      case "ppt":
        return "PowerPoint (PPT)";
      case "pptx":
        return "PowerPoint (PPTX)";
      case "jpg":
      case "jpeg":
        return "JPEG Image";
      case "png":
        return "PNG Image";
      default:
        return "Unknown";
    }
  };

  // ✅ UPDATED: Simplified file size getter that works with the new API
  const getDisplayFileSize = (file: FileItem) => {
    return formatFileSize(file?.fileSize);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
            Uploaded Documents
          </Dialog.Title>

          {loading ? (
            <div className="mt-4">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
              <p className="mt-2 text-gray-500">Loading documents...</p>
            </div>
          ) : error ? (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium">
                Error loading documents
              </p>
              <p className="text-red-500 text-sm mt-1">{error}</p>
              <button
                onClick={fetchFiles}
                className="mt-2 px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-8">
              {/* CV Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">CV</h3>
                </div>

                {cv ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-lg">
                          {getFileName(cv, 0, "cv")}
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Uploaded by:</span>{" "}
                            {cv.faculty?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Date:</span>{" "}
                            {formatDate(cv.uploadedAt)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Size:</span>{" "}
                            {getDisplayFileSize(cv)} MB
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Type:</span>{" "}
                            {getFileType(cv)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <a
                          href={cv.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </a>

                        <button
                          onClick={() => handleDelete(cv.id, "cv")}
                          disabled={deletingId === cv.id}
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === cv.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No CV uploaded yet.</p>
                  </div>
                )}
              </section>

              {/* Presentations Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Presentations</h3>
                  {presentations.length > 0 && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {presentations.length} file
                      {presentations.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {presentations.length > 0 ? (
                  <div className="space-y-3">
                    {presentations.map((file, index) => {
                      const fileName = getFileName(file, index, "presentation");

                      return (
                        <div
                          key={file.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div className="p-4 bg-gray-50 flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-lg">
                                {fileName}
                              </p>
                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">
                                    Uploaded by:
                                  </span>{" "}
                                  {file.faculty?.name || "Unknown"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Date:</span>{" "}
                                  {formatDate(file.uploadedAt)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Size:</span>{" "}
                                  {getDisplayFileSize(file)} MB
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Type:</span>{" "}
                                  {getFileType(file)}
                                </p>
                                {file.session && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">
                                      Session:
                                    </span>{" "}
                                    {file.session.title}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              <a
                                href={file.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </a>

                              <button
                                onClick={() =>
                                  handleDelete(file.id, "presentation")
                                }
                                disabled={deletingId === file.id}
                                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                {deletingId === file.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">
                      No presentations uploaded yet.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
