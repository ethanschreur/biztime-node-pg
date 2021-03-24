/** BizTime express application. */

const express = require('express');

const ExpressError = require('./expressError');
const companies = require('./routes/companies');
const invoices = require('./routes/invoices');
const industries = require('./routes/industries');
const app = express();
app.use(express.json());

// router paths

app.use('/companies', companies);

app.use('/invoices', invoices);

app.use('/industries', industries);

/** 404 handler */

app.use(function(req, res, next) {
	const err = new ExpressError('Noooot Found', 404);
	return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
	res.status(err.status || 500);

	return res.json({
		error: err,
		message: err.message
	});
});

module.exports = app;
