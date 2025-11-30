import { jest } from "@jest/globals";
import EventRepository from "../../repositories/event.repository";
import { recoverEventsService } from "../../service/company.service";

describe("recoverEventsService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("recoverEventsService_WithFiltersAndOrdering_CallsRepoWithNormalizedParams", async () => {
    const expectedResult = {
      rows: [{ event_id: 1, event_name: "Rock Fest" }],
      count: 1,
    };

    const spy = jest
      .spyOn(EventRepository.prototype, "findAllByCompanyId")
      .mockResolvedValue(expectedResult);

    const companyId = "5";
    const result = await recoverEventsService(companyId, {
      limit: "10",
      offset: "2",
      dateFrom: "2025-01-01",
      dateTo: "2025-01-31",
      category: ["music"],
      status: ["on_sale"],
      name: "   Rock   ",
      full: "true",
      orderBy: "created_at",
      orderDir: "DESC",
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(5, {
      limit: 10,
      offset: 2,
      dateFrom: "2025-01-01",
      dateTo: "2025-01-31",
      category: ["music"],
      status: ["on_sale"],
      name: "Rock",
      full: true,
      order: [
        ["created_at", "DESC"],
        ["start_time", "ASC"],
      ],
    });

    expect(result).toBe(expectedResult);
  });
});
