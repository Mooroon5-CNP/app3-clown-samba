const os = require('os');
process.env.DATA_DIR = os.tmpdir();

const request = require('supertest');
const app = require('./index');

describe('clown-samba', () => {
  it('GET /healthz returns 200', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /ready returns 200', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });

  it('GET /api/blague returns a joke with setup, punch and total', async () => {
    const res = await request(app).get('/api/blague');
    expect(res.status).toBe(200);
    expect(typeof res.body.setup).toBe('string');
    expect(typeof res.body.punch).toBe('string');
    expect(typeof res.body.total).toBe('number');
  });

  it('GET /api/historique returns an array', async () => {
    const res = await request(app).get('/api/historique');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET / returns HTML with clown', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('Clown Samba');
    expect(res.text).toContain('🤡');
  });
});
