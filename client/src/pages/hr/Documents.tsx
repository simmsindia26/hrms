import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  File,
  FileCheck2,
  FileText,
  Filter,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import api from "../../lib/axios";

type DocumentType =
  | "offer_letter"
  | "appointment_letter"
  | "payslip"
  | "aadhaar"
  | "pan"
  | "bank_document"
  | "education_certificate"
  | "experience_certificate"
  | "resume"
  | "warning_notice"
  | "disciplinary_notice"
  | "other";

interface Department {
  _id: string;
  name: string;
}

interface Employee {
  _id: string;
  employeeId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: {
    _id?: string;
    name?: string;
  } | string;
  designation?: {
    _id?: string;
    name?: string;
  } | string;
}

interface DocumentItem {
  _id: string;
  employee?: Employee | string | null;
  candidate?: {
    _id: string;
    name?: string;
    email?: string;
  } | string | null;

  type: DocumentType | string;
  title?: string;
  fileName?: string;
  originalFileName?: string;
  fileUrl?: string;
  mimeType?: string;
  fileSize?: number;

  issuedAt?: string;
  acknowledged?: boolean;
  acknowledgedAt?: string;

  uploadedBy?: {
    _id?: string;
    name?: string;
    email?: string;
  } | string;

  createdAt?: string;
  updatedAt?: string;

  metadata?: Record<string, unknown>;
}

const DOCUMENT_TYPES: Array<{
  value: DocumentType | "";
  label: string;
}> = [
  { value: "", label: "All Document Types" },
  { value: "offer_letter", label: "Offer Letter" },
  {
    value: "appointment_letter",
    label: "Appointment Letter",
  },
  { value: "payslip", label: "Payslip" },
  { value: "aadhaar", label: "Aadhaar" },
  { value: "pan", label: "PAN Card" },
  {
    value: "bank_document",
    label: "Bank Document",
  },
  {
    value: "education_certificate",
    label: "Education Certificate",
  },
  {
    value: "experience_certificate",
    label: "Experience Certificate",
  },
  { value: "resume", label: "Resume" },
  {
    value: "warning_notice",
    label: "Warning Notice",
  },
  {
    value: "disciplinary_notice",
    label: "Disciplinary Notice",
  },
  { value: "other", label: "Other" },
];

const PAGE_SIZE = 10;

function getEmployeeName(
  employee: DocumentItem["employee"]
): string {
  if (!employee) {
    return "Unknown Employee";
  }

  if (typeof employee === "string") {
    return employee;
  }

  if (employee.name) {
    return employee.name;
  }

  const firstName = employee.firstName || "";
  const lastName = employee.lastName || "";

  return (
    `${firstName} ${lastName}`.trim() ||
    "Unknown Employee"
  );
}
function IconButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
    >
      {children}
    </button>
  );
}
function getEmployeeId(
  employee: DocumentItem["employee"]
): string {
  if (!employee || typeof employee === "string") {
    return "";
  }

  return employee.employeeId || "";
}

function getEmployeeEmail(
  employee: DocumentItem["employee"]
): string {
  if (!employee || typeof employee === "string") {
    return "";
  }

  return employee.email || "";
}

function getDepartmentId(
  employee: DocumentItem["employee"]
): string {
  if (!employee || typeof employee === "string") {
    return "";
  }

  if (
    employee.department &&
    typeof employee.department === "object"
  ) {
    return employee.department._id || "";
  }

  if (typeof employee.department === "string") {
    return employee.department;
  }

  return "";
}

function getDepartmentName(
  employee: DocumentItem["employee"]
): string {
  if (!employee || typeof employee === "string") {
    return "";
  }

  if (
    employee.department &&
    typeof employee.department === "object"
  ) {
    return employee.department.name || "";
  }

  return "";
}

