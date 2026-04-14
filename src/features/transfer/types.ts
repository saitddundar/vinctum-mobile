export enum TransferStatus {
  PENDING = "TRANSFER_STATUS_PENDING",
  IN_PROGRESS = "TRANSFER_STATUS_IN_PROGRESS",
  COMPLETED = "TRANSFER_STATUS_COMPLETED",
  CANCELLED = "TRANSFER_STATUS_CANCELLED",
  FAILED = "TRANSFER_STATUS_FAILED",
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

export interface TransferEvent {
  type: "EVENT_TYPE_NEW" | "EVENT_TYPE_UPDATED" | "EVENT_TYPE_COMPLETED" | "EVENT_TYPE_CANCELLED";
  transfer: Transfer;
  timestamp: string;
}
