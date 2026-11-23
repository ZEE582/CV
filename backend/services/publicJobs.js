// Public endpoints must not reveal unpublished salary amounts.
exports.publicJob = job => job.salary_visible === false ? { ...job, salary_min: null, salary_max: null } : job;
exports.literalSearch = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
