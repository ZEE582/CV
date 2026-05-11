const companyService = require('../services/companyService');

async function getAllCompanies(req, res) {
    try {
        const companies = await companyService.getAllCompanies();
        res.json(companies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getCompany(req, res) {
    try {
        const company = await companyService.getCompany(req.params.id);
        res.json(company);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function createCompany(req, res) {
    try {
        const company = await companyService.createCompany(req.body);
        res.json(company); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function updateCompany(req, res) {
    try {
        const company = await companyService.updateCompany(req.params.id, req.body);
        res.json(company);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function deleteCompany(req, res) {
    try {
        await companyService.deleteCompany(req.params.id);
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
module.exports = {
    getAllCompanies,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany
}
