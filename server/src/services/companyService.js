const Company = require('../models/Company');

async function getAllCompanies() {
    try {
        const companies = await Company.find({});
        return companies;
    } catch (error) {
        throw new Error('Error fetching companies: ' + error.message);
    }
}

async function getCompany(id) {
    try {
        const company = await Company.findOne({ id });
        if (!company) {
            throw new Error('Company not found');
        }
        return company;
    } catch (error) {
        throw error;
    }
}

async function createCompany(companyData) {
    try {
        const company = await Company.create(companyData);
        return company;
    } catch (error) {
        throw new Error('Error creating company: ' + error.message);
    }
}

async function updateCompany(id, companyData) {
    try {
        const company = await Company.findOneAndUpdate({ id }, companyData, { new: true });
        if (!company) {
            throw new Error('Company not found');
        }
        return company;
    } catch (error) {
        throw error;
    }
}

async function deleteCompany(id) {
    try {
        const company = await Company.findOneAndDelete({ id });
        if (!company) {
            throw new Error('Company not found');
        }
        return company;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getAllCompanies,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany
};
