import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../lib/axios";

/* =========================================================
   TYPES
========================================================= */

type Department = {
  _id: string;
  name: string;
};

type Designation = {
  _id: string;
  name: string;
};

type Skill = {
  name: string;
  level:
    | "beginner"
    | "intermediate"
    | "advanced"
    | "expert";
  required: boolean;
};

type HiringStep = {
  title: string;
  description: string;
};

type JobForm = {
  title: string;
  jobCode: string;

  department: string;
  designation: string;

  shortDescription: string;
  description: string;

  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  preferredQualifications: string[];

  skills: Skill[];

  minimumExperience: number;
  maximumExperience: string;

  minimumQualification: string;
  preferredQualification: string;
  educationFields: string[];

  employmentType:
    | "full_time"
    | "part_time"
    | "contract"
    | "internship";

  workMode:
    | "office"
    | "hybrid"
    | "remote";

  location: string;
  openings: number;

  salaryDisclosed: boolean;
  salaryMinimum: string;
  salaryMaximum: string;
  salaryCurrency: string;
  salaryPeriod:
    | "hourly"
    | "monthly"
    | "yearly";
  salaryDescription: string;

  benefits: string[];

  hiringProcess: HiringStep[];

  applicationEmail: string;
  applicationInstructions: string;

  closingDate: string;

  internalNotes: string;
};

/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm: JobForm = {
  title: "",
  jobCode: "",

  department: "",
  designation: "",

  shortDescription: "",
  description: "",

  responsibilities: [""],
  requirements: [""],
  qualifications: [""],
  preferredQualifications: [""],

  skills: [
    {
      name: "",
      level: "intermediate",
      required: true,
    },
  ],

  minimumExperience: 0,
  maximumExperience: "",

  minimumQualification: "",
  preferredQualification: "",
  educationFields: [""],

  employmentType: "full_time",
  workMode: "office",

  location: "",
  openings: 1,

  salaryDisclosed: false,
  salaryMinimum: "",
  salaryMaximum: "",
  salaryCurrency: "INR",
  salaryPeriod: "yearly",
  salaryDescription: "",

  benefits: [""],

  hiringProcess: [
    {
      title: "Application Screening",
      description: "",
    },
    {
      title: "Technical Interview",
      description: "",
    },
    {
      title: "HR Interview",
      description: "",
    },
    {
      title: "Final Selection",
      description: "",
    },
  ],

  applicationEmail: "",
  applicationInstructions: "",

  closingDate: "",

  internalNotes: "",
};

/* =========================================================
   HELPERS
========================================================= */

function cleanStrings(
  values: string[]
) {
  return values
    .map((value) => value.trim())
    .filter(Boolean);
}

function cleanRequirementList(
  values: string[]
) {
  return cleanStrings(values).map(
    (text) => ({
      text,
    })
  );
}



/* =========================================================
   COMPONENT
========================================================= */

