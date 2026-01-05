import { jest } from "@jest/globals";
import {
  BadRequest,
  NotFound,
  Unauthorized,
} from "../../utils/errors/error.400.js";

import CredentialRepository from "../../repositories/credential.repository.js";
import AttendeeRepository from "../../repositories/attendee.repository.js";
import OrganizerRepository from "../../repositories/organizer.repository.js";



/**
 * Mock de módulos ESM con jest.unstable_mockModule
 *    (esto se ejecuta ANTES de importar el servicio que los usa)
 */
jest.unstable_mockModule("../../messaging/loadEmailTemplate.js", () => ({
  loadVerificationCodeTemplate: jest.fn(),
}));



jest.unstable_mockModule("../../utils/jwt.js", () => ({
  generateToken: jest.fn(),
}));

jest.unstable_mockModule("../../utils/codeManager.js", () => ({
  default: {
    storeCode: jest.fn(),
    verifyEmailCode: jest.fn(),
  },
}));

jest.unstable_mockModule("../../messaging/emailService.js", () => ({
  sendEmail: jest.fn(),
}));

jest.unstable_mockModule("../../model_db/utils/role.js", () => ({
  ROLE: {
    ATTENDEE: "attendee",
    ORGANIZER: "organizer",
    ADMIN: "admin",
  },
  resolveUserRole: jest.fn(() => ({
    roleName: "attendee",
    roleCode: "A",
  })),
}));

/**
 * IMPORTS DINÁMICOS de los módulos ya mockeados
 *    (top-level await, permitido en ESM)
 */

const { default: codeManager } = await import(
  "../../utils/codeManager.js"
);
const { generateToken } = await import("../../utils/jwt.js");
const { sendEmail } = await import("../../messaging/emailService.js");
const { resolveUserRole } = await import(
  "../../model_db/utils/role.js"
);

const {
  registerService,
  recoverEmailService,
  sendRecoverCodeToEmailService,
} = await import("../../service/user.service.js");

const {
  loadVerificationCodeTemplate
} = await import("../../messaging/loadEmailTemplate.js");

beforeEach(() => {
  jest.clearAllMocks();
});

// registerService

describe("registerService", () => {
  test("registerService_AttendeeValidData_CreatesCredentialAndAttendee", async () => {
    const registerCredentialSpy = jest
      .spyOn(CredentialRepository.prototype, "registerCredential")
      .mockResolvedValue(123);

    const registerAttendeeSpy = jest
      .spyOn(AttendeeRepository.prototype, "registerAttendee")
      .mockResolvedValue(456);

    const registerOrganizerSpy = jest
      .spyOn(OrganizerRepository.prototype, "registerOrganizer")
      .mockResolvedValue(999);

    const payload = {
      email: "test@example.com",
      nickname: "testuser",
      passwordHash: "hashed-pass",
      role: "attendee",
      attendee: {
        firstName: "John",
        lastName: "Doe",
        middleName: "X",
      },
    };

    const result = await registerService(payload);

    expect(result).toEqual({
      credential_id: 123,
      idAttendee: 456,
    });

    expect(registerCredentialSpy).toHaveBeenCalledTimes(1);
    expect(registerCredentialSpy).toHaveBeenCalledWith({
      email: "test@example.com",
      nickname: "testuser",
      passwordHash: "hashed-pass",
      role: "attendee",
    });

    expect(registerAttendeeSpy).toHaveBeenCalledTimes(1);
    expect(registerAttendeeSpy).toHaveBeenCalledWith(
      "John",
      "Doe",
      "X",
      123
    );

    expect(registerOrganizerSpy).not.toHaveBeenCalled();
  });
});

// recoverEmailService

describe("recoverEmailService", () => {
  test("recoverEmailService_ValidEmailAndCode_ReturnsTokenString", async () => {
    const email = "user@example.com";
    const code = "ABC123";

    const isEmailTakenSpy = jest
      .spyOn(CredentialRepository.prototype, "isEmailTaken")
      .mockResolvedValue(true);

    const findCredentialByEmailSpy = jest
      .spyOn(CredentialRepository.prototype, "findCredentialByEmail")
      .mockResolvedValue({
        credential_id: 10,
        email,
        nickname: "usernick",
      });

    const findAttendeeSpy = jest
      .spyOn(AttendeeRepository.prototype, "findAttendeeByCredentialId")
      .mockResolvedValue({
        idAttendee: 999,
        firstName: "Alice",
      });

    codeManager.verifyEmailCode.mockReturnValue(true);

    resolveUserRole.mockReturnValue({
      roleName: "attendee",
      roleCode: "A",
    });

    generateToken.mockReturnValue("jwt-token-123");

    const token = await recoverEmailService({ email, code });

    expect(isEmailTakenSpy).toHaveBeenCalledWith(email);
    expect(codeManager.verifyEmailCode).toHaveBeenCalledWith(email, code);
    expect(findCredentialByEmailSpy).toHaveBeenCalledWith(email);
    expect(resolveUserRole).toHaveBeenCalledWith({
      credential_id: 10,
      email,
      nickname: "usernick",
    });
    expect(findAttendeeSpy).toHaveBeenCalledWith(10);

    expect(generateToken).toHaveBeenCalledTimes(1);
    expect(generateToken).toHaveBeenCalledWith(
      999,        // idUser
      email,      // credential.email
      "usernick", // credential.nickname
      "Alice",    // userProfile.firstName
      "A",        // roleCode
      "1h"        // expiry param que usa tu servicio
    );

    expect(typeof token).toBe("string");
    expect(token).toBe("jwt-token-123");
  });
});

// sendRecoverCodeToEmailService

describe("sendRecoverCodeToEmailService", () => {
  test("manda email con el html del template", async () => {
    codeManager.storeCode.mockReturnValue("CODE123");
    loadVerificationCodeTemplate.mockReturnValue("<p>HTML MOCK</p>");
    sendEmail.mockResolvedValue(true);

    await sendRecoverCodeToEmailService("recover@example.com");

    expect(loadVerificationCodeTemplate).toHaveBeenCalledWith("CODE123");

    expect(sendEmail).toHaveBeenCalledWith({
      to: "recover@example.com",
      subject: "Código de recuperación de cuenta",
      html: "<p>HTML MOCK</p>",
    });
  });
});
