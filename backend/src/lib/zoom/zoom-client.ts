import type { CreateMeetingInput, ZoomMeetingData } from './zoom-types.js';

const ZOOM_API = 'https://api.zoom.us/v2';

// Module-level token cache — refreshed automatically when < 5 min remaining
const tokenCache = { token: '', expiresAt: 0 };

async function getAccessToken(): Promise<string> {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 5 * 60 * 1000) {
    return tokenCache.token;
  }

  const accountId    = process.env.ZOOM_ACCOUNT_ID;
  const clientId     = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET belum dikonfigurasi di .env');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom OAuth gagal: ${res.status} ${body}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  tokenCache.token     = data.access_token;
  tokenCache.expiresAt = Date.now() + data.expires_in * 1000;
  return tokenCache.token;
}

async function zoomFetch(path: string, options: RequestInit): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`${ZOOM_API}${path}`, {
    ...options,
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

export async function createZoomMeeting(input: CreateMeetingInput): Promise<ZoomMeetingData> {
  const res = await zoomFetch('/users/me/meetings', {
    method: 'POST',
    body:   JSON.stringify({
      topic:      input.topic,
      type:       2,                // Scheduled meeting
      start_time: input.startTime,  // ISO 8601 UTC
      duration:   input.durationMinutes,
      settings: {
        auto_recording:    'cloud',
        join_before_host:  false,
        waiting_room:      false,
        mute_upon_entry:   true,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom createMeeting gagal: ${res.status} ${body}`);
  }

  const data = await res.json() as {
    id: number; join_url: string; start_url: string; password: string;
  };

  return {
    meetingId: String(data.id),
    joinUrl:   data.join_url,
    startUrl:  data.start_url,
    password:  data.password,
  };
}

export async function updateZoomMeeting(
  meetingId: string,
  input: Partial<CreateMeetingInput>,
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (input.topic)           body['topic']      = input.topic;
  if (input.startTime)       body['start_time'] = input.startTime;
  if (input.durationMinutes) body['duration']   = input.durationMinutes;

  const res = await zoomFetch(`/meetings/${meetingId}`, {
    method: 'PATCH',
    body:   JSON.stringify(body),
  });

  if (!res.ok && res.status !== 204) {
    const bodyText = await res.text();
    throw new Error(`Zoom updateMeeting gagal: ${res.status} ${bodyText}`);
  }
}

export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  const res = await zoomFetch(`/meetings/${meetingId}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    const bodyText = await res.text();
    throw new Error(`Zoom deleteMeeting gagal: ${res.status} ${bodyText}`);
  }
}
