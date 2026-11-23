const Joi = require('joi');

const text = max => Joi.string().trim().max(max).allow('');
const fields = {
  fullName: Joi.string().trim().min(1).max(200),
  age: Joi.number().integer().min(1).max(150).allow(null),
  city: text(100), university: text(200), major: text(200),
  programmingLanguages: Joi.array().items(Joi.string().trim().min(1).max(80)).max(50).unique(),
  jobTitle: text(300), experienceYears: text(100), lookingForJob: Joi.boolean().strict(), jobInterest: text(300),
};
const profileSchema = Joi.object({
  name: fields.fullName,
  phone: text(40),
  avatar: Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(2000).allow(''),
  onboardingData: Joi.object(fields).min(1),
}).min(1);
const questionsSchema = Joi.object({
  ...fields,
  fullName: fields.fullName.required(), age: fields.age.invalid(null).required(),
  city: fields.city.invalid('').required(), university: fields.university.default(''),
  major: fields.major.default(''), programmingLanguages: fields.programmingLanguages.default([]),
  jobTitle: fields.jobTitle.invalid('').required(), experienceYears: fields.experienceYears.invalid('').required(),
  jobInterest: fields.jobInterest.invalid('').required(), lookingForJob: fields.lookingForJob.default(false),
});
module.exports = { profileSchema, questionsSchema };
