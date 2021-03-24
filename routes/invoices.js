const express = require('express');
const db = require('../db');
const ExpressError = require('../expressError');
const dateTime = require('node-datetime');

const router = new express.Router();

// // ex
router.get('/', async (req, res, next) => {
	try {
		const result = await db.query('SELECT id, comp_code FROM invoices');
		return res.status(200).json({ invoices: result.rows });
	} catch (e) {
		return next(new ExpressError('Invoices cannot be retrieved', 404));
	}
});

router.get('/:id', async (req, res, next) => {
	try {
		const result = await db.query(`SELECT * FROM invoices WHERE id = $1`, [ req.params.id ]);
		const response = result.rows[0];
		const company_data = await db.query(`SELECT code, name, description FROM companies WHERE code = $1`, [
			result.rows[0].comp_code
		]);
		const { code, name, description } = company_data.rows[0];
		response['company'] = { code, name, description };
		delete response.comp_code;
		return res.status(200).json({ invoice: response });
	} catch (e) {
		return next(new ExpressError('Invoice cannot be found', 404));
	}
});

router.post('/', async (req, res, next) => {
	try {
		const { comp_code, amt } = req.body;
		const result = await db.query(
			'INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date',
			[ comp_code, amt ]
		);
		return res.status(200).json({ invoice: result.rows[0] });
	} catch (e) {
		return next(new ExpressError('Invoice could not be added.'), 404);
	}
});

router.put('/:id', async (req, res, next) => {
	try {
		const { amt, paid } = req.body;
		const paid_date = paid === true ? dateTime.create()._now : null;
		const id = req.params.id;
		const result = await db.query(
			'UPDATE invoices SET amt = $1, paid_date= CASE WHEN paid_date IS NULL THEN $2 ELSE paid_date END WHERE id = $3 RETURNING id, comp_code, amt, paid, add_date, paid_date',
			[ amt, paid_date, id ]
		);
		return res.status(200).json({ invoice: result.rows[0] });
	} catch (e) {
		return next(new ExpressError(e, 404));
	}
});

router.delete('/:id', async (req, res, next) => {
	try {
		const id = req.params.id;
		await db.query('DELETE FROM invoices WHERE id = $1', [ id ]);
		return res.status(200).json({ status: 'deleted' });
	} catch (e) {
		return next(new ExpressError('Company could not be deleted', 404));
	}
});

module.exports = router;
