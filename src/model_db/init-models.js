import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _attendee from  "./attendee.js";
import _card from  "./card.js";
import _company from  "./company.js";
import _credential from  "./credential.js";
import _crypto_payment from  "./crypto_payment.js";
import _event from  "./event.js";
import _event_location from  "./event_location.js";
import _event_seat from  "./event_seat.js";
import _event_seat_status from  "./event_seat_status.js";
import _organizer from  "./organizer.js";
import _payment from  "./payment.js";
import _payment_method from  "./payment_method.js";
import _refund from  "./refund.js";
import _refund_status from  "./refund_status.js";
import _reservation from  "./reservation.js";
import _seat from  "./seat.js";
import _section from  "./section.js";
import _ticket from  "./ticket.js";
import _ticket_status from  "./ticket_status.js";

export default function initModels(sequelize) {
  const attendee = _attendee.init(sequelize, DataTypes);
  const card = _card.init(sequelize, DataTypes);
  const company = _company.init(sequelize, DataTypes);
  const credential = _credential.init(sequelize, DataTypes);
  const crypto_payment = _crypto_payment.init(sequelize, DataTypes);
  const event = _event.init(sequelize, DataTypes);
  const event_location = _event_location.init(sequelize, DataTypes);
  const event_seat = _event_seat.init(sequelize, DataTypes);
  const event_seat_status = _event_seat_status.init(sequelize, DataTypes);
  const organizer = _organizer.init(sequelize, DataTypes);
  const payment = _payment.init(sequelize, DataTypes);
  const payment_method = _payment_method.init(sequelize, DataTypes);
  const refund = _refund.init(sequelize, DataTypes);
  const refund_status = _refund_status.init(sequelize, DataTypes);
  const reservation = _reservation.init(sequelize, DataTypes);
  const seat = _seat.init(sequelize, DataTypes);
  const section = _section.init(sequelize, DataTypes);
  const ticket = _ticket.init(sequelize, DataTypes);
  const ticket_status = _ticket_status.init(sequelize, DataTypes);

  payment.belongsTo(attendee, { as: "attendee", foreignKey: "attendee_id"});
  attendee.hasMany(payment, { as: "payments", foreignKey: "attendee_id"});
  payment_method.belongsTo(attendee, { as: "attendee", foreignKey: "attendee_id"});
  attendee.hasMany(payment_method, { as: "payment_methods", foreignKey: "attendee_id"});
  reservation.belongsTo(attendee, { as: "attendee", foreignKey: "attendee_id"});
  attendee.hasMany(reservation, { as: "reservations", foreignKey: "attendee_id"});
  event.belongsTo(company, { as: "company", foreignKey: "company_id"});
  company.hasMany(event, { as: "events", foreignKey: "company_id"});
  organizer.belongsTo(company, { as: "company", foreignKey: "company_id"});
  company.hasMany(organizer, { as: "organizers", foreignKey: "company_id"});
  attendee.belongsTo(credential, { as: "credential", foreignKey: "credential_id"});
  credential.hasOne(attendee, { as: "attendee", foreignKey: "credential_id"});
  organizer.belongsTo(credential, { as: "credential", foreignKey: "credential_id"});
  credential.hasOne(organizer, { as: "organizer", foreignKey: "credential_id"});
  event_seat.belongsTo(event, { as: "event", foreignKey: "event_id"});
  event.hasMany(event_seat, { as: "event_seats", foreignKey: "event_id"});
  event.belongsTo(event_location, { as: "event_location", foreignKey: "event_location_id"});
  event_location.hasMany(event, { as: "events", foreignKey: "event_location_id"});
  section.belongsTo(event_location, { as: "event_location", foreignKey: "event_location_id"});
  event_location.hasMany(section, { as: "sections", foreignKey: "event_location_id"});
  reservation.belongsTo(event_seat, { as: "event_seat", foreignKey: "event_seat_id"});
  event_seat.hasMany(reservation, { as: "reservations", foreignKey: "event_seat_id"});
  ticket.belongsTo(event_seat, { as: "event_seat", foreignKey: "event_seat_id"});
  event_seat.hasOne(ticket, { as: "ticket", foreignKey: "event_seat_id"});
  event_seat.belongsTo(event_seat_status, { as: "event_seat_status", foreignKey: "event_seat_status_id"});
  event_seat_status.hasMany(event_seat, { as: "event_seats", foreignKey: "event_seat_status_id"});
  ticket.belongsTo(payment, { as: "payment", foreignKey: "payment_id"});
  payment.hasMany(ticket, { as: "tickets", foreignKey: "payment_id"});
  card.belongsTo(payment_method, { as: "payment_method", foreignKey: "payment_method_id"});
  payment_method.hasOne(card, { as: "card", foreignKey: "payment_method_id"});
  crypto_payment.belongsTo(payment_method, { as: "payment_method", foreignKey: "payment_method_id"});
  payment_method.hasOne(crypto_payment, { as: "crypto_payment", foreignKey: "payment_method_id"});
  payment.belongsTo(payment_method, { as: "payment_method", foreignKey: "payment_method_id"});
  payment_method.hasMany(payment, { as: "payments", foreignKey: "payment_method_id"});
  refund.belongsTo(refund_status, { as: "refund_status", foreignKey: "refund_status_id"});
  refund_status.hasMany(refund, { as: "refunds", foreignKey: "refund_status_id"});
  payment.belongsTo(reservation, { as: "reservation", foreignKey: "reservation_id"});
  reservation.hasMany(payment, { as: "payments", foreignKey: "reservation_id"});
  event_seat.belongsTo(seat, { as: "seat", foreignKey: "seat_id"});
  seat.hasMany(event_seat, { as: "event_seats", foreignKey: "seat_id"});
  seat.belongsTo(section, { as: "section", foreignKey: "section_id"});
  section.hasMany(seat, { as: "seats", foreignKey: "section_id"});
  refund.belongsTo(ticket, { as: "ticket", foreignKey: "ticket_id"});
  ticket.hasOne(refund, { as: "refund", foreignKey: "ticket_id"});
  ticket.belongsTo(ticket_status, { as: "ticket_status", foreignKey: "ticket_status_id"});
  ticket_status.hasMany(ticket, { as: "tickets", foreignKey: "ticket_status_id"});

  return {
    attendee,
    card,
    company,
    credential,
    crypto_payment,
    event,
    event_location,
    event_seat,
    event_seat_status,
    organizer,
    payment,
    payment_method,
    refund,
    refund_status,
    reservation,
    seat,
    section,
    ticket,
    ticket_status,
  };
}
