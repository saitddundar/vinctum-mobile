export interface UserInfo {
  user_id: string;
  username: string;
  email: string;
}

export interface Friend {
  id: string;
  user: UserInfo;
  status: string;
  created_at: string;
}

export interface NotificationCount {
  friend_requests: number;
  incoming_transfers: number;
  total: number;
}
