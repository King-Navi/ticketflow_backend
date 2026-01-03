import { QueryTypes } from "sequelize";
import { sequelizeCon } from "../../config/initPostgre.js";

describe("Integration: TicketFlow Connectivity & Seed Check", () => {
    afterAll(async () => {
        await sequelizeCon.close();
    });
    test("should find the seeded company 'Eventia Productions'", async () => {
        const rows = await sequelizeCon.query(
            "SELECT company_id, company_name, tax_id FROM company WHERE company_name = :name",
            {
                replacements: { name: "Eventia Productions" },
                type: QueryTypes.SELECT,
            }
        );

        expect(rows).toBeDefined();
        expect(rows.length).toBe(1);
        const company = rows[0];
        expect(company.company_name).toBe("Eventia Productions");
        expect(company.tax_id).toBe("EVP-980624-5R2");
    });

    test("should have the critical catalog statuses (e.g., 'sold')", async () => {
        const rows = await sequelizeCon.query(
            "SELECT * FROM ticket_status WHERE status_name = 'sold'",
            { type: QueryTypes.SELECT }
        );

        expect(rows.length).toBeGreaterThan(0);
        expect(rows[0].status_name).toBe("sold");
    });
});