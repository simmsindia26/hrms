export function createJobSlug(job) {
  if (job.slug) {
    return job.slug;
  }

  return String(job.title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function serializePublicJob(job) {
  const data = job.toObject
    ? job.toObject()
    : { ...job };

  return {
    _id: data._id,

    title: data.title,

    slug: createJobSlug(data),

    department: data.department,

    designation: data.designation,

    location: data.location,

    employmentType: data.employmentType,

    openings: data.openings,

    description: data.description,

    requirements: data.requirements,

    qualifications: data.qualifications,

    skills: data.skills,

    experience: data.experience,

    salary:
      data.salaryVisible === false
        ? undefined
        : data.salary,

    salaryMin:
      data.salaryVisible === false
        ? undefined
        : data.salaryMin,

    salaryMax:
      data.salaryVisible === false
        ? undefined
        : data.salaryMax,

    benefits: data.benefits,

    applicationInstructions:
      data.applicationInstructions,

    closingDate: data.closingDate,

    createdAt: data.createdAt,
  };
}