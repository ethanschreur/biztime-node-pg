process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('Test invoices routes', function() {
	beforeAll(async function() {
		await db.query(`DELETE FROM companies`);
		await db.query(`DELETE FROM invoices`);
		await db.query(`
        INSERT INTO companies (code, name, description)
      VALUES ('apple', 'Apple Computer', 'Maker of OSX.')`);

		await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date)
      VALUES ('apple', 300, true, '2018-01-01')`);
	});

	afterAll(async function() {
		await db.query(`DELETE FROM companies`);
		await db.query(`DELETE FROM invoices`);
		// close db connection
		await db.end();
	});

	test('Gets data for all invoices', async function() {
		const resp = await request(app).get('/invoices');
		expect(resp.statusCode).toBe(200);
		expect(resp.body.invoices[0]).toMatchObject({ comp_code: 'apple' });
	});

	test('Gets data for invoice with the first id in invoices list', async function() {
		const pre_resp = await request(app).get('/invoices');
		const id = pre_resp.body.invoices[0].id;
		const resp = await request(app).get(`/invoices/${id}`);
		expect(resp.statusCode).toBe(200);
		expect(resp.body.invoice.company).toMatchObject({ code: 'apple' });
		expect(resp.body.invoice.company).toMatchObject({ description: 'Maker of OSX.' });
	});

	test('Post, Edit, and Delete an invoice', async function() {
		let resp = await request(app).post('/invoices').send({
			comp_code: 'apple',
			amt: 999
		});
		expect(resp.statusCode).toBe(200);
		expect(resp.body.invoice).toMatchObject({ amt: 999 });
		let resp2 = await request(app).put(`/invoices/${resp.body.invoice.id}`).send({
			amt: 100,
			paid: true
		});
		expect(resp2.statusCode).toBe(200);
		expect(resp2.body.invoice).toMatchObject({ amt: 100 });
		expect(resp2.body.invoice).not.toMatchObject({ paid: null });

		const resp3 = await request(app).delete(`/invoices/${resp.body.invoice.id}`);
		expect(resp3.statusCode).toBe(200);
		expect(resp3.body).toEqual({ status: 'deleted' });
	});
});
