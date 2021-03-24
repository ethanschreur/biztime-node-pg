process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('Companies Tests', function() {
	beforeAll(async function() {
		await db.query(`DELETE FROM companies`);
		await db.query(`DELETE FROM invoices`);
		await db.query(`DELETE FROM industries`);
		await db.query(`DELETE FROM company_industries`);
		await db.query(`
        INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple Computer', 'Maker of OSX.')`);

		await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date)
    VALUES ('apple', 300, true, '2018-01-01')`);

		await db.query(`INSERT INTO industries (code, industry)
		  VALUES ('tech', 'technology')`);

		await db.query(`INSERT INTO company_industries (industry_code, company_name)
		            VALUES ('tech', 'Apple Computer')`);
	});

	afterAll(async function() {
		await db.query(`DELETE FROM companies`);
		await db.query(`DELETE FROM invoices`);
		await db.query(`DELETE FROM industries`);
		await db.query(`DELETE FROM company_industries`);
		// close db connection
		await db.end();
	});

	test('Gets data for all companies', async function() {
		const resp = await request(app).get('/companies');
		expect(resp.statusCode).toBe(200);
		expect(resp.body.companies[0]).toMatchObject({ code: 'apple' });
	});

	test('Gets data for company with code apple', async function() {
		const resp = await request(app).get('/companies/apple');
		expect(resp.statusCode).toBe(200);
		expect(resp.body.company).toMatchObject({ code: 'apple' });
		expect(resp.body.company).toMatchObject({ description: 'Maker of OSX.' });
	});

	test('Post, edit, and delete a company', async function() {
		const resp = await request(app).post('/companies').send({
			code: 'eth',
			name: 'ethan',
			description: 'my company'
		});
		expect(resp.statusCode).toBe(200);
		expect(resp.body.company).toMatchObject({ code: 'eth' });
		expect(resp.body.company).toMatchObject({ name: 'ethan' });
		expect(resp.body.company).toMatchObject({ description: 'my company' });

		const resp2 = await request(app).put('/companies/eth').send({
			name: 'ethan',
			description: 'one of my companies'
		});
		expect(resp2.statusCode).toBe(200);
		expect(resp2.body.company).toMatchObject({ description: 'one of my companies' });

		const resp3 = await request(app).delete('/companies/eth');
		expect(resp3.statusCode).toBe(200);
		expect(resp3.body).toEqual({ status: 'deleted' });
	});
});
