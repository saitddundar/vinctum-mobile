export enum TransferStatus {
  PENDING = "TRANSFER_STATUS_PENDING",
  IN_PROGRESS = "TRANSFER_STATUS_IN_PROGRESS",
  PAUSED = "TRANSFER_STATUS_PAUSED",
  COMPLETED = "TRANSFER_STATUS_COMPLETED",
  CANCELLED = "TRANSFER_STATUS_CANCELLED",
  FAILED = "TRANSFER_STATUS_FAILED",
  AWAITING_APPROVAL = "TRANSFER_STATUS_AWAITING_APPROVAL",
}

export interface Transfer {
  transfer_id: string;
  sender_node_id: string;
  receiver_node_id: string;
  filename: string;
  total_size_bytes: number;
  status: TransferStatus;
  progress_percent: number;
  created_at: string;
  sender_ephemeral_pubkey: string;
  content_hash: string;
  group_transfer_id?: string;
  wrapped_file_key?: string;
}

export interface TransferDetail {
  transfer_id: string;
  status: TransferStatus;
  chunks_transferred: number;
  total_chunks: number;
  bytes_transferred: number;
  total_bytes: number;
  started_at: string;
  updated_at: string;
  sender_ephemeral_pubkey: string;
}

export interface InitiateTransferRequest {
  sender_node_id: string;
  receiver_node_id: string;
  filename: string;
  total_size_bytes: number;
  content_hash: string;
  chunk_size_bytes: number;
  replication_factor: number;
  sender_ephemeral_pubkey: string;
}

export interface RecipientKey {
  receiver_node_id: string;
  wrapped_file_key: string; // base64
}

export interface InitiateGroupTransferRequest {
  sender_node_id: string;
  filename: string;
  total_size_bytes: number;
  content_hash: string;
  chunk_size_bytes: number;
  sender_ephemeral_pubkey: string;
  recipient_keys: RecipientKey[];
}

export interface InitiateGroupTransferResponse {
  group_transfer_id: string;
  total_chunks: number;
  transfers: Transfer[];
  created_at: string;
}

export interface TransferEvent {
  type:
    | "EVENT_TYPE_NEW"
    | "EVENT_TYPE_UPDATED"
    | "EVENT_TYPE_COMPLETED"
    | "EVENT_TYPE_CANCELLED"
    | "EVENT_TYPE_PAUSED"
    | "EVENT_TYPE_RESUMED";
  transfer: Transfer;
  timestamp: string;
}
