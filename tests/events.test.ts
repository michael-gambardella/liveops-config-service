import request from 'supertest';
import app from '../src/app';
import * as eventQueries from '../src/db/queries/events.queries';
import * as auditQueries from '../src/db/queries/audit.queries';

jest.mock('../src/db/queries/events.queries');
jest.mock('../src/db/queries/audit.queries');

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000';

const mockEvent = {
  id: EVENT_ID,
  name: 'Summer Festival',
  description: 'A summer-themed live event',
  status: 'draft',
  start_time: new Date('2024-06-01T00:00:00Z'),
  end_time: new Date('2024-06-30T23:59:59Z'),
  created_at: new Date(),
  updated_at: new Date(),
};

beforeEach(() => {
  jest.resetAllMocks();
  (auditQueries.createAuditEntry as jest.Mock).mockResolvedValue({});
});

describe('GET /api/events', () => {
  it('returns a list of events', async () => {
    (eventQueries.getAllEvents as jest.Mock).mockResolvedValue([mockEvent]);
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Summer Festival');
  });

  it('passes status filter to query', async () => {
    (eventQueries.getAllEvents as jest.Mock).mockResolvedValue([]);
    await request(app).get('/api/events?status=active');
    expect(eventQueries.getAllEvents).toHaveBeenCalledWith('active');
  });
});

describe('GET /api/events/:id', () => {
  it('returns 404 for unknown event', async () => {
    (eventQueries.getEventById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).get(`/api/events/${EVENT_ID}`);
    expect(res.status).toBe(404);
  });

  it('returns the event', async () => {
    (eventQueries.getEventById as jest.Mock).mockResolvedValue(mockEvent);
    const res = await request(app).get(`/api/events/${EVENT_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(EVENT_ID);
  });
});

describe('POST /api/events', () => {
  it('creates an event', async () => {
    (eventQueries.createEvent as jest.Mock).mockResolvedValue(mockEvent);
    const res = await request(app)
      .post('/api/events')
      .send({
        name: 'Summer Festival',
        start_time: '2024-06-01T00:00:00Z',
        end_time: '2024-06-30T23:59:59Z',
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Summer Festival');
  });

  it('rejects missing required fields', async () => {
    const res = await request(app).post('/api/events').send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('rejects when end_time is before start_time', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({
        name: 'Bad Event',
        start_time: '2024-06-30T00:00:00Z',
        end_time: '2024-06-01T00:00:00Z',
      });
    expect(res.status).toBe(400);
  });

  it('uses x-actor header for audit', async () => {
    (eventQueries.createEvent as jest.Mock).mockResolvedValue(mockEvent);
    await request(app)
      .post('/api/events')
      .set('x-actor', 'alice')
      .send({
        name: 'Summer Festival',
        start_time: '2024-06-01T00:00:00Z',
        end_time: '2024-06-30T23:59:59Z',
      });
    expect(auditQueries.createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ actor: 'alice' })
    );
  });
});

describe('PATCH /api/events/:id', () => {
  it('updates an event', async () => {
    (eventQueries.getEventById as jest.Mock).mockResolvedValue(mockEvent);
    (eventQueries.updateEvent as jest.Mock).mockResolvedValue({ ...mockEvent, name: 'Updated' });
    const res = await request(app).patch(`/api/events/${EVENT_ID}`).send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated');
  });

  it('returns 404 for unknown event', async () => {
    (eventQueries.getEventById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).patch(`/api/events/${EVENT_ID}`).send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/events/:id', () => {
  it('archives an event', async () => {
    (eventQueries.getEventById as jest.Mock).mockResolvedValue(mockEvent);
    (eventQueries.archiveEvent as jest.Mock).mockResolvedValue({ ...mockEvent, status: 'archived' });
    const res = await request(app).delete(`/api/events/${EVENT_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('archived');
  });

  it('returns 404 for unknown event', async () => {
    (eventQueries.getEventById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).delete(`/api/events/${EVENT_ID}`);
    expect(res.status).toBe(404);
  });
});
