const express = require('express');
const db = require('../db');
const ExpressError = require('../expressError');

const router = new express.Router();

// // ex
router.get('/', async (req, res, next) => {
	try {
		const result = await db.query(`SELECT i.code, i.industry FROM industries AS i`);
		let ret = result.rows;
		for (let k of result.rows) {
			console.log(k.code);
			let companies = [];
			const res_companies = await db.query(
				`SELECT * FROM company_industries 
            LEFT JOIN companies ON company_industries.company_name = companies.name
            WHERE industry_code = $1
            `,
				[ k.code ]
			);
			for (let i of res_companies.rows) {
				companies.push(i.code);
			}
			k['companies'] = companies;
		}
		return res.status(200).json({ industries: ret });
	} catch (e) {
		return next(new ExpressError('Industries data could not be gotten', 404));
	}
});

router.post('/', async (req, res, next) => {
	try {
		const { code, industry } = req.body;
		const result = await db.query(
			'INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING id, code, industry',
			[ code, industry ]
		);
		return res.status(200).json({ industry: result.rows[0] });
	} catch (e) {
		return next(new ExpressError('Industry could not be added.'), 404);
	}
});

router.post('/:code', async (req, res, next) => {
	try {
		const { company_name } = req.body;
		const industry_code = req.params.code;
		console.log(company_name);
		console.log(industry_code);
		const result = await db.query(
			'INSERT INTO company_industries (industry_code, company_name) VALUES ($1, $2) RETURNING id, industry_code, company_name',
			[ industry_code, company_name ]
		);
		return res.status(200).json({ company_industry: result.rows[0] });
	} catch (e) {
		return next(new ExpressError(e, 404));
	}
});

module.exports = router;
