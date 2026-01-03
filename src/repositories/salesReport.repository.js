import { Sequelize, QueryTypes } from "sequelize";
import { sequelizeCon } from "../config/initPostgre.js";

export default class SalesRepository {
  constructor(sequelize = sequelizeCon) {
    if (!sequelize) {
      throw new Error("sequelize instance is required.");
    }
    this.sequelize = sequelize;
  }

  /**
   * @param {{
   * companyId?: number,
   * startDate?: string,
   * endDate?: string
   * }} [filters]
   * @param {{ transaction?: import("sequelize").Transaction }} [options]
   * @returns {Promise<Array<{
   * company_id: number,
   * organizacion: string,
   * event_id: number,
   * evento: string,
   * fecha_evento: string,
   * cantidad_boletos_vendidos: string,
   * total_ingresos: string
   * }>>}
   */
  async getOrganizationSalesReport({ companyId, startDate, endDate } = {}, { transaction } = {}) {
    const conditions = [];
    const replacements = {};

    if (companyId) {
      conditions.push("company_id = :companyId");
      replacements.companyId = companyId;
    }

    if (startDate) {
      conditions.push("fecha_evento >= :startDate");
      replacements.startDate = startDate;
    }

    if (endDate) {
      conditions.push("fecha_evento <= :endDate");
      replacements.endDate = endDate;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const query = `
      SELECT 
        company_id,
        organizacion,
        event_id,
        evento,
        fecha_evento,
        cantidad_boletos_vendidos,
        total_ingresos
      FROM vw_organization_sales_report
      ${whereClause}
      ORDER BY fecha_evento DESC, total_ingresos DESC
    `;

    try {
      const rows = await this.sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT,
        transaction,
      });

      return rows;
    } catch (error) {
      if (process.env.DEBUG === "true") {
        console.error(error)
      }
      if (error instanceof Sequelize.ConnectionError) {
        throw new Error("Cannot connect to the database.");

      }
      if (error instanceof Sequelize.DatabaseError) {
        throw new Error("Database error occurred while fetching sales report.");
      }
      throw error;
    }
  }

  /**
   * 
   * @param {{
   * companyId?: number,
   * startDate?: string,
   * endDate?: string
   * }} [filters]
   * @param {{ transaction?: import("sequelize").Transaction }} [options]
   * @returns {Promise<Array<{
   * company_id: number,
   * organizacion: string,
   * event_id: number,
   * evento: string,
   * fecha_evento: string,
   * ticket_id: number,
   * precio_pagado: string,
   * precio_original: string,
   * zona: string,
   * fila: string,
   * asiento: string,
   * estado_ticket: string,
   * fecha_venta: Date
   * }>>}
   */
  async getTicketSalesDetail({ companyId, startDate, endDate } = {}, { transaction } = {}) {
    const conditions = [];
    const replacements = {};

    if (companyId) {
      conditions.push("company_id = :companyId");
      replacements.companyId = companyId;
    }

    if (startDate) {
      conditions.push("fecha_evento >= :startDate");
      replacements.startDate = startDate;
    }

    if (endDate) {
      conditions.push("fecha_evento <= :endDate");
      replacements.endDate = endDate;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const query = `
      SELECT 
        company_id,
        organizacion,
        event_id,
        evento,
        fecha_evento,
        ticket_id,
        precio_pagado,
        precio_original,
        zona,
        fila,
        asiento,
        estado_ticket,
        fecha_venta
      FROM vw_ticket_sales_details
      ${whereClause}
      ORDER BY fecha_evento DESC, zona ASC
    `;

    try {
      const rows = await this.sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT,
        transaction,
      });

      return rows;
    } catch (error) {
      if (process.env.DEBUG === "true") {
        console.error(error)
      }
      if (error instanceof Sequelize.ConnectionError) {
        throw new Error("Cannot connect to the database.");
      }
      if (error instanceof Sequelize.DatabaseError) {
        throw new Error("Database error occurred while fetching ticket detail.");
      }
      throw error;
    }
  }
}