import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startFeatureServer, type RunningServer } from './helpers/server';

const encodeForm = (data: Record<string, string>) => new URLSearchParams(data);

const extractSessionCookie = (response: Response) => {
  const setCookie = response.headers.get('set-cookie');

  if (!setCookie) {
    return '';
  }

  return setCookie.split(';')[0];
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findClientId = (html: string, clientName: string) => {
  const match = html.match(new RegExp(`${escapeRegExp(clientName)}[\\s\\S]*?href="/clients\\?edit=([^"]+)"`));
  return match?.[1];
};

const findEventTypeId = (html: string, typeName: string) => {
  const match = html.match(
    new RegExp(`${escapeRegExp(typeName)}[\\s\\S]*?href="/event-types\\?edit=([^"]+)"`),
  );
  return match?.[1];
};

const findEventId = (html: string, eventTitle: string) => {
  const match = html.match(
    new RegExp(`href="/calendar\\?event=([^"&]+)[\\s\\S]*?${escapeRegExp(eventTitle)}`),
  );
  return match?.[1];
};

describe('feature flows', () => {
  let server: RunningServer;

  const formHeaders = (path: string, cookie?: string) => ({
    Origin: server.baseUrl,
    Referer: `${server.baseUrl}${path}`,
    ...(cookie ? { Cookie: cookie } : {}),
  });

  beforeAll(async () => {
    server = await startFeatureServer();

    const warmup = await fetch(`${server.baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        Origin: server.baseUrl,
        Referer: `${server.baseUrl}/login`,
      },
      body: encodeForm({
        username: 'lily',
        password: 'la_graciosa_con_culo_gordo',
      }),
      redirect: 'manual',
    });

    if (warmup.status !== 302) {
      throw new Error(`No se pudo inicializar el servidor para tests.\n${server.logs()}`);
    }
  });

  afterAll(async () => {
    await server?.stop();
  });

  it('rechaza credenciales invalidas', async () => {
    const response = await fetch(`${server.baseUrl}/api/login`, {
      method: 'POST',
      headers: formHeaders('/login'),
      body: encodeForm({
        username: 'lily',
        password: 'incorrecta',
      }),
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/login?error=1');
  });

  it('permite login y CRUD completo de empresa y evento via HTTP', async () => {
    const loginResponse = await fetch(`${server.baseUrl}/api/login`, {
      method: 'POST',
      headers: formHeaders('/login'),
      body: encodeForm({
        username: 'lily',
        password: 'la_graciosa_con_culo_gordo',
      }),
      redirect: 'manual',
    });

    expect(loginResponse.status).toBe(302);
    expect(loginResponse.headers.get('location')).toBe('/calendar');

    const sessionCookie = extractSessionCookie(loginResponse);
    expect(sessionCookie).toContain('planner_session=');

    const clientName = `Feature Client ${Date.now()}`;
    const createClient = await fetch(`${server.baseUrl}/api/clients`, {
      method: 'POST',
      headers: formHeaders('/clients', sessionCookie),
      body: encodeForm({
        _action: 'save',
        redirectTo: '/clients',
        name: clientName,
        color: '#22c55e',
        description: 'Cliente de prueba para feature tests',
        active: 'on',
      }),
      redirect: 'manual',
    });

    expect(createClient.status).toBe(302);
    expect(createClient.headers.get('location')).toBe('/clients');

    const clientsPage = await fetch(`${server.baseUrl}/clients`, {
      headers: {
        Cookie: sessionCookie,
      },
    });
    const clientsHtml = await clientsPage.text();

    expect(clientsHtml).toContain(clientName);
    const clientId = findClientId(clientsHtml, clientName);
    expect(clientId).toBeTruthy();

    const typeName = `Feature Type ${Date.now()}`;
    const createEventType = await fetch(`${server.baseUrl}/api/event-types`, {
      method: 'POST',
      headers: formHeaders('/event-types', sessionCookie),
      body: encodeForm({
        _action: 'save',
        redirectTo: '/event-types',
        name: typeName,
        color: '#f97316',
        description: 'Tipo de prueba para feature tests',
        icon: 'post',
        active: 'on',
      }),
      redirect: 'manual',
    });

    expect(createEventType.status).toBe(302);
    expect(createEventType.headers.get('location')).toBe('/event-types');

    const eventTypesPage = await fetch(`${server.baseUrl}/event-types`, {
      headers: {
        Cookie: sessionCookie,
      },
    });
    const eventTypesHtml = await eventTypesPage.text();

    expect(eventTypesHtml).toContain(typeName);
    const eventTypeId = findEventTypeId(eventTypesHtml, typeName);
    expect(eventTypeId).toBeTruthy();

    const eventTitle = `Feature Event ${Date.now()}`;
    const createEvent = await fetch(`${server.baseUrl}/api/events`, {
      method: 'POST',
      headers: formHeaders('/calendar', sessionCookie),
      body: encodeForm({
        _action: 'save',
        redirectTo: '/calendar',
        title: eventTitle,
        clientId: clientId!,
        eventTypeId: eventTypeId!,
        startsAt: '2026-06-27T10:00',
        endsAt: '2026-06-27T11:00',
        description: 'Evento creado desde test de feature',
        status: 'pending',
      }),
      redirect: 'manual',
    });

    expect(createEvent.status).toBe(302);
    expect(createEvent.headers.get('location')).toBe('/calendar');

    const calendarPage = await fetch(`${server.baseUrl}/calendar`, {
      headers: {
        Cookie: sessionCookie,
      },
    });
    const calendarHtml = await calendarPage.text();

    expect(calendarHtml).toContain(eventTitle);
    const eventId = findEventId(calendarHtml, eventTitle);
    expect(eventId).toBeTruthy();

    const deleteEvent = await fetch(`${server.baseUrl}/api/events`, {
      method: 'POST',
      headers: formHeaders('/calendar', sessionCookie),
      body: encodeForm({
        _action: 'delete',
        redirectTo: '/calendar',
        id: eventId!,
      }),
      redirect: 'manual',
    });

    expect(deleteEvent.status).toBe(302);

    const calendarAfterDelete = await fetch(`${server.baseUrl}/calendar`, {
      headers: {
        Cookie: sessionCookie,
      },
    });
    expect(await calendarAfterDelete.text()).not.toContain(eventTitle);

    const deleteClient = await fetch(`${server.baseUrl}/api/clients`, {
      method: 'POST',
      headers: formHeaders('/clients', sessionCookie),
      body: encodeForm({
        _action: 'delete',
        redirectTo: '/clients',
        id: clientId!,
      }),
      redirect: 'manual',
    });

    expect(deleteClient.status).toBe(302);

    const clientsAfterDelete = await fetch(`${server.baseUrl}/clients`, {
      headers: {
        Cookie: sessionCookie,
      },
    });
    expect(await clientsAfterDelete.text()).not.toContain(clientName);

    const deleteEventType = await fetch(`${server.baseUrl}/api/event-types`, {
      method: 'POST',
      headers: formHeaders('/event-types', sessionCookie),
      body: encodeForm({
        _action: 'delete',
        redirectTo: '/event-types',
        id: eventTypeId!,
      }),
      redirect: 'manual',
    });

    expect(deleteEventType.status).toBe(302);
  });
});
