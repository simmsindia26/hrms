import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ChangeEvent,
  FormEvent,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  Filter,
  FolderOpen,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";

interface EmployeeReference {
  _id?: string;
  id?: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface EmployeeDocument {
  _id: string;
  employee?: string | EmployeeReference | null;
  employeeId?: string;

  title?: string;
  name?: string;
  documentName?: string;

  category?: string;
  documentType?: string;
  type?: string;

  description?: string;

  fileName?: string;
  originalName?: string;
  filename?: string;

  fileUrl?: string;
  url?: string;
  path?: string;

  mimeType?: string;
  contentType?: string;

  fileSize?: number;
  size?: number;

  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;

  status?: string;
}

interface AuthUser {
  _id?: string;
  id?: string;
  email?: string;
  employee?:
    | string
    | EmployeeReference
    | null;
}

interface DocumentForm {
  category: string;
  documentType: string;
  title: string;
  description: string;
  file: File | null;
}

const DOCUMENT_CATEGORIES = [
  "Identity",
  "Education",
  "Employment",
  "Bank",
  "Tax",
  "Address",
  "Medical",
  "Other",
];

const DOCUMENT_TYPES = [
  "Aadhaar Card",
  "PAN Card",
  "Passport",
  "Driving Licence",
  "Voter ID",
  "10th Certificate",
  "12th Certificate",
  "Degree Certificate",
  "Experience Letter",
  "Relieving Letter",
  "Offer Letter",
  "Appointment Letter",
  "Bank Passbook",
  "Cancelled Cheque",
  "Salary Slip",
  "Address Proof",
  "Medical Certificate",
  "Other",
];

const EMPTY_FORM: DocumentForm = {
  category: "",
  documentType: "",
  title: "",
  description: "",
  file: null,
};

function extractDocuments(
  payload: any,
): EmployeeDocument[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (
    Array.isArray(
      payload?.data?.documents,
    )
  ) {
    return payload.data.documents;
  }

  if (
    Array.isArray(
      payload?.documents,
    )
  ) {
    return payload.documents;
  }

  if (
    Array.isArray(
      payload?.data?.items,
    )
  ) {
    return payload.data.items;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (
    Array.isArray(
      payload?.data?.docs,
    )
  ) {
    return payload.data.docs;
  }

  if (Array.isArray(payload?.docs)) {
    return payload.docs;
  }

  return [];
}

function getEmployeeId(
  employee:
    | string
    | EmployeeReference
    | null
    | undefined,
): string {
  if (!employee) {
    return "";
  }

  if (typeof employee === "string") {
    return employee;
  }

  return (
    employee._id ||
    employee.id ||
    employee.employeeId ||
    ""
  );
}

function formatDate(date?: string) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(size?: number) {
  if (!size || size <= 0) {
    return "Unknown size";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return `${(
    size /
    (1024 * 1024 * 1024)
  ).toFixed(1)} GB`;
}

function getDocumentName(
  document: EmployeeDocument,
) {
  return (
    document.title ||
    document.documentName ||
    document.name ||
    document.originalName ||
    document.fileName ||
    document.filename ||
    "Untitled Document"
  );
}

function getFileName(
  document: EmployeeDocument,
) {
  return (
    document.originalName ||
    document.fileName ||
    document.filename ||
    getDocumentName(document)
  );
}

function getFileUrl(
  document: EmployeeDocument,
) {
  return (
    document.fileUrl ||
    document.url ||
    document.path ||
    ""
  );
}

function getMimeType(
  document: EmployeeDocument,
) {
  return (
    document.mimeType ||
    document.contentType ||
    ""
  ).toLowerCase();
}

function getCategory(
  document: EmployeeDocument,
) {
  return (
    document.category ||
    document.documentType ||
    document.type ||
    "Other"
  );
}

function isImage(
  document: EmployeeDocument,
) {
  const mime = getMimeType(document);

  return (
    mime.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(
      getFileName(document),
    )
  );
}

function isPdf(
  document: EmployeeDocument,
) {
  const mime = getMimeType(document);

  return (
    mime === "application/pdf" ||
    /\.pdf$/i.test(
      getFileName(document),
    )
  );
}

function getDocumentIcon(
  document: EmployeeDocument,
) {
  if (isImage(document)) {
    return (
      <FileImage
        size={24}
        className="text-blue-600"
      />
    );
  }

  if (isPdf(document)) {
    return (
      <FileText
        size={24}
        className="text-red-600"
      />
    );
  }

  return (
    <File
      size={24}
      className="text-slate-600"
    />
  );
}

const Documents = () => {
  const { user } = useAuth();

  const employeeUser =
    user as AuthUser | null | undefined;

  const employeeId = useMemo(
    () =>
      getEmployeeId(
        employeeUser?.employee,
      ),
    [employeeUser],
  );

  const [documents, setDocuments] =
    useState<EmployeeDocument[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");

  const [showUpload, setShowUpload] =
    useState(false);

  const [
    previewDocument,
    setPreviewDocument,
  ] =
    useState<EmployeeDocument | null>(
      null,
    );

  const [form, setForm] =
    useState<DocumentForm>(
      EMPTY_FORM,
    );

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/hr/documents",
        {
          params: {
            page: 1,
            limit: 500,
            employee:
              employeeId || undefined,
            employeeId:
              employeeId || undefined,
          },
        },
      );

      const list =
        extractDocuments(
          response.data,
        );

      setDocuments(list);
    } catch (err: any) {
      console.error(
        "Failed to load documents:",
        err,
      );

      setError(
        err?.response?.data
          ?.message ||
          "Failed to load documents.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [employeeId]);

  const filteredDocuments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return documents.filter(
        (document) => {
          const name =
            getDocumentName(
              document,
            ).toLowerCase();

          const type = (
            document.documentType ||
            document.type ||
            ""
          ).toLowerCase();

          const category =
            getCategory(
              document,
            ).toLowerCase();

          const matchesSearch =
            !query ||
            name.includes(query) ||
            type.includes(query) ||
            category.includes(query);

          const matchesCategory =
            categoryFilter ===
              "all" ||
            category ===
              categoryFilter.toLowerCase();

          return (
            matchesSearch &&
            matchesCategory
          );
        },
      );
    }, [
      documents,
      search,
      categoryFilter,
    ]);

  const categories = useMemo(
    () => {
      const values = documents
        .map((document) =>
          getCategory(document),
        )
        .filter(Boolean);

      return Array.from(
        new Set(values),
      );
    },
    [documents],
  );

  const totalDocuments =
    documents.length;

  const pdfDocuments =
    documents.filter(isPdf).length;

  const imageDocuments =
    documents.filter(isImage)
      .length;

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      setForm((previous) => ({
        ...previous,
        file: null,
      }));

      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "File size must not exceed 10 MB.",
      );

      event.target.value = "";

      return;
    }

