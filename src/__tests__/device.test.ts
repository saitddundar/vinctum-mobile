import { getDeviceType, getDeviceName } from "../lib/device";
import { DeviceType } from "../features/devices/types";

describe("getDeviceType", () => {
  it("returns PHONE for non-web platforms", () => {
    expect(getDeviceType()).toBe(DeviceType.PHONE);
  });
});

describe("getDeviceName", () => {
  it("returns device name from constants", () => {
    const name = getDeviceName();
    expect(typeof name).toBe("string");
    expect(name.length).toBeGreaterThan(0);
  });
});
