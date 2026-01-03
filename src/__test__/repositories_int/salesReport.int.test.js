import { QueryTypes } from "sequelize";
import SalesRepository from "../../repositories/salesReport.repository.js";
import { sequelizeCon } from "../../config/initPostgre.js";

describe("SalesRepository Integration", () => {
    let salesRepo;
    let transaction;
    let targetCompanyId;

    beforeAll(async () => {
        salesRepo = new SalesRepository(sequelizeCon);

        const [company] = await sequelizeCon.query(
            "SELECT company_id FROM company WHERE company_name = 'Eventia Productions'",
            { type: QueryTypes.SELECT }
        );
        targetCompanyId = company.company_id;
    });

    beforeEach(async () => {
        transaction = await sequelizeCon.transaction();
    });

    afterEach(async () => {
        await transaction.rollback();
    });
    afterAll(async () => {
        await sequelizeCon.close();
    });

    describe("getOrganizationSalesReport", () => {
        test("getOrganizationSalesReport_WithCompanyId_ReturnsAggregatedData", async () => {
            const result = await salesRepo.getOrganizationSalesReport(
                { companyId: targetCompanyId },
                { transaction }
            );

            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(0);
            expect(result[0].organizacion).toBe("Eventia Productions");
            expect(result[0].cantidad_boletos_vendidos).toBe("2");
            expect(result[0].total_ingresos).toBe("100.00");
        });

        test("getOrganizationSalesReport_WithInvalidDateRange_ReturnsEmpty", async () => {
            const result = await salesRepo.getOrganizationSalesReport(
                {
                    companyId: targetCompanyId,
                    startDate: "1990-01-01",
                    endDate: "1990-12-31",
                },
                { transaction }
            );

            expect(result).toEqual([]);
        });
    });

    describe("getTicketSalesDetail", () => {
        test("getTicketSalesDetail_WithCompanyId_ReturnsRowPerTicket", async () => {
            const result = await salesRepo.getTicketSalesDetail(
                { companyId: targetCompanyId },
                { transaction }
            );

            expect(result).toHaveLength(2);
            expect(result[0].organizacion).toBe("Eventia Productions");
            expect(result[0].precio_pagado).toBe("50.00");
            expect(result[0].estado_ticket).toBe("sold");

            expect(result[0]).toHaveProperty("zona");
            expect(result[0]).toHaveProperty("fila");
            expect(result[0]).toHaveProperty("asiento");
        });
    });
});