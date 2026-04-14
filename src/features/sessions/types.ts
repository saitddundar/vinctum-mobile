import { Device } from "../devices/types";

export interface Session {
  session_id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  devices: Device[];
  created_at: string;
  closed_at: string | null;
}
