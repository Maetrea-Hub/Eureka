export interface CreateMeetingInput {
  topic:           string;
  startTime:       string;   // ISO 8601 UTC
  durationMinutes: number;
}

export interface ZoomMeetingData {
  meetingId: string;
  joinUrl:   string;
  startUrl:  string;
  password:  string;
}
