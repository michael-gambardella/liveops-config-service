import request from 'supertest';
import app from '../src/app';
import * as auditQueries from '../src/db/queries/audit.queries';

jest.mock('../src/db/queries/audit.queries');

const mockEntry = {
  id: '770e8400-e29b-41d4-a716-446655440002',
  entity_type: 'event',
  entity_id: '550e8400-e29b-41d4-a716-446655440000',
  action: 'created',
  actor: 'alice',
  metadata: null,
  created_at: new Date(),
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('GET /api/audit', () => {
  it('returns all audit entries', async () => {
    (auditQueries.getAuditEntries as jest.Mock).mockResolvedValue([mockEntry]);
    const res = await request(app).get('/api/audit');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].action).toBe('created');
  });

  it('filters by entity_type', async () => {
    (auditQueries.getAuditEntries as jest.Mock).mockResolvedValue([mockEntry]);
    await request(app).get('/api/audit?entity_type=event');
    expect(auditQueries.getAuditEntries).toHaveBeenCalledWith(
      expect.objectContaining({ entity_type: 'event' })
    );
  });

  it('filters by entity_id', async () => {
    (auditQueries.getAuditEntries as jest.Mock).mockResolvedValue([mockEntry]);
    const id = '550e8400-e29b-41d4-a716-446655440000';
    await request(app).get(`/api/audit?entity_id=${id}`);
    expect(auditQueries.getAuditEntries).toHaveBeenCalledWith(
      expect.objectContaining({ entity_id: id })
    );
  });

  it('passes pagination params', async () => {
    (auditQueries.getAuditEntries as jest.Mock).mockResolvedValue([]);
    await request(app).get('/api/audit?limit=10&offset=20');
    expect(auditQueries.getAuditEntries).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 20 })
    );
  });
});