    setError("");

    setForm((previous) => ({
      ...previous,
      file,
    }));
  };

  const handleUpload = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!employeeId) {
      setError(
        "Your employee profile is not linked to this account.",
      );
      return;
    }

    if (!form.file) {
      setError(
        "Please select a document file.",
      );
      return;
    }

    if (!form.category) {
      setError(
        "Please select a document category.",
      );
      return;
    }

    if (!form.documentType) {
      setError(
        "Please select a document type.",
      );
      return;
    }

    try {
      setUploading(true);

      const formData =
        new FormData();

      formData.append(
        "file",
        form.file,
      );

      formData.append(
        "employee",
        employeeId,
      );

      formData.append(
        "employeeId",
        employeeId,
      );

      formData.append(
        "category",
        form.category,
      );

      formData.append(
        "documentType",
        form.documentType,
      );

      if (form.title.trim()) {
        formData.append(
          "title",
          form.title.trim(),
        );
      }

      if (
        form.description.trim()
      ) {
        formData.append(
          "description",
          form.description.trim(),
        );
      }

      await api.post(
        "/hr/documents",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        },
      );

      setSuccess(
        "Document uploaded successfully.",
      );

      setForm(EMPTY_FORM);
      setShowUpload(false);

      await loadDocuments();
    } catch (err: any) {
      console.error(
        "Document upload failed:",
        err,
      );

      setError(
        err?.response?.data
          ?.message ||
          "Failed to upload document.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (
    document: EmployeeDocument,
  ) => {
    const name =
      getDocumentName(document);

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        document._id,
      );

      setError("");
      setSuccess("");

      await api.delete(
        `/hr/documents/${document._id}`,
      );

      setDocuments((previous) =>
        previous.filter(
          (item) =>
            item._id !==
            document._id,
        ),
      );

      setSuccess(
        "Document deleted successfully.",
      );

      if (
        previewDocument?._id ===
        document._id
      ) {
        setPreviewDocument(null);
      }
    } catch (err: any) {
      console.error(
        "Document deletion failed:",
        err,
      );

      setError(
        err?.response?.data
          ?.message ||
          "Failed to delete document.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (
    document: EmployeeDocument,
  ) => {
    const url =
      getFileUrl(document);

    if (!url) {
      setError(
        "Download URL is not available.",
      );
      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <img
                src="/logo.png"
                alt="Sellopedia"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#FE0000]">
              <FolderOpen size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                My Documents
              </h1>

              <p className="text-sm text-slate-500">
                Manage your employee
                documents and files
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setForm(EMPTY_FORM);
              setShowUpload(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            <Plus size={18} />
            Upload Document
          </button>
        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span>{success}</span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="ml-auto"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="ml-auto"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Total Documents
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {totalDocuments}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#FE0000]">
                <FileText size={21} />
              </div>
            </div>
          </div>

          {/* PDF */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  PDF Documents
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {pdfDocuments}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <FileText size={21} />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Image Documents
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {imageDocuments}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileImage size={21} />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search documents..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div className="relative">
              <Filter
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value,
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
              >
                <option value="all">
                  All Categories
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </div>

        {/* =================================================
            DOCUMENTS
        ================================================= */}

        {loading ? (
          <div className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2
                size={30}
                className="animate-spin text-[#FE0000]"
              />

              <span className="text-sm">
                Loading documents...
              </span>
            </div>
          </div>
        ) : filteredDocuments.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FolderOpen size={30} />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No documents found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {search ||
              categoryFilter !==
                "all"
                ? "Try changing your search or filter."
                : "You have not uploaded any documents yet."}
            </p>

            {!search &&
              categoryFilter ===
                "all" && (
                <button
                  type="button"
                  onClick={() =>
                    setShowUpload(true)
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <Upload size={17} />
                  Upload Document
                </button>
              )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map(
              (document) => {
                const name =
                  getDocumentName(
                    document,
                  );

                const category =
                  getCategory(
                    document,
                  );

                const url =
                  getFileUrl(
                    document,
                  );

                return (
                  <div
                    key={document._id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* Preview */}
                    <div className="flex h-40 items-center justify-center bg-slate-50">
                      {isImage(
                        document,
                      ) && url ? (
                        <img
                          src={url}
                          alt={name}
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                            {getDocumentIcon(
                              document,
                            )}
                          </div>

                          <span className="text-xs font-medium text-slate-500">
                            {isPdf(
                              document,
                            )
                              ? "PDF"
                              : "DOCUMENT"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-slate-900">
                            {name}
                          </h3>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {getFileName(
                              document,
                            )}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          {category}
                        </span>
                      </div>

                      {document.description && (
                        <p className="mb-3 line-clamp-2 text-sm text-slate-500">
                          {
                            document.description
                          }
                        </p>
                      )}

                      <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {formatDate(
                            document.createdAt ||
                              document.uploadedAt,
                          )}
                        </span>

                        <span>
                          {formatFileSize(
                            document.fileSize ||
                              document.size,
                          )}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDocument(
                              document,
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={16} />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownload(
                              document,
                            )
                          }
                          disabled={!url}
                          className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Download"
                        >
                          <Download
                            size={16}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              document,
                            )
                          }
                          disabled={
                            deletingId ===
                            document._id
                          }
                          className="flex items-center justify-center rounded-xl border border-red-200 px-3 py-2.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId ===
                          document._id ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={16}
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>

      {/* =================================================
          UPLOAD MODAL
      ================================================= */}

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 p-1.5">
                  <img
                    src="/logo.png"
                    alt="Sellopedia"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Upload Document
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Upload an employee
                    document
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowUpload(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleUpload}
              className="space-y-5 p-5 sm:p-6"
            >
              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        category:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                >
                  <option value="">
                    Select category
                  </option>

                  {DOCUMENT_CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Document Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Document Type
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <select
                  value={
                    form.documentType
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        documentType:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                >
                  <option value="">
                    Select document type
                  </option>

                  {DOCUMENT_TYPES.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Document Title
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        title:
                          event.target
                            .value,
                      }),
                    )
                  }
                  placeholder="e.g. Aadhaar Card"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                />
              </div>

              {/* File */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  File
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-red-400 hover:bg-red-50/30">
                  <Upload
                    size={28}
                    className="mb-3 text-[#FE0000]"
                  />

                  <span className="text-sm font-medium text-slate-700">
                    {form.file
                      ? form.file.name
                      : "Choose a file"}
                  </span>

                  <span className="mt-1 text-xs text-slate-400">
                    PDF, JPG, PNG or
                    other supported
                    files up to 10 MB
                  </span>

                  <input
                    type="file"
                    onChange={
                      handleFileChange
                    }
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  />
                </label>

                {form.file && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <span className="truncate">
                      {form.file.name}
                    </span>

                    <span className="ml-3 shrink-0">
                      {formatFileSize(
                        form.file.size,
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        description:
                          event.target
                            .value,
                      }),
                    )
                  }
                  rows={3}
                  placeholder="Add any additional information..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowUpload(false)
                  }
                  disabled={uploading}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload
                        size={17}
                      />
                      Upload Document
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          PREVIEW MODAL
      ================================================= */}

      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Preview Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 p-1.5 sm:flex">
                  <img
                    src="/logo.png"
                    alt="Sellopedia"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900">
                    {getDocumentName(
                      previewDocument,
                    )}
                  </h2>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {getFileName(
                      previewDocument,
                    )}
                  </p>
                </div>
              </div>

              <div className="ml-4 flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDownload(
                      previewDocument,
                    )
                  }
                  disabled={
                    !getFileUrl(
                      previewDocument,
                    )
                  }
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                  title="Download"
                >
                  <Download
                    size={19}
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPreviewDocument(
                      null,
                    )
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4 sm:p-6">
              {isImage(
                previewDocument,
              ) &&
              getFileUrl(
                previewDocument,
              ) ? (
                <div className="flex min-h-100 items-center justify-center">
                  <img
                    src={getFileUrl(
                      previewDocument,
                    )}
                    alt={getDocumentName(
                      previewDocument,
                    )}
                    className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-lg"
                  />
                </div>
              ) : isPdf(
                  previewDocument,
                ) &&
                getFileUrl(
                  previewDocument,
                ) ? (
                <iframe
                  src={getFileUrl(
                    previewDocument,
                  )}
                  title={getDocumentName(
                    previewDocument,
                  )}
                  className="h-[70vh] w-full rounded-xl border-0 bg-white"
                />
              ) : (
                <div className="flex min-h-100 flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm">
                    {getDocumentIcon(
                      previewDocument,
                    )}
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-900">
                    Preview not
                    available
                  </h3>

                  <p className="mt-1 max-w-md text-sm text-slate-500">
                    This file type
                    cannot be
                    previewed in the
                    browser. Download
                    the file to view
                    it.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(
                        previewDocument,
                      )
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    <Download
                      size={17}
                    />
                    Download File
                  </button>
                </div>
              )}
            </div>

            {/* Preview Footer */}
            <div className="border-t border-slate-200 bg-white px-5 py-3">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span>
                  Category:{" "}
                  <strong className="text-slate-700">
                    {getCategory(
                      previewDocument,
                    )}
                  </strong>
                </span>

                <span>
                  Uploaded:{" "}
                  <strong className="text-slate-700">
                    {formatDate(
                      previewDocument.createdAt ||
                        previewDocument.uploadedAt,
                    )}
                  </strong>
                </span>

                <span>
                  Size:{" "}
                  <strong className="text-slate-700">
                    {formatFileSize(
                      previewDocument.fileSize ||
                        previewDocument.size,
                    )}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;