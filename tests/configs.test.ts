import request from 'supertest';
import app from '../src/app';
import * as configQueries from '../src/db/queries/configs.queries';
import * as eventQueries from '../src/db/queries/events.queries';
import * as auditQueries from '../src/db/queries/audit.queries';

jest.mock('../src/db/queries/configs.queries');
jest.mock('../src/db/queries/events.queries');
jest.mock('../src/db/queries/audit.queries');

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000';
const CONFIG_ID = '660e8400-e29b-41d4-a716-446655440001';

const mockEvent = {
  id: EVENT_ID,
  name: 'Summer Festival',
  status: 'active',
  start_time: new Date(),
  end_time: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
};

const mockConfig = {
  id: CONFIG_ID,
  event_id: EVENT_ID,
  version: 1,
  payload: { reward: 'gem', amount: 100 },
  status: 'draft',
  published_at: null,
  published_by: null,
  created_at: new Date(),
  updated_at: new Date(),
};

beforeEach(() => {
  jest.resetAllMocks();
  (auditQueries.createAuditEntry as jest.Mock).mockResolvedValue({});
});

describe('GET /api/configs', () => {
  it('requires event_id param', async () => {
    const res = await request(app).get('/api/configs');
    expect(res.status).toBe(400);
  });

  it('returns configs for an event', async () => {
    (configQueries.getConfigsByEventId as jest.Mock).mockResolvedValue([mockConfig]);
    const res = await request(app).get(`/api/configs?event_id=${EVENT_ID}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].version).toBe(1);
  });
});

describe('GET /api/configs/:id', () => {
  it('returns the config', async () => {
    (configQueries.getConfigById as jest.Mock).mockResolvedValue(mockConfig);
    const res = await request(app).get(`/api/configs/${CONFIG_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(CONFIG_ID);
  });

  it('returns 404 for unknown config', async () => {
    (configQueries.getConfigById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).get(`/api/configs/${CONFIG_ID}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/configs', () => {
  it('creates a config version', async () => {
    (eventQueries.getEventById as jest.Mock).mockResolvedValue(mockEvent);
    (configQueries.getNextVersion as jest.Mock).mockResolvedValue(1);
    (configQueries.createConfig as jest.Mock).mockResolvedValue(mockConfig);

    const res = await request(app)
      .post('/api/configs')
      .send({ event_id: EVENT_ID, payload: { reward: 'gem', amount: 100 } });

    expect(res.status).toBe(201);
    expect(res.body.version).toBe(1);
  });

  it('returns 404 when event does not exist', async () => {
    (eventQueries.getEventById as jest.Mock).mockResolvedValue(null);
    const res = await request(app)
      .post('/api/configs')
      .send({ event_id: EVENT_ID, payload: {} });
    expect(res.status).toBe(404);
  });

  it('rejects missing event_id', async () => {
    const res = await request(app).post('/api/configs').send({ payload: {} });
    expect(res.status).toBe(400);
  });

  it('auto-increments version', async () => {
    (eventQueries.getEventById as jest.Mock).mockResolvedValue(mockEvent);
    (configQueries.getNextVersion as jest.Mock).mockResolvedValue(3);
    (configQueries.createConfig as jest.Mock).mockResolvedValue({ ...mockConfig, version: 3 });

    const res = await request(app)
      .post('/api/configs')
      .send({ event_id: EVENT_ID, payload: {} });

    expect(res.status).toBe(201);
    expect(configQueries.createConfig).toHaveBeenCalledWith(
      expect.objectContaining({ version: 3 })
    );
  });
});

describe('POST /api/configs/:id/publish', () => {
  it('publishes a draft config', async () => {
    (configQueries.getConfigById as jest.Mock).mockResolvedValue(mockConfig);
    (configQueries.publishConfig as jest.Mock).mockResolvedValue({
      ...mockConfig,
      status: 'published',
      published_by: 'alice',
      published_at: new Date(),
    });

    const res = await request(app)
      .post(`/api/configs/${CONFIG_ID}/publish`)
      .send({ published_by: 'alice' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');
    expect(res.body.published_by).toBe('alice');
  });

  it('rejects publishing a non-draft config', async () => {
    (configQueries.getConfigById as jest.Mock).mockResolvedValue({
      ...mockConfig,
      status: 'published',
    });
    const res = await request(app)
      .post(`/api/configs/${CONFIG_ID}/publish`)
      .send({ published_by: 'alice' });
    expect(res.status).toBe(409);
  });

  it('requires published_by', async () => {
    const res = await request(app)
      .post(`/api/configs/${CONFIG_ID}/publish`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/configs/:id/rollback', () => {
  it('rolls back a published config', async () => {
    (configQueries.getConfigById as jest.Mock).mockResolvedValue({
      ...mockConfig,
      status: 'published',
    });
    (configQueries.rollbackConfig as jest.Mock).mockResolvedValue({
      ...mockConfig,
      status: 'rolled_back',
    });

    const res = await request(app).post(`/api/configs/${CONFIG_ID}/rollback`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rolled_back');
  });

  it('rejects rollback of a draft config', async () => {
    (configQueries.getConfigById as jest.Mock).mockResolvedValue(mockConfig);
    const res = await request(app).post(`/api/configs/${CONFIG_ID}/rollback`);
    expect(res.status).toBe(409);
  });

  it('returns 404 for unknown config', async () => {
    (configQueries.getConfigById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).post(`/api/configs/${CONFIG_ID}/rollback`);
    expect(res.status).toBe(404);
  });
});