function getDocumentTypeLabel(type?: string) {
  const found = DOCUMENT_TYPES.find(
    (item) => item.value === type
  );

  if (found) {
    return found.label;
  }

  if (!type) {
    return "Document";
  }

  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDate(date?: string) {
  if (!date) {
    return "-";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes <= 0) {
    return "-";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(
    bytes /
    (1024 * 1024 * 1024)
  ).toFixed(1)} GB`;
}

function getFileIcon(mimeType?: string) {
  if (
    mimeType?.includes("pdf") ||
    mimeType?.includes("document") ||
    mimeType?.includes("text")
  ) {
    return FileText;
  }

  return File;
}

export default function Documents() {
  const [documents, setDocuments] = useState<
    DocumentItem[]
  >([]);

  const [employees, setEmployees] = useState<
    Employee[]
  >([]);

  const [departments, setDepartments] = useState<
    Department[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] = useState("");
  const [documentType, setDocumentType] =
    useState("");
  const [employeeFilter, setEmployeeFilter] =
    useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("");
  const [acknowledgedFilter, setAcknowledgedFilter] =
    useState("");

  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] =
    useState(false);

  const [selectedDocument, setSelectedDocument] =
    useState<DocumentItem | null>(null);

  const [showUploadModal, setShowUploadModal] =
    useState(false);

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        documentsResponse,
        employeesResponse,
        departmentsResponse,
      ] = await Promise.allSettled([
        api.get("/documents"),
        api.get("/hr/employees"),
        api.get("/hr/departments"),
      ]);

      if (
        documentsResponse.status === "fulfilled"
      ) {
        const data =
          documentsResponse.value.data;

        const items =
          data?.data?.items ||
          data?.data?.documents ||
          data?.items ||
          data?.documents ||
          data?.data ||
          [];

        setDocuments(
          Array.isArray(items) ? items : []
        );
      }

      if (
        employeesResponse.status ===
        "fulfilled"
      ) {
        const data =
          employeesResponse.value.data;

        const items =
          data?.data?.items ||
          data?.data?.employees ||
          data?.items ||
          data?.employees ||
          data?.data ||
          [];

        setEmployees(
          Array.isArray(items) ? items : []
        );
      }

      if (
        departmentsResponse.status ===
        "fulfilled"
      ) {
        const data =
          departmentsResponse.value.data;

        const items =
          data?.data?.items ||
          data?.data?.departments ||
          data?.items ||
          data?.departments ||
          data?.data ||
          [];

        setDepartments(
          Array.isArray(items) ? items : []
        );
      }
    } catch (error) {
      console.error(
        "Failed to load documents:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    documentType,
    employeeFilter,
    departmentFilter,
    acknowledgedFilter,
  ]);

  const filteredDocuments = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return documents.filter((document) => {
      const employeeName =
        getEmployeeName(
          document.employee
        ).toLowerCase();

      const employeeId =
        getEmployeeId(
          document.employee
        ).toLowerCase();

      const employeeEmail =
        getEmployeeEmail(
          document.employee
        ).toLowerCase();

      const title =
        (
          document.title ||
          ""
        ).toLowerCase();

      const fileName =
        (
          document.originalFileName ||
          document.fileName ||
          ""
        ).toLowerCase();

      const matchesSearch =
        !query ||
        employeeName.includes(query) ||
        employeeId.includes(query) ||
        employeeEmail.includes(query) ||
        title.includes(query) ||
        fileName.includes(query);

      const matchesType =
        !documentType ||
        document.type === documentType;

      const matchesEmployee =
        !employeeFilter ||
        (typeof document.employee ===
          "object" &&
          document.employee?._id ===
            employeeFilter);

      const matchesDepartment =
        !departmentFilter ||
        getDepartmentId(
          document.employee
        ) === departmentFilter;

      const matchesAcknowledgement =
        !acknowledgedFilter ||
        (acknowledgedFilter ===
          "acknowledged" &&
          document.acknowledged === true) ||
        (acknowledgedFilter ===
          "pending" &&
          document.acknowledged !== true);

      return (
        matchesSearch &&
        matchesType &&
        matchesEmployee &&
        matchesDepartment &&
        matchesAcknowledgement
      );
    });
  }, [
    documents,
    search,
    documentType,
    employeeFilter,
    departmentFilter,
    acknowledgedFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredDocuments.length /
        PAGE_SIZE
    )
  );

  const paginatedDocuments =
    useMemo(() => {
      const start =
        (page - 1) * PAGE_SIZE;

      return filteredDocuments.slice(
        start,
        start + PAGE_SIZE
      );
    }, [
      filteredDocuments,
      page,
    ]);

  const statistics = useMemo(() => {
    const acknowledged =
      documents.filter(
        (document) =>
          document.acknowledged === true
      ).length;

    const pending =
      documents.length -
      acknowledged;

    const pdfs = documents.filter(
      (document) =>
        document.mimeType?.includes(
          "pdf"
        )
    ).length;

    return {
      total: documents.length,
      acknowledged,
      pending,
      pdfs,
    };
  }, [documents]);

  const hasFilters =
    Boolean(search) ||
    Boolean(documentType) ||
    Boolean(employeeFilter) ||
    Boolean(departmentFilter) ||
    Boolean(acknowledgedFilter);

  function clearFilters() {
    setSearch("");
    setDocumentType("");
    setEmployeeFilter("");
    setDepartmentFilter("");
    setAcknowledgedFilter("");
    setPage(1);
  }

  

const downloadDocument = async (
  documentItem: DocumentItem
) => {
  try {
    const response = await api.get(
      `/hr/documents/${documentItem._id}/download`,
      {
        responseType: "blob",
      }
    );

    // Use the MIME type stored with the document.
    // Do not read response.headers here because Axios
    // types headers as AxiosHeaders / mixed values.
    const mimeType: string =
      typeof documentItem.mimeType === "string" &&
      documentItem.mimeType.trim()
        ? documentItem.mimeType
        : "application/octet-stream";

    const blob = new Blob(
      [response.data],
      {
        type: mimeType,
      }
    );

    const url =
      window.URL.createObjectURL(blob);

    const anchor =
      window.document.createElement("a");

    anchor.href = url;

    anchor.download =
      typeof documentItem.fileName === "string" &&
      documentItem.fileName.trim()
        ? documentItem.fileName
        : typeof documentItem.title === "string" &&
          documentItem.title.trim()
        ? documentItem.title
        : "document";

    window.document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(
      "Failed to download document:",
      error
    );

    alert(
      "Unable to download this document."
    );
  }
};
  async function acknowledgeDocument(
    documentItem: DocumentItem
  ) {
    try {
      await api.patch(
        `/documents/${documentItem._id}/acknowledge`
      );

      setDocuments((current) =>
        current.map((item) =>
          item._id ===
          documentItem._id
            ? {
                ...item,
                acknowledged: true,
                acknowledgedAt:
                  new Date().toISOString(),
              }
            : item
        )
      );

      setSelectedDocument(
        (current) =>
          current &&
          current._id ===
            documentItem._id
            ? {
                ...current,
                acknowledged: true,
                acknowledgedAt:
                  new Date().toISOString(),
              }
            : current
      );
    } catch (error) {
      console.error(
        "Failed to acknowledge document:",
        error
      );

      alert(
        "Unable to update document status."
      );
    }
  }

  async function deleteDocument(
    documentItem: DocumentItem
  ) {
    const confirmed = window.confirm(
      `Delete "${
        documentItem.originalFileName ||
        documentItem.fileName ||
        "this document"
      }"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/documents/${documentItem._id}`
      );

      setDocuments((current) =>
        current.filter(
          (item) =>
            item._id !==
            documentItem._id
        )
      );

      setSelectedDocument(null);
    } catch (error) {
      console.error(
        "Failed to delete document:",
        error
      );

      alert(
        "Unable to delete this document. Your account may not have permission."
      );
    }
  }

  function handleUploadComplete(
    uploadedDocument?: DocumentItem
  ) {
    setShowUploadModal(false);

    if (uploadedDocument) {
      setDocuments((current) => [
        uploadedDocument,
        ...current,
      ]);
    } else {
      loadData(true);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-125 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>
            Loading documents...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <FileText className="h-4 w-4" />
            HR Management
            <span>/</span>
            Documents
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Employee Documents
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage employee HR documents and
            securely access protected files.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              loadData(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshIcon
              spinning={refreshing}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              setShowUploadModal(
                true
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Documents"
          value={statistics.total}
          icon={
            <FileText className="h-5 w-5" />
          }
        />

        <StatCard
          title="Acknowledged"
          value={
            statistics.acknowledged
          }
          icon={
            <FileCheck2 className="h-5 w-5" />
          }
          valueClass="text-emerald-700"
          className="bg-emerald-50"
        />

        <StatCard
          title="Pending Acknowledgement"
          value={statistics.pending}
          icon={
            <AlertCircle className="h-5 w-5" />
          }
          valueClass="text-amber-700"
          className="bg-amber-50"
        />

        <StatCard
          title="PDF Documents"
          value={statistics.pdfs}
          icon={
            <ShieldCheck className="h-5 w-5" />
          }
          valueClass="text-blue-700"
          className="bg-blue-50"
        />
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search employee, document name, file name..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setShowFilters(
                (value) => !value
              )
            }
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
              showFilters || hasFilters
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters

            {hasFilters && (
              <span className="rounded-full bg-white px-1.5 py-0.5 text-xs text-slate-900">
                Active
              </span>
            )}
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              label="Document Type"
              value={documentType}
              onChange={
                setDocumentType
              }
              options={DOCUMENT_TYPES}
            />

            <FilterSelect
              label="Employee"
              value={employeeFilter}
              onChange={
                setEmployeeFilter
              }
              options={[
                {
                  value: "",
                  label:
                    "All Employees",
                },
                ...employees.map(
                  (employee) => ({
                    value:
                      employee._id,
                    label:
                      getEmployeeDisplayName(
                        employee
                      ),
                  })
                ),
              ]}
            />

            <FilterSelect
              label="Department"
              value={
                departmentFilter
              }
              onChange={
                setDepartmentFilter
              }
              options={[
                {
                  value: "",
                  label:
                    "All Departments",
                },
                ...departments.map(
                  (department) => ({
                    value:
                      department._id,
                    label:
                      department.name,
                  })
                ),
              ]}
            />

            <FilterSelect
              label="Acknowledgement"
              value={
                acknowledgedFilter
              }
              onChange={
                setAcknowledgedFilter
              }
              options={[
                {
                  value: "",
                  label: "All Documents",
                },
                {
                  value:
                    "acknowledged",
                  label:
                    "Acknowledged",
                },
                {
                  value: "pending",
                  label:
                    "Pending",
                },
              ]}
            />
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Document Records
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {filteredDocuments.length}{" "}
              document
              {filteredDocuments.length !==
              1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Secure document access
          </div>
        </div>

        {paginatedDocuments.length ===
        0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onClear={clearFilters}
            onUpload={() =>
              setShowUploadModal(
                true
              )
            }
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Document
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Employee
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Size
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Uploaded
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedDocuments.map(
                    (documentItem) => (
                      <DocumentTableRow
                        key={
                          documentItem._id
                        }
                        documentItem={
                          documentItem
                        }
                        onView={() =>
                          setSelectedDocument(
                            documentItem
                          )
                        }
                        onDownload={() =>
                          downloadDocument(
                            documentItem
                          )
                        }
                        onAcknowledge={() =>
                          acknowledgeDocument(
                            documentItem
                          )
                        }
                        onDelete={() =>
                          deleteDocument(
                            documentItem
                          )
                        }
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-slate-100 lg:hidden">
              {paginatedDocuments.map(
                (documentItem) => (
                  <DocumentMobileCard
                    key={
                      documentItem._id
                    }
                    documentItem={
                      documentItem
                    }
                    onView={() =>
                      setSelectedDocument(
                        documentItem
                      )
                    }
                    onDownload={() =>
                      downloadDocument(
                        documentItem
                      )
                    }
                    onAcknowledge={() =>
                      acknowledgeDocument(
                        documentItem
                      )
                    }
                    onDelete={() =>
                      deleteDocument(
                        documentItem
                      )
                    }
                  />
                )
              )}
            </div>
          </>
        )}

        {/* Pagination */}
        {filteredDocuments.length >
          0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of{" "}
              {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((value) =>
                    Math.max(
                      1,
                      value - 1
                    )
                  )
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                disabled={
                  page >= totalPages
                }
                onClick={() =>
                  setPage((value) =>
                    Math.min(
                      totalPages,
                      value + 1
                    )
                  )
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      {selectedDocument && (
        <DocumentDetailsModal
          documentItem={
            selectedDocument
          }
          onClose={() =>
            setSelectedDocument(null)
          }
          onDownload={() =>
            downloadDocument(
              selectedDocument
            )
          }
          onAcknowledge={() =>
            acknowledgeDocument(
              selectedDocument
            )
          }
          onDelete={() =>
            deleteDocument(
              selectedDocument
            )
          }
        />
      )}

      {/* Upload */}
      {showUploadModal && (
        <UploadDocumentModal
          employees={employees}
          onClose={() =>
            setShowUploadModal(false)
          }
          onComplete={
            handleUploadComplete
          }
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Employee Display                                                           */
/* -------------------------------------------------------------------------- */

function getEmployeeDisplayName(
  employee: Employee
) {
  if (employee.name) {
    return employee.name;
  }

  const name =
    `${employee.firstName || ""} ${
      employee.lastName || ""
    }`.trim();

  if (name) {
    return name;
  }

  return (
    employee.employeeId ||
    employee.email ||
    "Employee"
  );
}

/* -------------------------------------------------------------------------- */
/* Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  icon,
  className = "bg-white",
  valueClass = "text-slate-900",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
  valueClass?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${valueClass}`}
          >
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-white p-2.5 text-slate-600 shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Filter Select                                                              */
/* -------------------------------------------------------------------------- */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
      >
        {options.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Table Row                                                                  */
/* -------------------------------------------------------------------------- */

function DocumentTableRow({
  documentItem,
  onView,
  onDownload,
  onAcknowledge,
  onDelete,
}: {
  documentItem: DocumentItem;
  onView: () => void;
  onDownload: () => void;
  onAcknowledge: () => void;
  onDelete: () => void;
}) {
  const Icon = getFileIcon(
    documentItem.mimeType
  );

  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="flex min-w-[240px] items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {documentItem.title ||
                documentItem.originalFileName ||
                documentItem.fileName ||
                "Untitled Document"}
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {documentItem.originalFileName ||
                documentItem.fileName ||
                "-"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <User className="h-4 w-4 text-slate-500" />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-800">
              {getEmployeeName(
                documentItem.employee
              )}
            </p>

            <p className="text-xs text-slate-500">
              {getEmployeeId(
                documentItem.employee
              ) ||
                getEmployeeEmail(
                  documentItem.employee
                ) ||
                "-"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {getDocumentTypeLabel(
            documentItem.type
          )}
        </span>
      </td>

      <td className="px-5 py-4 text-sm text-slate-600">
        {formatFileSize(
          documentItem.fileSize
        )}
      </td>

      <td className="px-5 py-4 text-sm text-slate-600">
        {formatDate(
          documentItem.createdAt ||
            documentItem.issuedAt
        )}
      </td>

      <td className="px-5 py-4">
        {documentItem.acknowledged ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Acknowledged
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" />
            Pending
          </span>
        )}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1.5">
          <IconButton
            title="View"
            onClick={onView}
          >
            <Eye className="h-4 w-4" />
          </IconButton>

          <IconButton
            title="Download"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
          </IconButton>

          {!documentItem.acknowledged && (
            <IconButton
              title="Mark acknowledged"
              onClick={
                onAcknowledge
              }
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </IconButton>
          )}

          <IconButton
            title="Delete"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </IconButton>
        </div>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile Card                                                                */
/* -------------------------------------------------------------------------- */

function DocumentMobileCard({
  documentItem,
  onView,
  onDownload,
  onAcknowledge,
  onDelete,
}: {
  documentItem: DocumentItem;
  onView: () => void;
  onDownload: () => void;
  onAcknowledge: () => void;
  onDelete: () => void;
}) {
  const Icon = getFileIcon(
    documentItem.mimeType
  );

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {documentItem.title ||
              documentItem.originalFileName ||
              documentItem.fileName ||
              "Untitled Document"}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-500">
            {documentItem.originalFileName ||
              documentItem.fileName ||
              "-"}
          </p>
        </div>

        {documentItem.acknowledged ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
        <InfoItem
          label="Employee"
          value={getEmployeeName(
            documentItem.employee
          )}
        />

        <InfoItem
          label="Type"
          value={getDocumentTypeLabel(
            documentItem.type
          )}
        />

        <InfoItem
          label="Size"
          value={formatFileSize(
            documentItem.fileSize
          )}
        />

        <InfoItem
          label="Uploaded"
          value={formatDate(
            documentItem.createdAt
          )}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onView}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>

        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>

        {!documentItem.acknowledged && (
          <button
            type="button"
            onClick={onAcknowledge}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Acknowledge
          </button>
        )}

        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Info Item                                                                  */
/* -------------------------------------------------------------------------- */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty State                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({
  hasFilters,
  onClear,
  onUpload,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onUpload: () => void;
}) {
  return (
    <div className="flex min-h-75 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FileText className="h-7 w-7" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        No documents found
      </h3>

      <p className="mt-1 max-w-md text-sm text-slate-500">
        {hasFilters
          ? "No documents match your current filters."
          : "No employee documents have been uploaded yet."}
      </p>

      <div className="mt-4 flex gap-2">
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear Filters
          </button>
        )}

        <button
          type="button"
          onClick={onUpload}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Details Modal                                                              */
/* -------------------------------------------------------------------------- */

function DocumentDetailsModal({
  documentItem,
  onClose,
  onDownload,
  onAcknowledge,
  onDelete,
}: {
  documentItem: DocumentItem;
  onClose: () => void;
  onDownload: () => void;
  onAcknowledge: () => void;
  onDelete: () => void;
}) {
  const Icon = getFileIcon(
    documentItem.mimeType
  );

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Document Details
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Secure employee document
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
              <Icon className="h-7 w-7" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-slate-900">
                {documentItem.title ||
                  documentItem.originalFileName ||
                  documentItem.fileName ||
                  "Untitled Document"}
              </h3>

              <p className="mt-1 truncate text-sm text-slate-500">
                {documentItem.originalFileName ||
                  documentItem.fileName ||
                  "-"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailBox
              label="Employee"
              value={getEmployeeName(
                documentItem.employee
              )}
            />

            <DetailBox
              label="Employee ID"
              value={
                getEmployeeId(
                  documentItem.employee
                ) || "-"
              }
            />

            <DetailBox
              label="Department"
              value={
                getDepartmentName(
                  documentItem.employee
                ) || "-"
              }
            />

            <DetailBox
              label="Document Type"
              value={getDocumentTypeLabel(
                documentItem.type
              )}
            />

            <DetailBox
              label="File Type"
              value={
                documentItem.mimeType ||
                "-"
              }
            />

            <DetailBox
              label="File Size"
              value={formatFileSize(
                documentItem.fileSize
              )}
            />

            <DetailBox
              label="Uploaded"
              value={formatDate(
                documentItem.createdAt
              )}
            />

            <DetailBox
              label="Issued"
              value={formatDate(
                documentItem.issuedAt
              )}
            />

            <DetailBox
              label="Acknowledgement"
              value={
                documentItem.acknowledged
                  ? "Acknowledged"
                  : "Pending"
              }
            />

            <DetailBox
              label="Acknowledged On"
              value={formatDate(
                documentItem.acknowledgedAt
              )}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>

          {!documentItem.acknowledged && (
            <button
              type="button"
              onClick={onAcknowledge}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Acknowledge
            </button>
          )}

          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Download
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail Box                                                                 */
/* -------------------------------------------------------------------------- */

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Upload Modal                                                               */
/* -------------------------------------------------------------------------- */

function UploadDocumentModal({
  employees,
  onClose,
  onComplete,
}: {
  employees: Employee[];
  onClose: () => void;
  onComplete: (
    document?: DocumentItem
  ) => void;
}) {
  const [employee, setEmployee] =
    useState("");

  const [type, setType] =
    useState<DocumentType>(
      "other"
    );

  const [title, setTitle] =
    useState("");

  const [issuedAt, setIssuedAt] =
    useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submitUpload(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");

    if (!employee) {
      setError(
        "Please select an employee."
      );
      return;
    }

    if (!file) {
      setError(
        "Please select a document file."
      );
      return;
    }

    const formData =
      new FormData();

    formData.append(
      "employee",
      employee
    );

    formData.append(
      "type",
      type
    );

    if (title.trim()) {
      formData.append(
        "title",
        title.trim()
      );
    }

    if (issuedAt) {
      formData.append(
        "issuedAt",
        issuedAt
      );
    }

    formData.append(
      "file",
      file
    );

    try {
      setUploading(true);

      const response = await api.post(
        "/documents/upload",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      const data = response.data;

      const uploaded =
        data?.data?.document ||
        data?.document ||
        data?.data;

      onComplete(uploaded);
    } catch (uploadError) {
      console.error(
        "Document upload failed:",
        uploadError
      );

      setError(
        "Unable to upload document. Please check the file and try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Upload Document
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Upload a protected employee HR
              document.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={submitUpload}
          className="p-6"
        >
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <FormField label="Employee *">
              <select
                value={employee}
                onChange={(event) =>
                  setEmployee(
                    event.target.value
                  )
                }
                disabled={uploading}
                className="form-input"
              >
                <option value="">
                  Select employee
                </option>

                {employees.map(
                  (item) => (
                    <option
                      key={item._id}
                      value={item._id}
                    >
                      {getEmployeeDisplayName(
                        item
                      )}
                      {item.employeeId
                        ? ` (${item.employeeId})`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Document Type *">
              <select
                value={type}
                onChange={(event) =>
                  setType(
                    event.target
                      .value as DocumentType
                  )
                }
                disabled={uploading}
                className="form-input"
              >
                {DOCUMENT_TYPES.filter(
                  (item) =>
                    item.value
                ).map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Document Title">
              <input
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                disabled={uploading}
                placeholder="e.g. Aadhaar Card - Front & Back"
                className="form-input"
              />
            </FormField>

            <FormField label="Issued Date">
              <input
                type="date"
                value={issuedAt}
                onChange={(event) =>
                  setIssuedAt(
                    event.target.value
                  )
                }
                disabled={uploading}
                className="form-input"
              />
            </FormField>

            <FormField label="File *">
              <label
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                  file
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <Upload className="h-7 w-7 text-slate-400" />

                <span className="mt-2 text-sm font-semibold text-slate-700">
                  {file
                    ? file.name
                    : "Choose a document"}
                </span>

                <span className="mt-1 text-xs text-slate-500">
                  PDF, JPG, PNG or WEBP
                </span>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(event) =>
                    setFile(
                      event.target
                        .files?.[0] ||
                        null
                    )
                  }
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              {file && (
                <p className="mt-2 text-xs text-slate-500">
                  Size:{" "}
                  {formatFileSize(
                    file.size
                  )}
                </p>
              )}
            </FormField>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

/* -------------------------------------------------------------------------- */
/* Form Field                                                                 */
/* -------------------------------------------------------------------------- */

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Refresh Icon                                                               */
/* -------------------------------------------------------------------------- */

function RefreshIcon({
  spinning,
}: {
  spinning: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-4 w-4 ${
        spinning ? "animate-spin" : ""
      }`}
    >
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal Overlay                                                              */
/* -------------------------------------------------------------------------- */

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
}
