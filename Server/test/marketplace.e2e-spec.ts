import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const base = process.env.E2E_API_URL || 'http://127.0.0.1:4100';
const db = new PrismaClient();
const marker = `qa-${Date.now()}`;
let buyer: { user: { id: string }; accessToken: string };
let agent: string;
let otherAgent: string;
let admin: string;
let propertyId: string;
let propertySlug: string;
let collectionId: string;
let inquiryId: string;
let postId: string;
let savedSearchId: string;
const pass = process.env.DEMO_PASSWORD || 'HavenDemo2026!';
async function call(
  path: string,
  method = 'GET',
  body?: unknown,
  token?: string,
) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}
beforeAll(async () => {
  buyer = (
    await call('/auth/register', 'POST', {
      name: 'Quality Buyer',
      email: `${marker}@example.com`,
      password: pass,
    })
  ).body;
  agent = (
    await call('/auth/login', 'POST', {
      email: 'alexandra@haven.example',
      password: pass,
    })
  ).body.accessToken;
  otherAgent = (
    await call('/auth/login', 'POST', {
      email: 'james@haven.example',
      password: pass,
    })
  ).body.accessToken;
  admin = (
    await call('/auth/login', 'POST', {
      email: 'admin@haven.example',
      password: pass,
    })
  ).body.accessToken;
  expect(buyer.accessToken).toBeTruthy();
  expect(agent).toBeTruthy();
  expect(admin).toBeTruthy();
});
afterAll(async () => {
  if (propertyId) await db.property.deleteMany({ where: { id: propertyId } });
  if (postId) await db.journalPost.deleteMany({ where: { id: postId } });
  await db.sellerLead.deleteMany({ where: { email: `${marker}@example.com` } });
  await db.subscriber.deleteMany({ where: { email: `${marker}@example.com` } });
  await db.user.deleteMany({ where: { email: `${marker}@example.com` } });
  await db.$disconnect();
});
describe.sequential('Haven marketplace integration', () => {
  it('validates registration, rejects role escalation, and never exposes hashes', async () => {
    expect(
      (
        await call('/auth/register', 'POST', {
          name: 'Buyer',
          email: 'invalid',
          password: 'short',
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await call('/auth/register', 'POST', {
          name: 'Buyer',
          email: 'nobody@example.com',
          password: pass,
          role: 'ADMIN',
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await call('/auth/register', 'POST', {
          name: 'Buyer',
          email: `${marker}@example.com`,
          password: pass,
        })
      ).status,
    ).toBe(409);
    expect((await call('/auth/me')).status).toBe(401);
    const me = await call('/auth/me', 'GET', undefined, buyer.accessToken);
    expect(me.body.role).toBe('BUYER');
    expect(me.body.passwordHash).toBeUndefined();
    expect(
      (
        await call('/auth/login', 'POST', {
          email: `${marker}@example.com`,
          password: 'incorrect',
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await call('/auth/register', 'POST', {
          name: 'Unicode Buyer',
          email: `${marker}-unicode@example.com`,
          password: '🔐'.repeat(20),
        })
      ).status,
    ).toBe(400);
  });
  it('searches publicly with filters, ordering, pagination, and safe visibility', async () => {
    const result = await call(
      '/properties?type=SALE&beds=3&maxPrice=5000000&sort=price-asc&limit=2',
    );
    expect(result.status).toBe(200);
    expect(result.body.items.length).toBe(2);
    expect(Number(result.body.items[0].price)).toBeLessThanOrEqual(
      Number(result.body.items[1].price),
    );
    expect(
      result.body.items.every(
        (p: { beds: number; agent: object }) =>
          p.beds >= 3 && !('passwordHash' in p.agent),
      ),
    ).toBe(true);
    expect((await call('/properties?status=DRAFT')).status).toBe(400);
    expect((await call('/properties?bbox=invalid')).status).toBe(400);
    expect((await call('/properties?minPrice=100&maxPrice=10')).status).toBe(
      400,
    );
    const exclusive = await call('/properties?exclusive=true');
    expect(
      exclusive.body.items.every(
        (p: { isPrivateExclusive: boolean }) => p.isPrivateExclusive,
      ),
    ).toBe(true);
    expect(
      (await call('/properties?type=RENT')).body.items.every(
        (p: { listingType: string }) => p.listingType === 'RENT',
      ),
    ).toBe(true);
  });
  it('enforces listing ownership, atomic media creation, and draft privacy', async () => {
    const data = {
      title: `${marker} Residence`,
      description: 'A carefully designed home for integration testing.',
      price: 2500000,
      listingType: 'SALE',
      propertyType: 'HOUSE',
      status: 'DRAFT',
      addressLine1: '100 Test Avenue',
      city: 'San Francisco',
      lat: 37.79,
      lng: -122.44,
      beds: 3,
      baths: 2,
      sqft: 2100,
      mediaUrls: [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
      ],
    };
    expect(
      (await call('/properties', 'POST', data, buyer.accessToken)).status,
    ).toBe(403);
    const result = await call('/properties', 'POST', data, agent);
    expect(result.status).toBe(201);
    propertyId = result.body.id;
    propertySlug = result.body.slug;
    expect(result.body.media.length).toBe(1);
    expect((await call(`/properties/${propertySlug}`)).status).toBe(404);
    expect(
      (
        await call(
          `/properties/${propertyId}`,
          'PATCH',
          { status: 'ACTIVE' },
          otherAgent,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await call(
          `/properties/${propertyId}`,
          'PATCH',
          { status: 'ACTIVE' },
          agent,
        )
      ).status,
    ).toBe(200);
    expect((await call(`/properties/${propertySlug}`)).status).toBe(200);
    expect(
      (await call(`/properties/${propertyId}`, 'DELETE', undefined, agent))
        .status,
    ).toBe(403);
    expect(
      (
        await call(
          `/properties/${propertyId}/media`,
          'POST',
          { url: 'http://insecure.example/image.jpg' },
          agent,
        )
      ).status,
    ).toBe(400);
    const mediaId = result.body.media[0].id;
    expect(
      (
        await call(
          `/properties/${propertyId}/media/${mediaId}`,
          'DELETE',
          undefined,
          agent,
        )
      ).status,
    ).toBe(400);
    const secondImage = await call(
      `/properties/${propertyId}/media`,
      'POST',
      {
        url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811',
      },
      agent,
    );
    expect(secondImage.status).toBe(201);
    const simultaneous = await Promise.all(
      [mediaId, secondImage.body.id].map((imageId) =>
        call(
          `/properties/${propertyId}/media/${imageId}`,
          'DELETE',
          undefined,
          agent,
        ),
      ),
    );
    expect(simultaneous.map((response) => response.status).sort()).toEqual([
      200, 400,
    ]);
    expect((await call(`/properties/${propertySlug}`)).body.media).toHaveLength(
      1,
    );
  });
  it('persists favorite additions idempotently and removes them', async () => {
    expect(
      (await call('/favorites', 'POST', { propertyId }, buyer.accessToken))
        .status,
    ).toBe(201);
    await call('/favorites', 'POST', { propertyId }, buyer.accessToken);
    const list = await call('/favorites', 'GET', undefined, buyer.accessToken);
    expect(
      list.body.filter(
        (f: { propertyId: string }) => f.propertyId === propertyId,
      ).length,
    ).toBe(1);
    expect(
      (
        await call(
          `/favorites/${propertyId}`,
          'DELETE',
          undefined,
          buyer.accessToken,
        )
      ).status,
    ).toBe(200);
    expect(
      (await call('/favorites', 'GET', undefined, buyer.accessToken)).body
        .length,
    ).toBe(0);
  });
  it('isolates collections by owner and saves notes, order, and names', async () => {
    const result = await call(
      '/collections',
      'POST',
      { name: `${marker} Collection` },
      buyer.accessToken,
    );
    collectionId = result.body.id;
    expect(
      (await call(`/collections/${collectionId}`, 'GET', undefined, agent))
        .status,
    ).toBe(404);
    expect(
      (
        await call(
          `/collections/${collectionId}/items`,
          'POST',
          { propertyId, note: 'The light is beautiful.', rank: 2 },
          buyer.accessToken,
        )
      ).status,
    ).toBe(201);
    const collection = await call(
      `/collections/${collectionId}`,
      'GET',
      undefined,
      buyer.accessToken,
    );
    expect(collection.body.items[0].note).toBe('The light is beautiful.');
    expect(collection.body.items[0].rank).toBe(2);
    expect(
      (
        await call(
          `/collections/${collectionId}`,
          'PATCH',
          { name: 'A new chapter' },
          buyer.accessToken,
        )
      ).body.name,
    ).toBe('A new chapter');
    await call('/favorites', 'POST', { propertyId }, buyer.accessToken);
    try {
      await call(
        `/properties/${propertyId}`,
        'PATCH',
        { status: 'DRAFT' },
        agent,
      );
      expect((await call(`/properties/${propertySlug}`)).status).toBe(404);
      const saved = await call(
        '/favorites',
        'GET',
        undefined,
        buyer.accessToken,
      );
      expect(
        saved.body.some(
          (item: { propertyId: string }) => item.propertyId === propertyId,
        ),
      ).toBe(false);
      const hidden = await call(
        `/collections/${collectionId}`,
        'GET',
        undefined,
        buyer.accessToken,
      );
      expect(hidden.body.items).toEqual([]);
      const collections = await call(
        '/collections',
        'GET',
        undefined,
        buyer.accessToken,
      );
      expect(
        collections.body.find(
          (item: { id: string }) => item.id === collectionId,
        ).items,
      ).toEqual([]);
    } finally {
      await call(
        `/properties/${propertyId}`,
        'PATCH',
        { status: 'ACTIVE' },
        agent,
      );
      await call(
        `/favorites/${propertyId}`,
        'DELETE',
        undefined,
        buyer.accessToken,
      );
    }
  });
  it('saves search filters under the current account', async () => {
    const result = await call(
      '/saved-searches',
      'POST',
      { name: marker, filters: { type: 'SALE', beds: '3' } },
      buyer.accessToken,
    );
    savedSearchId = result.body.id;
    expect(
      (await call('/saved-searches', 'GET', undefined, buyer.accessToken))
        .body[0].filters.beds,
    ).toBe('3');
    expect(
      (await call('/saved-searches', 'GET', undefined, agent)).body.some(
        (s: { id: string }) => s.id === savedSearchId,
      ),
    ).toBe(false);
  });
  it('routes inquiries into the owning agent inbox and buyer account', async () => {
    const result = await call(
      '/inquiries',
      'POST',
      {
        propertyId,
        name: 'Quality Buyer',
        email: `${marker}@example.com`,
        message: 'I would love to arrange a private viewing.',
      },
      buyer.accessToken,
    );
    inquiryId = result.body.id;
    expect(result.status).toBe(201);
    const owned = await call('/inquiries', 'GET', undefined, agent);
    expect(owned.body.some((i: { id: string }) => i.id === inquiryId)).toBe(
      true,
    );
    const other = await call('/inquiries', 'GET', undefined, otherAgent);
    expect(other.body.some((i: { id: string }) => i.id === inquiryId)).toBe(
      false,
    );
    expect(
      (
        await call(
          `/inquiries/${inquiryId}`,
          'PATCH',
          { status: 'CONTACTED' },
          otherAgent,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await call(
          `/inquiries/${inquiryId}`,
          'PATCH',
          { status: 'CONTACTED' },
          agent,
        )
      ).body.status,
    ).toBe('CONTACTED');
    expect(
      (
        await call('/account/inquiries', 'GET', undefined, buyer.accessToken)
      ).body.some((i: { id: string }) => i.id === inquiryId),
    ).toBe(true);
  });
  it('records seller leads, newsletter subscriptions, and real dashboard counters', async () => {
    const lead = await call('/valuation', 'POST', {
      name: 'Quality Buyer',
      email: `${marker}@example.com`,
      address: '100 Test Avenue',
      sqft: 2000,
    });
    expect(lead.body.low).toBe(1480000);
    expect(lead.body.high).toBe(1960000);
    expect(
      (await call('/newsletter', 'POST', { email: `${marker}@example.com` }))
        .status,
    ).toBe(201);
    expect(
      (await call('/dashboard', 'GET', undefined, buyer.accessToken)).status,
    ).toBe(403);
    const dash = await call('/dashboard', 'GET', undefined, admin);
    expect(
      dash.body.leads.some(
        (l: { email: string }) => l.email === `${marker}@example.com`,
      ),
    ).toBe(true);
    expect(dash.body.subscribers).toBeGreaterThan(0);
    expect(
      (await call('/dashboard', 'GET', undefined, agent)).body.leads,
    ).toEqual([]);
  });
  it('publishes journal stories only for admins and records buyer reviews', async () => {
    const story = {
      title: marker,
      excerpt: 'A considered perspective on the spaces we call home.',
      body: 'Design & living\n\nA meaningful story about a carefully considered home.',
    };
    expect((await call('/journal', 'POST', story, agent)).status).toBe(403);
    const post = await call('/journal', 'POST', story, admin);
    postId = post.body.id;
    expect(post.status).toBe(201);
    expect((await call(`/journal/${post.body.slug}`)).body.title).toBe(marker);
    const review = await call(
      '/agents/agent-alexandra/reviews',
      'POST',
      {
        rating: 5,
        body: 'A thoughtful and personal approach throughout our search.',
      },
      buyer.accessToken,
    );
    expect(review.status).toBe(201);
    expect(
      (await call('/agents/agent-alexandra/reviews')).body.some(
        (r: { id: string }) => r.id === review.body.id,
      ),
    ).toBe(true);
  });
  it('cleans up collection, saved search, story, and listing through authorized APIs', async () => {
    expect(
      (
        await call(
          `/collections/${collectionId}/items/${propertyId}`,
          'DELETE',
          undefined,
          buyer.accessToken,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await call(
          `/collections/${collectionId}`,
          'DELETE',
          undefined,
          buyer.accessToken,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await call(
          `/saved-searches/${savedSearchId}`,
          'DELETE',
          undefined,
          buyer.accessToken,
        )
      ).status,
    ).toBe(200);
    expect(
      (await call(`/journal/${postId}`, 'DELETE', undefined, admin)).status,
    ).toBe(200);
    expect(
      (await call(`/properties/${propertyId}`, 'DELETE', undefined, admin))
        .status,
    ).toBe(200);
    expect((await call(`/properties/${propertySlug}`)).status).toBe(404);
  });
});
