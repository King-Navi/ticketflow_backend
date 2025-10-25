import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _Attendee from  "./Attendee.js";
import _Company from  "./Company.js";
import _Credential from  "./Credential.js";
import _Event from  "./Event.js";
import _EventLocation from  "./EventLocation.js";
import _Organizer from  "./Organizer.js";
import _Payment from  "./Payment.js";
import _PaymentMethod from  "./PaymentMethod.js";
import _Refund from  "./Refund.js";
import _Reservation from  "./Reservation.js";
import _Seat from  "./Seat.js";
import _Ticket from  "./Ticket.js";

export default function initModels(sequelize) {
  const Attendee = _Attendee.init(sequelize, DataTypes);
  const Company = _Company.init(sequelize, DataTypes);
  const Credential = _Credential.init(sequelize, DataTypes);
  const Event = _Event.init(sequelize, DataTypes);
  const EventLocation = _EventLocation.init(sequelize, DataTypes);
  const Organizer = _Organizer.init(sequelize, DataTypes);
  const Payment = _Payment.init(sequelize, DataTypes);
  const PaymentMethod = _PaymentMethod.init(sequelize, DataTypes);
  const Refund = _Refund.init(sequelize, DataTypes);
  const Reservation = _Reservation.init(sequelize, DataTypes);
  const Seat = _Seat.init(sequelize, DataTypes);
  const Ticket = _Ticket.init(sequelize, DataTypes);

  PaymentMethod.belongsTo(Attendee, { as: "idAttendee_Attendee", foreignKey: "idAttendee"});
  Attendee.hasMany(PaymentMethod, { as: "PaymentMethods", foreignKey: "idAttendee"});
  Reservation.belongsTo(Attendee, { as: "idAttendee_Attendee", foreignKey: "idAttendee"});
  Attendee.hasMany(Reservation, { as: "Reservations", foreignKey: "idAttendee"});
  Event.belongsTo(Company, { as: "idCompany_Company", foreignKey: "idCompany"});
  Company.hasMany(Event, { as: "Events", foreignKey: "idCompany"});
  Organizer.belongsTo(Company, { as: "idCompany_Company", foreignKey: "idCompany"});
  Company.hasMany(Organizer, { as: "Organizers", foreignKey: "idCompany"});
  Attendee.belongsTo(Credential, { as: "idCredential_Credential", foreignKey: "idCredential"});
  Credential.hasOne(Attendee, { as: "Attendee", foreignKey: "idCredential"});
  Organizer.belongsTo(Credential, { as: "idCredential_Credential", foreignKey: "idCredential"});
  Credential.hasOne(Organizer, { as: "Organizer", foreignKey: "idCredential"});
  Seat.belongsTo(Event, { as: "idEvent_Event", foreignKey: "idEvent"});
  Event.hasMany(Seat, { as: "Seats", foreignKey: "idEvent"});
  Event.belongsTo(EventLocation, { as: "idEventLocation_EventLocation", foreignKey: "idEventLocation"});
  EventLocation.hasMany(Event, { as: "Events", foreignKey: "idEventLocation"});
  Seat.belongsTo(EventLocation, { as: "idEventLocation_EventLocation", foreignKey: "idEventLocation"});
  EventLocation.hasMany(Seat, { as: "Seats", foreignKey: "idEventLocation"});
  Ticket.belongsTo(Payment, { as: "idPayment_Payment", foreignKey: "idPayment"});
  Payment.hasMany(Ticket, { as: "Tickets", foreignKey: "idPayment"});
  Payment.belongsTo(PaymentMethod, { as: "idPaymentMethod_PaymentMethod", foreignKey: "idPaymentMethod"});
  PaymentMethod.hasMany(Payment, { as: "Payments", foreignKey: "idPaymentMethod"});
  Payment.belongsTo(Reservation, { as: "idReservation_Reservation", foreignKey: "idReservation"});
  Reservation.hasMany(Payment, { as: "Payments", foreignKey: "idReservation"});
  Ticket.belongsTo(Seat, { as: "idSeat_Seat", foreignKey: "idSeat"});
  Seat.hasMany(Ticket, { as: "Tickets", foreignKey: "idSeat"});
  Refund.belongsTo(Ticket, { as: "idTicket_Ticket", foreignKey: "idTicket"});
  Ticket.hasOne(Refund, { as: "Refund", foreignKey: "idTicket"});

  return {
    Attendee,
    Company,
    Credential,
    Event,
    EventLocation,
    Organizer,
    Payment,
    PaymentMethod,
    Refund,
    Reservation,
    Seat,
    Ticket,
  };
}
