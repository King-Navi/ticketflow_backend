import { jest } from "@jest/globals";
import { Sequelize } from "sequelize";
import EventRepository from "../../repositories/event.repository.js";
import { EVENT_STATUS } from "../../model_db/utils/eventStatus.js";
const { Op } = Sequelize;

describe("EventRepository (one test per function)", () => {
    let modelMock;
    let repository;

    beforeEach(() => {
        modelMock = {
            findByPk: jest.fn(),
            create: jest.fn(),
            findAndCountAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
        };

        repository = new EventRepository(modelMock);
    });

    // findById
    test("findById_EventExists_ReturnsEvent", async () => {
        const eventId = 1;
        const event = { event_id: eventId };
        modelMock.findByPk.mockResolvedValue(event);

        const result = await repository.findById(eventId);

        expect(result).toEqual(event);
        expect(modelMock.findByPk).toHaveBeenCalledWith(eventId);
    });

    // createEvent
    test("createEvent_ValidData_ReturnsNewEventId", async () => {
        const newEvent = { event_id: 10 };
        modelMock.create.mockResolvedValue(newEvent);

        const data = {
            event_name: "Rock Concert",
            category: "Music",
            description: "Live rock show",
            event_date: "2025-01-01",
            start_time: "20:00:00",
            end_time: "22:00:00",
            company_id: 1,
            event_location_id: 2,
            event_status_id: EVENT_STATUS.DRAFT,
        };

        const result = await repository.createEvent(data);

        expect(result).toBe(10);
        expect(modelMock.create).toHaveBeenCalledWith(
            {
                ...data,
                event_status_id: data.event_status_id,
            },
            { transaction: undefined }
        );
    });

    // findAllByCompanyId
    test("findAllByCompanyId_CompanyWithEvents_ReturnsResultFromModel", async () => {
        const companyId = 1;
        const dbResult = { rows: [{ event_id: 1 }], count: 1 };
        modelMock.findAndCountAll.mockResolvedValue(dbResult);

        const result = await repository.findAllByCompanyId(companyId, {
            full: false,
            include: [],
            limit: 10,
            offset: 0,
        });

        expect(result).toBe(dbResult);
        expect(modelMock.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { company_id: companyId },
                include: [],
                limit: 10,
                offset: 0,
            })
        );
    });

    // searchOneFilter
    test("searchOneFilter_WithNameFilter_CallsFindAndCountAllWithPattern", async () => {
        const dbResult = { rows: [], count: 0 };
        modelMock.findAndCountAll.mockResolvedValue(dbResult);

        const result = await repository.searchOneFilter({ name: "Rock" });

        expect(result).toBe(dbResult);
        expect(modelMock.findAndCountAll).toHaveBeenCalledTimes(1);

        const callArg = modelMock.findAndCountAll.mock.calls[0][0];
        const where = callArg.where;

        expect(where).toHaveProperty("event_name");
        expect(where.event_name[Op.iLike]).toBe("%Rock%");
    });

    // findOverlappingEvent
    test("findOverlappingEvent_ConflictExists_ReturnsConflictEvent", async () => {
        const conflict = { event_id: 99 };
        modelMock.findOne.mockResolvedValue(conflict);

        const params = {
            event_location_id: 2,
            event_date: "2025-01-01",
            start_time: "10:00:00",
            end_time: "12:00:00",
        };

        const result = await repository.findOverlappingEvent(params);

        expect(result).toBe(conflict);
        expect(modelMock.findOne).toHaveBeenCalledTimes(1);
    });

    // updateEventById
    test("updateEventById_EventExistsAndNameUpdated_ReturnsUpdatedPlainEvent", async () => {
        const eventId = 1;
        const currentInstance = {
            event_id: eventId,
            event_name: "Old Name",
            category: "Music",
            description: "Desc",
            event_date: "2025-01-01",
            start_time: "20:00:00",
            end_time: "22:00:00",
            event_location_id: 2,
            get: jest.fn().mockReturnValue({
                event_id: eventId,
                event_name: "Old Name",
            }),
        };

        modelMock.findByPk = jest.fn().mockResolvedValue(currentInstance);

        const updatedInstance = {
            get: jest.fn().mockReturnValue({
                event_id: eventId,
                event_name: "New Name",
            }),
        };
        modelMock.update.mockResolvedValue([1, [updatedInstance]]);

        const result = await repository.updateEventById(eventId, {
            event_name: "New Name",
        });

        expect(modelMock.findByPk).toHaveBeenCalledWith(eventId, { transaction: undefined });
        expect(modelMock.update).toHaveBeenCalledWith(
            expect.objectContaining({
                event_name: "New Name",
            }),
            expect.objectContaining({
                where: { event_id: eventId },
            })
        );
        expect(result).toEqual({
            event_id: eventId,
            event_name: "New Name",
        });
    });

    // ensureEventInStatuses
    test("ensureEventInStatuses_EventInAllowedStatuses_ReturnsPlainEvent", async () => {
        const eventId = 1;
        const allowed = [EVENT_STATUS.DRAFT, EVENT_STATUS.ON_SALE];
        const instance = {
            event_status_id: EVENT_STATUS.ON_SALE,
            get: jest.fn().mockReturnValue({
                event_id: eventId,
                event_status_id: EVENT_STATUS.ON_SALE,
            }),
        };
        modelMock.findByPk.mockResolvedValue(instance);

        const result = await repository.ensureEventInStatuses(eventId, allowed);

        expect(modelMock.findByPk).toHaveBeenCalledWith(eventId, { transaction: undefined });
        expect(result).toEqual({
            event_id: eventId,
            event_status_id: EVENT_STATUS.ON_SALE,
        });
    });

    // ensureEventIsOnSale
    test("ensureEventIsOnSale_UsesEnsureEventInStatusesWithOnSale", async () => {
        const eventId = 5;
        const spy = jest
            .spyOn(repository, "ensureEventInStatuses")
            .mockResolvedValue({ event_id: eventId });

        const result = await repository.ensureEventIsOnSale(eventId);

        expect(spy).toHaveBeenCalledWith(eventId, [EVENT_STATUS.ON_SALE], { transaction: undefined });
        expect(result).toEqual({ event_id: eventId });
    });

    // ensureEventIsEditable
    test("ensureEventIsEditable_UsesEnsureEventInStatusesWithDraftAndEditLock", async () => {
        const eventId = 6;
        const spy = jest
            .spyOn(repository, "ensureEventInStatuses")
            .mockResolvedValue({ event_id: eventId });

        const result = await repository.ensureEventIsEditable(eventId);

        expect(spy).toHaveBeenCalledWith(
            eventId,
            [EVENT_STATUS.DRAFT, EVENT_STATUS.EDIT_LOCK],
            { transaction: undefined }
        );
        expect(result).toEqual({ event_id: eventId });
    });

    // updateEventStatus
    test("updateEventStatus_ValidStatusAndEventExists_UpdatesAndReturnsPlain", async () => {
        const eventId = 10;
        const newStatus = EVENT_STATUS.ON_SALE;

        const instance = {
            event_id: eventId,
            event_status_id: EVENT_STATUS.DRAFT,
            save: jest.fn().mockResolvedValue(),
            get: jest.fn().mockReturnValue({
                event_id: eventId,
                event_status_id: newStatus,
            }),
        };

        modelMock.findByPk.mockResolvedValue(instance);

        const result = await repository.updateEventStatus(eventId, newStatus);

        expect(modelMock.findByPk).toHaveBeenCalledWith(eventId, { transaction: undefined });
        expect(instance.save).toHaveBeenCalledWith({ transaction: undefined });
        expect(result).toEqual({
            event_id: eventId,
            event_status_id: newStatus,
        });
    });

    // setEventOnSale
    test("setEventOnSale_CallsUpdateEventStatusWithOnSale", async () => {
        const eventId = 20;
        const spy = jest
            .spyOn(repository, "updateEventStatus")
            .mockResolvedValue({ event_id: eventId, event_status_id: EVENT_STATUS.ON_SALE });

        const result = await repository.setEventOnSale(eventId);

        expect(spy).toHaveBeenCalledWith(eventId, EVENT_STATUS.ON_SALE, { transaction: undefined });
        expect(result).toEqual({
            event_id: eventId,
            event_status_id: EVENT_STATUS.ON_SALE,
        });
    });

    // setEventPaused
    test("setEventPaused_CallsUpdateEventStatusWithPaused", async () => {
        const eventId = 21;
        const spy = jest
            .spyOn(repository, "updateEventStatus")
            .mockResolvedValue({ event_id: eventId, event_status_id: EVENT_STATUS.PAUSED });

        const result = await repository.setEventPaused(eventId);

        expect(spy).toHaveBeenCalledWith(eventId, EVENT_STATUS.PAUSED, { transaction: undefined });
        expect(result).toEqual({
            event_id: eventId,
            event_status_id: EVENT_STATUS.PAUSED,
        });
    });

    // setEventClosed
    test("setEventClosed_CallsUpdateEventStatusWithClosed", async () => {
        const eventId = 22;
        const spy = jest
            .spyOn(repository, "updateEventStatus")
            .mockResolvedValue({ event_id: eventId, event_status_id: EVENT_STATUS.CLOSED });

        const result = await repository.setEventClosed(eventId);

        expect(spy).toHaveBeenCalledWith(eventId, EVENT_STATUS.CLOSED, { transaction: undefined });
        expect(result).toEqual({
            event_id: eventId,
            event_status_id: EVENT_STATUS.CLOSED,
        });
    });

    // cancelEvent
    test("cancelEvent_CallsUpdateEventStatusWithCanceled", async () => {
        const eventId = 23;
        const spy = jest
            .spyOn(repository, "updateEventStatus")
            .mockResolvedValue({ event_id: eventId, event_status_id: EVENT_STATUS.CANCELED });

        const result = await repository.cancelEvent(eventId);

        expect(spy).toHaveBeenCalledWith(eventId, EVENT_STATUS.CANCELED, { transaction: undefined });
        expect(result).toEqual({
            event_id: eventId,
            event_status_id: EVENT_STATUS.CANCELED,
        });
    });
});
