import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requestNotificationPermission, registerServiceWorker } from "@/lib/push/webpush";

describe("webpush", () => {
  const originalNotification = global.Notification;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.Notification = originalNotification;
  });

  describe("requestNotificationPermission", () => {
    it("should return false if Notification API is not in window", async () => {
      // @ts-ignore
      delete global.Notification;
      const result = await requestNotificationPermission();
      expect(result).toBe(false);
    });

    it("should return true if permission is already granted", async () => {
      global.Notification = {
        permission: "granted",
        requestPermission: vi.fn(),
      } as unknown as typeof Notification;

      const result = await requestNotificationPermission();
      expect(result).toBe(true);
    });

    it("should request permission if not already denied/granted and return true if approved", async () => {
      const requestPermissionMock = vi.fn().mockResolvedValue("granted");
      global.Notification = {
        permission: "default",
        requestPermission: requestPermissionMock,
      } as unknown as typeof Notification;

      const result = await requestNotificationPermission();
      expect(requestPermissionMock).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return false if permission is denied", async () => {
      global.Notification = {
        permission: "denied",
        requestPermission: vi.fn(),
      } as unknown as typeof Notification;

      const result = await requestNotificationPermission();
      expect(result).toBe(false);
    });
  });

  describe("registerServiceWorker", () => {
    it("should register service worker if supported in navigator", async () => {
      const registerMock = vi.fn().mockResolvedValue({ scope: "/" });
      Object.defineProperty(global.navigator, "serviceWorker", {
        writable: true,
        value: {
          register: registerMock,
        },
      });

      const reg = await registerServiceWorker();
      expect(registerMock).toHaveBeenCalledWith("/sw.js");
      expect(reg).toEqual({ scope: "/" });
    });
  });
});