export default function JobOpeningForm() {
  const navigate = useNavigate();

  const { id } = useParams<{
    id: string;
  }>();

  const isEditMode = Boolean(id);

  const [form, setForm] =
    useState<JobForm>(initialForm);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [designations, setDesignations] =
    useState<Designation[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [initialLoading, setInitialLoading] =
    useState(isEditMode);

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  const [activeSection, setActiveSection] =
    useState("basic");

  /* =====================================================
     LOAD DATA
  ===================================================== */

  useEffect(() => {
    loadDependencies();

    if (isEditMode && id) {
      loadJob(id);
    }
  }, [id, isEditMode]);

  async function loadDependencies() {
    try {
      const [
        departmentResponse,
        designationResponse,
      ] = await Promise.all([
        api.get("/hr/departments"),
        api.get("/hr/designations"),
      ]);

      setDepartments(
        departmentResponse.data?.data
          ?.items ||
          departmentResponse.data?.data ||
          []
      );

      setDesignations(
        designationResponse.data?.data
          ?.items ||
          designationResponse.data?.data ||
          []
      );
    } catch (error) {
      console.error(
        "Failed to load departments/designations:",
        error
      );
    }
  }

  async function loadJob(jobId: string) {
    try {
      setInitialLoading(true);

      const response =
        await api.get(`/jobs/${jobId}`);

      const job =
        response.data?.data;

      if (!job) {
        throw new Error(
          "Job not found"
        );
      }

      setForm({
        title:
          job.title || "",

        jobCode:
          job.jobCode || "",

        department:
          job.department?._id ||
          job.department ||
          "",

        designation:
          job.designation?._id ||
          job.designation ||
          "",

        shortDescription:
          job.shortDescription || "",

        description:
          job.description || "",

        responsibilities:
          job.responsibilities?.length
            ? job.responsibilities.map(
                (item: {
                  text: string;
                }) => item.text
              )
            : [""],

        requirements:
          job.requirements?.length
            ? job.requirements.map(
                (item: {
                  text: string;
                }) => item.text
              )
            : [""],

        qualifications:
          job.qualifications?.length
            ? job.qualifications.map(
                (item: {
                  text: string;
                }) => item.text
              )
            : [""],

        preferredQualifications:
          job.preferredQualifications
            ?.length
            ? job.preferredQualifications.map(
                (item: {
                  text: string;
                }) => item.text
              )
            : [""],

        skills:
          job.skills?.length
            ? job.skills
            : [
                {
                  name: "",
                  level: "intermediate",
                  required: true,
                },
              ],

        minimumExperience:
          job.experience
            ?.minimumYears || 0,

        maximumExperience:
          job.experience
            ?.maximumYears !== null &&
          job.experience
            ?.maximumYears !== undefined
            ? String(
                job.experience.maximumYears
              )
            : "",

        minimumQualification:
          job.education
            ?.minimumQualification ||
          "",

        preferredQualification:
          job.education
            ?.preferredQualification ||
          "",

        educationFields:
          job.education?.fields?.length
            ? job.education.fields
            : [""],

        employmentType:
          job.employmentType ||
          "full_time",

        workMode:
          job.workMode ||
          "office",

        location:
          job.location || "",

        openings:
          job.openings || 1,

        salaryDisclosed:
          job.salary?.isDisclosed ||
          false,

        salaryMinimum:
          job.salary?.minimum !== null &&
          job.salary?.minimum !== undefined
            ? String(
                job.salary.minimum
              )
            : "",

        salaryMaximum:
          job.salary?.maximum !== null &&
          job.salary?.maximum !== undefined
            ? String(
                job.salary.maximum
              )
            : "",

        salaryCurrency:
          job.salary?.currency ||
          "INR",

        salaryPeriod:
          job.salary?.period ||
          "yearly",

        salaryDescription:
          job.salary?.description ||
          "",

        benefits:
          job.benefits?.length
            ? job.benefits
            : [""],

        hiringProcess:
          job.hiringProcess?.length
            ? job.hiringProcess
            : initialForm.hiringProcess,

        applicationEmail:
          job.applicationEmail ||
          "",

        applicationInstructions:
          job.applicationInstructions ||
          "",

        closingDate:
          job.closingDate
            ? new Date(
                job.closingDate
              )
                .toISOString()
                .split("T")[0]
            : "",

        internalNotes:
          job.internalNotes || "",
      });
    } catch (error) {
      console.error(
        "Failed to load job:",
        error
      );

      alert(
        "Unable to load job opening."
      );

      navigate("/hr/recruitment");
    } finally {
      setInitialLoading(false);
    }
  }

  /* =====================================================
     FIELD UPDATE
  ===================================================== */

  function updateField<
    K extends keyof JobForm
  >(
    field: K,
    value: JobForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((previous) => {
        const next = {
          ...previous,
        };

        delete next[field];

        return next;
      });
    }
  }

  /* =====================================================
     ARRAY HELPERS
  ===================================================== */

  function updateArrayItem(
    field:
      | "responsibilities"
      | "requirements"
      | "qualifications"
      | "preferredQualifications"
      | "educationFields"
      | "benefits",
    index: number,
    value: string
  ) {
    setForm((previous) => {
      const array = [
        ...previous[field],
      ];

      array[index] = value;

      return {
        ...previous,
        [field]: array,
      };
    });
  }

  function addArrayItem(
    field:
      | "responsibilities"
      | "requirements"
      | "qualifications"
      | "preferredQualifications"
      | "educationFields"
      | "benefits"
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: [
        ...previous[field],
        "",
      ],
    }));
  }

  function removeArrayItem(
    field:
      | "responsibilities"
      | "requirements"
      | "qualifications"
      | "preferredQualifications"
      | "educationFields"
      | "benefits",
    index: number
  ) {
    setForm((previous) => {
      const array =
        previous[field].filter(
          (_, itemIndex) =>
            itemIndex !== index
        );

      return {
        ...previous,
        [field]:
          array.length
            ? array
            : [""],
      };
    });
  }

  /* =====================================================
     SKILLS
  ===================================================== */

  function updateSkill(
    index: number,
    field: keyof Skill,
    value:
      | string
      | boolean
  ) {
    setForm((previous) => {
      const skills = [
        ...previous.skills,
      ];

      skills[index] = {
        ...skills[index],
        [field]: value,
      };

      return {
        ...previous,
        skills,
      };
    });
  }

  function addSkill() {
    setForm((previous) => ({
      ...previous,
      skills: [
        ...previous.skills,
        {
          name: "",
          level: "intermediate",
          required: true,
        },
      ],
    }));
  }

  function removeSkill(
    index: number
  ) {
    setForm((previous) => {
      const skills =
        previous.skills.filter(
          (_, skillIndex) =>
            skillIndex !== index
        );

      return {
        ...previous,
        skills: skills.length
          ? skills
          : [
              {
                name: "",
                level: "intermediate",
                required: true,
              },
            ],
      };
    });
  }

  /* =====================================================
     HIRING PROCESS
  ===================================================== */

  function updateHiringStep(
    index: number,
    field: keyof HiringStep,
    value: string
  ) {
    setForm((previous) => {
      const hiringProcess = [
        ...previous.hiringProcess,
      ];

      hiringProcess[index] = {
        ...hiringProcess[index],
        [field]: value,
      };

      return {
        ...previous,
        hiringProcess,
      };
    });
  }

  function addHiringStep() {
    setForm((previous) => ({
      ...previous,
      hiringProcess: [
        ...previous.hiringProcess,
        {
          title: "",
          description: "",
        },
      ],
    }));
  }

  function removeHiringStep(
    index: number
  ) {
    setForm((previous) => {
      const hiringProcess =
        previous.hiringProcess.filter(
          (_, itemIndex) =>
            itemIndex !== index
        );

      return {
        ...previous,
        hiringProcess,
      };
    });
  }

  /* =====================================================
     VALIDATION
  ===================================================== */

  function validateForm() {
    const validationErrors: Record<
      string,
      string
    > = {};

    if (!form.title.trim()) {
      validationErrors.title =
        "Job title is required.";
    }

    if (!form.description.trim()) {
      validationErrors.description =
        "Job description is required.";
    }

    if (!form.location.trim()) {
      validationErrors.location =
        "Location is required.";
    }

    if (
      !form.openings ||
      form.openings < 1
    ) {
      validationErrors.openings =
        "At least one opening is required.";
    }

    if (
      form.salaryDisclosed &&
      form.salaryMinimum &&
      form.salaryMaximum &&
      Number(form.salaryMinimum) >
        Number(form.salaryMaximum)
    ) {
      validationErrors.salary =
        "Minimum salary cannot be greater than maximum salary.";
    }

    if (
      form.minimumExperience < 0
    ) {
      validationErrors.experience =
        "Experience cannot be negative.";
    }

    setErrors(
      validationErrors
    );

    if (
      Object.keys(
        validationErrors
      ).length
    ) {
      const firstError =
        Object.keys(
          validationErrors
        )[0];

      const section =
        getSectionForField(
          firstError
        );

      setActiveSection(section);

      return false;
    }

    return true;
  }

  function getSectionForField(
    field: string
  ) {
    if (
      [
        "title",
        "department",
        "designation",
      ].includes(field)
    ) {
      return "basic";
    }

    if (
      [
        "description",
      ].includes(field)
    ) {
      return "description";
    }

    if (
      [
        "experience",
      ].includes(field)
    ) {
      return "experience";
    }

    if (
      [
        "location",
        "openings",
      ].includes(field)
    ) {
      return "employment";
    }

    if (
      ["salary"].includes(field)
    ) {
      return "salary";
    }

    return "basic";
  }

  /* =====================================================
     BUILD PAYLOAD
  ===================================================== */

  function buildPayload() {
    return {
      title: form.title.trim(),

      jobCode:
        form.jobCode.trim() ||
        undefined,

      department:
        form.department || null,

      designation:
        form.designation || null,

      shortDescription:
        form.shortDescription.trim(),

      description:
        form.description.trim(),

      responsibilities:
        cleanRequirementList(
          form.responsibilities
        ),

      requirements:
        cleanRequirementList(
          form.requirements
        ),

      qualifications:
        cleanRequirementList(
          form.qualifications
        ),

      preferredQualifications:
        cleanRequirementList(
          form.preferredQualifications
        ),

      skills: form.skills
        .filter(
          (skill) =>
            skill.name.trim()
        )
        .map((skill) => ({
          name: skill.name.trim(),
          level: skill.level,
          required:
            skill.required,
        })),

      experience: {
        minimumYears:
          Number(
            form.minimumExperience
          ) || 0,

        maximumYears:
          form.maximumExperience === ""
            ? null
            : Number(
                form.maximumExperience
              ),
      },

      education: {
        minimumQualification:
          form.minimumQualification.trim(),

        preferredQualification:
          form.preferredQualification.trim(),

        fields:
          cleanStrings(
            form.educationFields
          ),
      },

      employmentType:
        form.employmentType,

      workMode:
        form.workMode,

      location:
        form.location.trim(),

      openings:
        Number(form.openings) || 1,

      salary: {
        isDisclosed:
          form.salaryDisclosed,

        minimum:
          form.salaryMinimum === ""
            ? null
            : Number(
                form.salaryMinimum
              ),

        maximum:
          form.salaryMaximum === ""
            ? null
            : Number(
                form.salaryMaximum
              ),

        currency:
          form.salaryCurrency,

        period:
          form.salaryPeriod,

        description:
          form.salaryDescription.trim(),
      },

      benefits:
        cleanStrings(
          form.benefits
        ),

      hiringProcess:
        form.hiringProcess
          .filter(
            (step) =>
              step.title.trim()
          )
          .map(
            (step, index) => ({
              title:
                step.title.trim(),

              description:
                step.description.trim(),

              order: index + 1,
            })
          ),

      applicationEmail:
        form.applicationEmail.trim(),

      applicationInstructions:
        form.applicationInstructions.trim(),

      closingDate:
        form.closingDate || null,

      internalNotes:
        form.internalNotes.trim(),
    };
  }

  /* =====================================================
     SAVE DRAFT
  ===================================================== */

  async function saveDraft() {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload =
        buildPayload();

      if (isEditMode && id) {
        await api.patch(
          `/jobs/${id}`,
          payload
        );
      } else {
        await api.post(
          "/jobs",
          payload
        );
      }

      alert(
        "Job opening saved successfully."
      );

      navigate(
        "/hr/recruitment"
      );
    } catch (error) {
      console.error(
        "Failed to save job:",
        error
      );

      alert(
        "Failed to save job opening."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     SAVE AND PUBLISH
  ===================================================== */

  async function saveAndPublish() {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload =
        buildPayload();

      let jobId = id;

      if (isEditMode && id) {
        await api.patch(
          `/jobs/${id}`,
          payload
        );
      } else {
        const response =
          await api.post(
            "/jobs",
            payload
          );

        jobId =
          response.data?.data?._id;
      }

      if (!jobId) {
        throw new Error(
          "Job ID was not returned."
        );
      }

      await api.patch(
        `/jobs/${jobId}/publish`
      );

      alert(
        "Job opening published successfully."
      );

      navigate(
        "/hr/recruitment"
      );
    } catch (error) {
      console.error(
        "Failed to publish job:",
        error
      );

      alert(
        "Failed to publish job opening."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     RENDER
  ===================================================== */

  if (initialLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#FE0000]" />

          <p className="mt-4 text-sm text-gray-500">
            Loading job opening...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() =>
              navigate(
                "/hr/recruitment"
              )
            }
            className="mt-1 rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft
              size={18}
            />
          </button>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-red-100 bg-white shadow-sm">
              <img
                src="/logo.png"
                alt="Sellopedia"
                className="h-9 w-9 object-contain"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-[#FE0000]">
                Recruitment
              </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {isEditMode
                ? "Edit Job Opening"
                : "Create Job Opening"}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Create a complete job description
              and publish it as a shareable
              recruitment page.
            </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() =>
              navigate(
                "/hr/recruitment"
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={saveDraft}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#FE0000] hover:bg-red-50 disabled:opacity-50"
          >
            <Save size={17} />

            {loading
              ? "Saving..."
              : "Save Draft"}
          </button>

          <button
            disabled={loading}
            onClick={saveAndPublish}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
          >
            <Check size={17} />

            {loading
              ? "Publishing..."
              : "Save & Publish"}
          </button>
        </div>
      </div>

      {/* =================================================
          MAIN LAYOUT
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
        {/* =================================================
            SECTION NAVIGATION
        ================================================= */}

        <aside className="hidden xl:block">
          <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-3">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              Job Description
            </p>

            <SectionButton
              active={
                activeSection ===
                "basic"
              }
              onClick={() =>
                setActiveSection(
                  "basic"
                )
              }
              label="Basic Information"
            />

            <SectionButton
              active={
                activeSection ===
                "description"
              }
              onClick={() =>
                setActiveSection(
                  "description"
                )
              }
              label="Job Description"
            />

            <SectionButton
              active={
                activeSection ===
                "responsibilities"
              }
              onClick={() =>
                setActiveSection(
                  "responsibilities"
                )
              }
              label="Responsibilities"
            />

            <SectionButton
              active={
                activeSection ===
                "requirements"
              }
              onClick={() =>
                setActiveSection(
                  "requirements"
                )
              }
              label="Requirements"
            />

            <SectionButton
              active={
                activeSection ===
                "skills"
              }
              onClick={() =>
                setActiveSection(
                  "skills"
                )
              }
              label="Skills"
            />

            <SectionButton
              active={
                activeSection ===
                "experience"
              }
              onClick={() =>
                setActiveSection(
                  "experience"
                )
              }
              label="Experience & Education"
            />

            <SectionButton
              active={
                activeSection ===
                "employment"
              }
              onClick={() =>
                setActiveSection(
                  "employment"
                )
              }
              label="Employment"
            />

            <SectionButton
              active={
                activeSection ===
                "salary"
              }
              onClick={() =>
                setActiveSection(
                  "salary"
                )
              }
              label="Salary"
            />

            <SectionButton
              active={
                activeSection ===
                "benefits"
              }
              onClick={() =>
                setActiveSection(
                  "benefits"
                )
              }
              label="Benefits"
            />

            <SectionButton
              active={
                activeSection ===
                "hiring"
              }
              onClick={() =>
                setActiveSection(
                  "hiring"
                )
              }
              label="Hiring Process"
            />

            <SectionButton
              active={
                activeSection ===
                "application"
              }
              onClick={() =>
                setActiveSection(
                  "application"
                )
              }
              label="Application"
            />
          </div>
        </aside>

        {/* =================================================
            FORM
        ================================================= */}

        <main className="space-y-6">
          {/* BASIC */}
          <FormSection
            id="basic"
            title="Basic Information"
            description="Define the position and organizational structure."
            icon={
              <BriefcaseBusiness
                size={19}
              />
            }
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="Job Title"
                required
                error={errors.title}
              >
                <input
                  value={form.title}
                  onChange={(event) =>
                    updateField(
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Senior Full Stack Developer"
                  className={inputClass(
                    Boolean(
                      errors.title
                    )
                  )}
                />
              </Field>

              <Field label="Job Code">
                <input
                  value={
                    form.jobCode
                  }
                  onChange={(event) =>
                    updateField(
                      "jobCode",
                      event.target.value
                    )
                  }
                  placeholder="e.g. DEV-001"
                  className={inputClass()}
                />
              </Field>

              <Field label="Department">
                <select
                  value={
                    form.department
                  }
                  onChange={(event) =>
                    updateField(
                      "department",
                      event.target.value
                    )
                  }
                  className={inputClass()}
                >
                  <option value="">
                    Select Department
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={
                          department._id
                        }
                        value={
                          department._id
                        }
                      >
                        {
                          department.name
                        }
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Designation">
                <select
                  value={
                    form.designation
                  }
                  onChange={(event) =>
                    updateField(
                      "designation",
                      event.target.value
                    )
                  }
                  className={inputClass()}
                >
                  <option value="">
                    Select Designation
                  </option>

                  {designations.map(
                    (designation) => (
                      <option
                        key={
                          designation._id
                        }
                        value={
                          designation._id
                        }
                      >
                        {
                          designation.name
                        }
                      </option>
                    )
                  )}
                </select>
              </Field>
            </div>
          </FormSection>

          {/* DESCRIPTION */}
          <FormSection
            id="description"
            title="Job Description"
            description="Write the main content that candidates will see."
          >
            <div className="space-y-5">
              <Field label="Short Description">
                <input
                  value={
                    form.shortDescription
                  }
                  onChange={(event) =>
                    updateField(
                      "shortDescription",
                      event.target.value
                    )
                  }
                  placeholder="A short summary of this position..."
                  className={inputClass()}
                />
              </Field>

              <Field
                label="Full Job Description"
                required
                error={
                  errors.description
                }
              >
                <textarea
                  rows={8}
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Describe the role, team, purpose of the position and what the successful candidate will be responsible for..."
                  className={textareaClass(
                    Boolean(
                      errors.description
                    )
                  )}
                />
              </Field>
            </div>
          </FormSection>

          {/* RESPONSIBILITIES */}
          <DynamicListSection
            id="responsibilities"
            title="Responsibilities"
            description="List the key responsibilities of this role."
            values={
              form.responsibilities
            }
            onChange={(index, value) =>
              updateArrayItem(
                "responsibilities",
                index,
                value
              )
            }
            onAdd={() =>
              addArrayItem(
                "responsibilities"
              )
            }
            onRemove={(index) =>
              removeArrayItem(
                "responsibilities",
                index
              )
            }
            placeholder="e.g. Develop and maintain scalable web applications"
            addLabel="Add Responsibility"
          />

          {/* REQUIREMENTS */}
          <DynamicListSection
            id="requirements"
            title="Requirements"
            description="List mandatory requirements for applicants."
            values={
              form.requirements
            }
            onChange={(index, value) =>
              updateArrayItem(
                "requirements",
                index,
                value
              )
            }
            onAdd={() =>
              addArrayItem(
                "requirements"
              )
            }
            onRemove={(index) =>
              removeArrayItem(
                "requirements",
                index
              )
            }
            placeholder="e.g. Strong understanding of React and TypeScript"
            addLabel="Add Requirement"
          />

          {/* QUALIFICATIONS */}
          <DynamicListSection
            id="qualifications"
            title="Qualifications"
            description="Educational and professional qualifications."
            values={
              form.qualifications
            }
            onChange={(index, value) =>
              updateArrayItem(
                "qualifications",
                index,
                value
              )
            }
            onAdd={() =>
              addArrayItem(
                "qualifications"
              )
            }
            onRemove={(index) =>
              removeArrayItem(
                "qualifications",
                index
              )
            }
            placeholder="e.g. Bachelor's degree in Computer Science or related field"
            addLabel="Add Qualification"
          />

          {/* PREFERRED */}
          <DynamicListSection
            id="preferred"
            title="Preferred Qualifications"
            description="Additional qualifications that are beneficial but not mandatory."
            values={
              form.preferredQualifications
            }
            onChange={(index, value) =>
              updateArrayItem(
                "preferredQualifications",
                index,
                value
              )
            }
            onAdd={() =>
              addArrayItem(
                "preferredQualifications"
              )
            }
            onRemove={(index) =>
              removeArrayItem(
                "preferredQualifications",
                index
              )
            }
            placeholder="e.g. Experience with AWS or Docker"
            addLabel="Add Preferred Qualification"
          />

          {/* SKILLS */}
          <FormSection
            id="skills"
            title="Skills"
            description="Define technical and professional skills required for this position."
          >
            <div className="space-y-3">
              {form.skills.map(
                (skill, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr_180px_130px_44px]"
                  >
                    <input
                      value={
                        skill.name
                      }
                      onChange={(event) =>
                        updateSkill(
                          index,
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="e.g. React.js"
                      className={inputClass()}
                    />

                    <select
                      value={
                        skill.level
                      }
                      onChange={(event) =>
                        updateSkill(
                          index,
                          "level",
                          event.target.value
                        )
                      }
                      className={inputClass()}
                    >
                      <option value="beginner">
                        Beginner
                      </option>
                      <option value="intermediate">
                        Intermediate
                      </option>
                      <option value="advanced">
                        Advanced
                      </option>
                      <option value="expert">
                        Expert
                      </option>
                    </select>

                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={
                          skill.required
                        }
                        onChange={(event) =>
                          updateSkill(
                            index,
                            "required",
                            event.target
                              .checked
                          )
                        }
                        className="h-4 w-4 rounded border-gray-300 text-[#FE0000]"
                      />

                      Required
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        removeSkill(
                          index
                        )
                      }
                      className="flex items-center justify-center rounded-xl border border-red-200 bg-white text-red-500 hover:bg-red-50"
                    >
                      <Trash2
                        size={17}
                      />
                    </button>
                  </div>
                )
              )}

              <button
                type="button"
                onClick={addSkill}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-red-300 px-4 py-2.5 text-sm font-semibold text-[#FE0000] hover:bg-red-50"
              >
                <Plus size={16} />
                Add Skill
              </button>
            </div>
          </FormSection>

          {/* EXPERIENCE / EDUCATION */}
          <FormSection
            id="experience"
            title="Experience & Education"
            description="Specify the experience and academic background expected from candidates."
          >
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Experience
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field
                    label="Minimum Experience (Years)"
                    error={
                      errors.experience
                    }
                  >
                    <input
                      type="number"
                      min="0"
                      value={
                        form.minimumExperience
                      }
                      onChange={(event) =>
                        updateField(
                          "minimumExperience",
                          Number(
                            event.target.value
                          )
                        )
                      }
                      className={inputClass()}
                    />
                  </Field>

                  <Field label="Maximum Experience (Years)">
                    <input
                      type="number"
                      min="0"
                      value={
                        form.maximumExperience
                      }
                      onChange={(event) =>
                        updateField(
                          "maximumExperience",
                          event.target.value
                        )
                      }
                      placeholder="Optional"
                      className={inputClass()}
                    />
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Education
                </h3>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="Minimum Qualification">
                      <input
                        value={
                          form.minimumQualification
                        }
                        onChange={(event) =>
                          updateField(
                            "minimumQualification",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Bachelor's Degree"
                        className={inputClass()}
                      />
                    </Field>

                    <Field label="Preferred Qualification">
                      <input
                        value={
                          form.preferredQualification
                        }
                        onChange={(event) =>
                          updateField(
                            "preferredQualification",
                            event.target.value
                          )
                        }
                        placeholder="e.g. MCA / M.Tech"
                        className={inputClass()}
                      />
                    </Field>
                  </div>

                  <DynamicListSection
                    id="education-fields"
                    title="Preferred Fields"
                    description="Specify relevant academic fields."
                    values={
                      form.educationFields
                    }
                    onChange={(
                      index,
                      value
                    ) =>
                      updateArrayItem(
                        "educationFields",
                        index,
                        value
                      )
                    }
                    onAdd={() =>
                      addArrayItem(
                        "educationFields"
                      )
                    }
                    onRemove={(index) =>
                      removeArrayItem(
                        "educationFields",
                        index
                      )
                    }
                    placeholder="e.g. Computer Science"
                    addLabel="Add Field"
                    compact
                  />
                </div>
              </div>
            </div>
          </FormSection>

          {/* EMPLOYMENT */}
          <FormSection
            id="employment"
            title="Employment Details"
            description="Define how and where the employee will work."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Employment Type">
                <select
                  value={
                    form.employmentType
                  }
                  onChange={(event) =>
                    updateField(
                      "employmentType",
                      event.target
                        .value as JobForm["employmentType"]
                    )
                  }
                  className={inputClass()}
                >
                  <option value="full_time">
                    Full Time
                  </option>
                  <option value="part_time">
                    Part Time
                  </option>
                  <option value="contract">
                    Contract
                  </option>
                  <option value="internship">
                    Internship
                  </option>
                </select>
              </Field>

              <Field label="Work Mode">
                <select
                  value={
                    form.workMode
                  }
                  onChange={(event) =>
                    updateField(
                      "workMode",
                      event.target
                        .value as JobForm["workMode"]
                    )
                  }
                  className={inputClass()}
                >
                  <option value="office">
                    Office
                  </option>
                  <option value="hybrid">
                    Hybrid
                  </option>
                  <option value="remote">
                    Remote
                  </option>
                </select>
              </Field>

              <Field
                label="Location"
                required
                error={
                  errors.location
                }
              >
                <input
                  value={
                    form.location
                  }
                  onChange={(event) =>
                    updateField(
                      "location",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Bhubaneswar, Odisha"
                  className={inputClass(
                    Boolean(
                      errors.location
                    )
                  )}
                />
              </Field>

              <Field
                label="Number of Openings"
                required
                error={
                  errors.openings
                }
              >
                <input
                  type="number"
                  min="1"
                  value={
                    form.openings
                  }
                  onChange={(event) =>
                    updateField(
                      "openings",
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className={inputClass(
                    Boolean(
                      errors.openings
                    )
                  )}
                />
              </Field>

              <Field label="Closing Date">
                <input
                  type="date"
                  value={
                    form.closingDate
                  }
                  onChange={(event) =>
                    updateField(
                      "closingDate",
                      event.target.value
                    )
                  }
                  className={inputClass()}
                />
              </Field>
            </div>
          </FormSection>

          {/* SALARY */}
          <FormSection
            id="salary"
            title="Salary"
            description="Configure salary visibility and compensation range."
          >
            <div className="space-y-5">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <input
                  type="checkbox"
                  checked={
                    form.salaryDisclosed
                  }
                  onChange={(event) =>
                    updateField(
                      "salaryDisclosed",
                      event.target
                        .checked
                    )
                  }
                  className="h-5 w-5 rounded border-gray-300 text-[#FE0000]"
                />

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Display salary publicly
                  </p>

                  <p className="text-xs text-gray-500">
                    Candidates will see the salary range on the public JD.
                  </p>
                </div>
              </label>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Minimum Salary">
                  <input
                    type="number"
                    min="0"
                    disabled={
                      !form.salaryDisclosed
                    }
                    value={
                      form.salaryMinimum
                    }
                    onChange={(event) =>
                      updateField(
                        "salaryMinimum",
                        event.target.value
                      )
                    }
                    placeholder="400000"
                    className={inputClass(
                      Boolean(
                        errors.salary
                      )
                    )}
                  />
                </Field>

                <Field label="Maximum Salary">
                  <input
                    type="number"
                    min="0"
                    disabled={
                      !form.salaryDisclosed
                    }
                    value={
                      form.salaryMaximum
                    }
                    onChange={(event) =>
                      updateField(
                        "salaryMaximum",
                        event.target.value
                      )
                    }
                    placeholder="800000"
                    className={inputClass(
                      Boolean(
                        errors.salary
                      )
                    )}
                  />
                </Field>

                <Field label="Currency">
                  <select
                    value={
                      form.salaryCurrency
                    }
                    onChange={(event) =>
                      updateField(
                        "salaryCurrency",
                        event.target.value
                      )
                    }
                    className={inputClass()}
                  >
                    <option value="INR">
                      INR - Indian Rupee
                    </option>
                    <option value="USD">
                      USD - US Dollar
                    </option>
                    <option value="EUR">
                      EUR - Euro
                    </option>
                    <option value="GBP">
                      GBP - Pound
                    </option>
                  </select>
                </Field>

                <Field label="Salary Period">
                  <select
                    value={
                      form.salaryPeriod
                    }
                    onChange={(event) =>
                      updateField(
                        "salaryPeriod",
                        event.target
                          .value as JobForm["salaryPeriod"]
                      )
                    }
                    className={inputClass()}
                  >
                    <option value="hourly">
                      Hourly
                    </option>
                    <option value="monthly">
                      Monthly
                    </option>
                    <option value="yearly">
                      Yearly
                    </option>
                  </select>
                </Field>
              </div>

              <Field label="Salary Description">
                <input
                  value={
                    form.salaryDescription
                  }
                  onChange={(event) =>
                    updateField(
                      "salaryDescription",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Salary depends on experience and interview performance."
                  className={inputClass()}
                />
              </Field>
            </div>
          </FormSection>

          {/* BENEFITS */}
          <DynamicListSection
            id="benefits"
            title="Benefits"
            description="List benefits offered to employees."
            values={
              form.benefits
            }
            onChange={(index, value) =>
              updateArrayItem(
                "benefits",
                index,
                value
              )
            }
            onAdd={() =>
              addArrayItem(
                "benefits"
              )
            }
            onRemove={(index) =>
              removeArrayItem(
                "benefits",
                index
              )
            }
            placeholder="e.g. Health insurance"
            addLabel="Add Benefit"
          />

          {/* HIRING PROCESS */}
          <FormSection
            id="hiring"
            title="Hiring Process"
            description="Show candidates what the recruitment journey looks like."
          >
            <div className="space-y-3">
              {form.hiringProcess.map(
                (step, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-sm font-bold text-[#FE0000]">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_44px]">
                          <input
                            value={
                              step.title
                            }
                            onChange={(event) =>
                              updateHiringStep(
                                index,
                                "title",
                                event.target
                                  .value
                              )
                            }
                            placeholder="Step title"
                            className={inputClass()}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeHiringStep(
                                index
                              )
                            }
                            className="flex items-center justify-center rounded-xl border border-red-200 bg-white text-red-500 hover:bg-red-50"
                          >
                            <Trash2
                              size={17}
                            />
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={
                            step.description
                          }
                          onChange={(event) =>
                            updateHiringStep(
                              index,
                              "description",
                              event.target
                                .value
                            )
                          }
                          placeholder="Optional description for this stage..."
                          className={textareaClass()}
                        />
                      </div>
                    </div>
                  </div>
                )
              )}

              <button
                type="button"
                onClick={
                  addHiringStep
                }
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-red-300 px-4 py-2.5 text-sm font-semibold text-[#FE0000] hover:bg-red-50"
              >
                <Plus size={16} />
                Add Hiring Stage
              </button>
            </div>
          </FormSection>

          {/* APPLICATION */}
          <FormSection
            id="application"
            title="Application"
            description="Configure how candidates should apply."
          >
            <div className="space-y-5">
              <Field label="Application Email">
                <input
                  type="email"
                  value={
                    form.applicationEmail
                  }
                  onChange={(event) =>
                    updateField(
                      "applicationEmail",
                      event.target.value
                    )
                  }
                  placeholder="careers@company.com"
                  className={inputClass()}
                />
              </Field>

              <Field label="Application Instructions">
                <textarea
                  rows={5}
                  value={
                    form.applicationInstructions
                  }
                  onChange={(event) =>
                    updateField(
                      "applicationInstructions",
                      event.target.value
                    )
                  }
                  placeholder="Tell candidates what documents or information they should provide..."
                  className={textareaClass()}
                />
              </Field>
            </div>
          </FormSection>

          {/* INTERNAL NOTES */}
          <FormSection
            id="internal"
            title="Internal HR Notes"
            description="These notes are private and will never appear on the public JD."
          >
            <textarea
              rows={5}
              value={
                form.internalNotes
              }
              onChange={(event) =>
                updateField(
                  "internalNotes",
                  event.target.value
                )
              }
              placeholder="Internal hiring notes, salary approval notes, recruiter instructions..."
              className={textareaClass()}
            />
          </FormSection>
        </main>
      </div>

      {/* =================================================
          MOBILE / BOTTOM ACTION BAR
      ================================================= */}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="mx-auto flex max-w-7xl justify-end gap-3">
          <button
            onClick={() =>
              navigate(
                "/hr/recruitment"
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={saveDraft}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#FE0000] disabled:opacity-50"
          >
            <Save size={16} />

            Save Draft
          </button>

          <button
            disabled={loading}
            onClick={saveAndPublish}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FE0000] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Check size={16} />

            {loading
              ? "Publishing..."
              : "Save & Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FORM SECTION
========================================================= */

function FormSection({
  id,
  title,
  description,
  icon,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`job-section-${id}`}
      className="scroll-mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="rounded-xl bg-red-50 p-2.5 text-[#FE0000]">
              {icon}
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {title}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   DYNAMIC LIST SECTION
========================================================= */

function DynamicListSection({
  id,
  title,
  description,
  values,
  onChange,
  onAdd,
  onRemove,
  placeholder,
  addLabel,
  compact = false,
}: {
  id: string;
  title: string;
  description: string;
  values: string[];
  onChange: (
    index: number,
    value: string
  ) => void;
  onAdd: () => void;
  onRemove: (
    index: number
  ) => void;
  placeholder: string;
  addLabel: string;
  compact?: boolean;
}) {
  return (
    <FormSection
      id={id}
      title={title}
      description={description}
    >
      <div className="space-y-3">
        {values.map(
          (value, index) => (
            <div
              key={index}
              className="flex gap-2"
            >
              <div className="flex h-[46px] w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-xs font-bold text-gray-400">
                {index + 1}
              </div>

              <input
                value={value}
                onChange={(event) =>
                  onChange(
                    index,
                    event.target.value
                  )
                }
                placeholder={
                  placeholder
                }
                className={inputClass()}
              />

              <button
                type="button"
                onClick={() =>
                  onRemove(index)
                }
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50"
              >
                <Trash2
                  size={17}
                />
              </button>
            </div>
          )
        )}

        <button
          type="button"
          onClick={onAdd}
          className={`inline-flex items-center gap-2 rounded-xl border border-dashed border-red-300 px-4 py-2.5 text-sm font-semibold text-[#FE0000] hover:bg-red-50 ${
            compact
              ? "mt-1"
              : ""
          }`}
        >
          <Plus size={16} />

          {addLabel}
        </button>
      </div>
    </FormSection>
  );
}

/* =========================================================
   SECTION BUTTON
========================================================= */

function SectionButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-1 flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
        active
          ? "bg-red-50 text-red-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span
        className={`mr-2 h-1.5 w-1.5 rounded-full ${
          active
            ? "bg-[#FE0000]"
            : "bg-gray-300"
        }`}
      />

      {label}
    </button>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}

      {error && (
        <span className="mt-1.5 block text-xs font-medium text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

/* =========================================================
   INPUT CLASS
========================================================= */

function inputClass(
  hasError = false
) {
  return `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100 ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
  }`;
}

/* =========================================================
   TEXTAREA CLASS
========================================================= */

function textareaClass(
  hasError = false
) {
  return `w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-[#FE0000] focus:ring-2 focus:ring-red-100"
  }`;
}