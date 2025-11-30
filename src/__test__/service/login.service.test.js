import { jest } from "@jest/globals";

import CredentialRepository from "../../repositories/credential.repository.js";
import AttendeeRepository from "../../repositories/attendee.repository.js";
import OrganizerRepository from "../../repositories/organizer.repository.js";

import { loginService } from "../../service/login.service.js";
describe("loginService", () => {
    beforeAll(() => {
        process.env.JWT_SECRET = "test-secret-key";
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("loginService_ValidAttendeeCredentials_ReturnsTokenString", async () => {
        const username = "testuser";
        const password = "secret123";

        const fakeCredential = {
            credential_id: 10,
            email: "user@test.com",
            nickname: username,
            role: "attendee",
        };

        const fakeAttendee = {
            attendee_id: 777,
            first_name: "Ivan",
        };

        const findByNickSpy = jest
            .spyOn(CredentialRepository.prototype, "findCredentialByNickName")
            .mockResolvedValue(fakeCredential);

        const isValidPasswordSpy = jest
            .spyOn(CredentialRepository.prototype, "isValidPassword")
            .mockResolvedValue(true);

        const findAttendeeSpy = jest
            .spyOn(AttendeeRepository.prototype, "findAttendeeByCredentialId")
            .mockResolvedValue(fakeAttendee);

        const findOrganizerSpy = jest.spyOn(
            OrganizerRepository.prototype,
            "findOrganizerByCredentialId"
        );

        const updateLastLoginSpy = jest
            .spyOn(CredentialRepository.prototype, "updateLastLogin")
            .mockResolvedValue(true);

        const result = await loginService(username, password);

        expect(findByNickSpy).toHaveBeenCalledWith(username);
        expect(isValidPasswordSpy).toHaveBeenCalledWith(username, password);
        expect(findAttendeeSpy).toHaveBeenCalledWith(fakeCredential.credential_id);
        expect(findOrganizerSpy).not.toHaveBeenCalled();
        expect(updateLastLoginSpy).toHaveBeenCalledWith(fakeCredential.credential_id);

        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
    });
});