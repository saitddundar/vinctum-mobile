export enum DeviceType {
  PC = 1,
  PHONE = 2,
  TABLET = 3,
}

export interface Device {
  device_id: string;
  user_id: string;
  name: string;
  device_type: DeviceType;
  node_id: string;
  fingerprint: string;
  is_approved: boolean;
  approved_at: string | null;
  approved_by_device_id: string | null;
  last_active: string | null;
  created_at: string;
  is_revoked: boolean;
}

export interface RegisterDeviceRequest {
  name: string;
  device_type: DeviceType;
  fingerprint: string;
  node_id: string;
}

export interface PairingGenerateRequest {
  device_id: string;
}

export interface PairingRedeemRequest {
  pairing_code: string;
  name: string;
  device_type: DeviceType;
  fingerprint: string;
  node_id: string;
}

export interface PairingApproveRequest {
  approver_device_id: string;
  pending_device_id: string;
  approve: boolean;
}
