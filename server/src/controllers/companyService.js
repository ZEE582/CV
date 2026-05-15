
const companyService = require('../services/companyService');

async function getAllCompanies(req, res) {
    try {
        const companies = await companyService.getAllCompanies();
        res.json({ companies });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function getCompany(req, res) {
    try {
        const company = await companyService.getCompany(req.params.id);
        res.json(company);
    } catch (error) {
        console.error(error);
        if (error.message.includes('Company not found')) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function createCompany(req, res) {
    try {
        const company = await companyService.createCompany(req.body);
        res.status(201).json(company); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function updateCompany(req, res) {
    try {
        const company = await companyService.updateCompany(req.params.id, req.body);
        res.json(company);
    } catch (error) {
        console.error(error);
        if (error.message.includes('Company not found')) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function deleteCompany(req, res) {
    try {
        await companyService.deleteCompany(req.params.id);
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        if (error.message.includes('Company not found')) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getAllCompanies,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany
};