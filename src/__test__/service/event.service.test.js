import { jest } from "@jest/globals";

import EventRepository from "../../repositories/event.repository";
import CompanyRepository from "../../repositories/company.repository";
import EventLocationRepository from "../../repositories/eventLocation.repository";
import OrganizerRepository from "../../repositories/organizer.repository";

import {
  newEventService,
  editEventService,
  searchCompanyEventsService,
  updateEventStatusService,
} from "../../service/event.service.js";

describe("Event services", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // newEventService
  test("newEventService_ValidPayload_CreatesEvent", async () => {
    const company = { company_id: 1 };
    const location = { event_location_id: 2 };
    const organizer = { organizer_id: 10, company_id: 1 };

    const companySpy = jest
      .spyOn(CompanyRepository.prototype, "findCompanyById")
      .mockResolvedValue(company);

    const locationSpy = jest
      .spyOn(EventLocationRepository.prototype, "findByEventLocationId")
      .mockResolvedValue(location);

    const organizerSpy = jest
      .spyOn(OrganizerRepository.prototype, "findOrganizerByCredentialId")
      .mockResolvedValue(organizer);

    const overlapSpy = jest
      .spyOn(EventRepository.prototype, "findOverlappingEvent")
      .mockResolvedValue(null);

    const createSpy = jest
      .spyOn(EventRepository.prototype, "createEvent")
      .mockResolvedValue(123);

    const payload = {
      event_name: "Node.js Meetup",
      category: "meetup",
      description: "Lightning talks",
      event_date: "2025-11-15",
      start_time: "19:00:00",
      end_time: "21:00:00",
      company_id: 1,
      event_location_id: 2,
    };
    const organizerCredentialId = 99;

    const result = await newEventService(payload, organizerCredentialId);

    expect(companySpy).toHaveBeenCalledWith(1);
    expect(locationSpy).toHaveBeenCalledWith(2);
    expect(organizerSpy).toHaveBeenCalledWith(organizerCredentialId);

    expect(overlapSpy).toHaveBeenCalledWith({
      event_location_id: 2,
      event_date: "2025-11-15",
      start_time: "19:00:00",
      end_time: "21:00:00",
    });

    expect(createSpy).toHaveBeenCalledWith({
      event_name: "Node.js Meetup",
      category: "meetup",
      description: "Lightning talks",
      event_date: "2025-11-15",
      start_time: "19:00:00",
      end_time: "21:00:00",
      company_id: 1,
      event_location_id: 2,
    });

    expect(result).toBe(123);
  });

  // editEventService
  test("editEventService_ValidPayload_UpdatesEvent", async () => {
    const organizer = { organizer_id: 10, company_id: 5 };
    const existingEvent = {
      event_id: 7,
      company_id: 5,
      event_location_id: 3,
      event_date: "2025-01-01",
      start_time: "10:00:00",
      end_time: "12:00:00",
    };
    const updatedEvent = {
      ...existingEvent,
      description: "New description",
    };

    const organizerSpy = jest
      .spyOn(OrganizerRepository.prototype, "findOrganizerByCredentialId")
      .mockResolvedValue(organizer);

    const findEventSpy = jest
      .spyOn(EventRepository.prototype, "findById")
      .mockResolvedValue(existingEvent);

    const updateSpy = jest
      .spyOn(EventRepository.prototype, "updateEventById")
      .mockResolvedValue(updatedEvent);

    const eventId = 7;
    const payload = {
      description: "New description",
    };
    const organizerCredentialId = 99;

    const result = await editEventService(eventId, payload, organizerCredentialId);

    expect(organizerSpy).toHaveBeenCalledWith(organizerCredentialId);
    expect(findEventSpy).toHaveBeenCalledWith(eventId);
    expect(updateSpy).toHaveBeenCalledWith(eventId, payload);
    expect(result).toEqual(updatedEvent);
  });

  // searchCompanyEventsService
  test("searchCompanyEventsService_WithNameAndOptions_CallsSearchOneFilterWithNormalizedOptions", async () => {
    const expectedResult = {
      rows: [{ event_id: 1, event_name: "Rock Fest" }],
      count: 1,
    };

    const searchSpy = jest
      .spyOn(EventRepository.prototype, "searchOneFilter")
      .mockResolvedValue(expectedResult);

    const result = await searchCompanyEventsService({
      name: "Rock Fest",
      limit: "10",
      offset: "5",
      orderBy: "created_at",
      orderDir: "DESC",
      include: ["dummy-include"],
    });

    expect(searchSpy).toHaveBeenCalledTimes(1);
    expect(searchSpy).toHaveBeenCalledWith({
      name: "Rock Fest",
      date: undefined,
      category: undefined,
      status: undefined,
      limit: 10,
      offset: 5,
      order: [
        ["created_at", "DESC"],
        ["start_time", "ASC"],
      ],
      include: ["dummy-include"],
    });

    expect(result).toBe(expectedResult);
  });

  // updateEventStatusService
  test("updateEventStatusService_ValidData_UpdatesStatus", async () => {
    const organizer = { organizer_id: 10, company_id: 7 };
    const existingEvent = { event_id: 15, company_id: 7 };
    const updatedEvent = { event_id: 15, event_status_id: 3 };

    const organizerSpy = jest
      .spyOn(OrganizerRepository.prototype, "findOrganizerByCredentialId")
      .mockResolvedValue(organizer);

    const findEventSpy = jest
      .spyOn(EventRepository.prototype, "findById")
      .mockResolvedValue(existingEvent);

    const updateStatusSpy = jest
      .spyOn(EventRepository.prototype, "updateEventStatus")
      .mockResolvedValue(updatedEvent);

    const eventId = 15;
    const newStatus = 3;
    const organizerCredentialId = 99;

    const result = await updateEventStatusService(
      eventId,
      newStatus,
      organizerCredentialId
    );

    expect(organizerSpy).toHaveBeenCalledWith(organizerCredentialId);
    expect(findEventSpy).toHaveBeenCalledWith(eventId);
    expect(updateStatusSpy).toHaveBeenCalledWith(eventId, newStatus);
    expect(result).toEqual(updatedEvent);
  });
});
