const express = require('express');
const db = require('../db');
const ExpressError = require('../expressError');
const slugify = require('slugify');

const router = new express.Router();

// // ex
router.get('/', async (req, res, next) => {
	try {
		const result = await db.query('SELECT code, name FROM companies');
		return res.status(200).json({ companies: result.rows });
	} catch (e) {
		return next(new ExpressError('Companies cannot be retrieved', 404));
	}
});

router.get('/:code', async (req, res, next) => {
	try {
		const result = await db.query(
			`SELECT c.code, c.description, c.name,
			 i.industry, ci.industry_code FROM companies AS c
			LEFT JOIN company_industries AS ci ON c.name = ci.company_name 
			LEFT JOIN industries AS i ON ci.industry_code = i.code 
			WHERE c.code = $1`,
			[ req.params.code ]
		);
		if (result.rows.length === 0) {
			throw new ExpressError('Company cannot be found.', 404);
		}
		const invoices = await db.query('SELECT * FROM invoices WHERE comp_code = $1', [ req.params.code ]);
		const ret = result.rows[0];
		ret['invoices'] = invoices.rows;
		delete ret.id;
		let industries = [];
		for (let k of result.rows) {
			industries.push({ industry: k.industry, industry_code: k.industry_code });
		}
		ret['industries'] = industries;
		delete ret.industry_code;
		delete ret.industry;
		return res.status(200).json({ company: ret });
	} catch (e) {
		return next(new ExpressError(e, 404));
	}
});

router.post('/', async (req, res, next) => {
	try {
		const { name, description } = req.body;
		const code = slugify(req.body.code, { remove: /[!@#$%^&*(){}[\]\|?]/g });
		const json = { code, name, description };
		await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3)', [
			code,
			name,
			description
		]);
		return res.status(200).json({ company: json });
	} catch (e) {
		return next(new ExpressError('Company cannot be posted'), 404);
	}
});

router.put('/:code', async (req, res, next) => {
	try {
		const { name, description } = req.body;
		const code = req.params.code;
		const json = { name, description };
		await db.query('UPDATE companies SET name = $1, description = $2 WHERE code = $3', [ name, description, code ]);
		return res.status(200).json({ company: json });
	} catch (e) {
		return next(new ExpressError('Company cannot be edited', 404));
	}
});

router.delete('/:code', async (req, res, next) => {
	try {
		const code = req.params.code;
		await db.query('DELETE FROM companies WHERE code = $1', [ code ]);
		return res.status(200).json({ status: 'deleted' });
	} catch (e) {
		return next(new ExpressError('Company could not be deleted', 404));
	}
});

module.exports = router;
