import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class ticket extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    ticket_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    category_label: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    seat_label: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    unit_price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    qr_code: {
      type: DataTypes.BLOB,
      allowNull: false
    },
    checked_in_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'payment',
        key: 'payment_id'
      }
    },
    ticket_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ticket_status',
        key: 'ticket_status_id'
      }
    },
    event_seat_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'event_seat',
        key: 'event_seat_id'
      },
      unique: "ticket_event_seat_id_key"
    }
  }, {
    sequelize,
    tableName: 'ticket',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "idx_ticket_event_seat_id",
        fields: [
          { name: "event_seat_id" },
        ]
      },
      {
        name: "idx_ticket_payment_id",
        fields: [
          { name: "payment_id" },
        ]
      },
      {
        name: "idx_ticket_ticket_status_id",
        fields: [
          { name: "ticket_status_id" },
        ]
      },
      {
        name: "ticket_event_seat_id_key",
        unique: true,
        fields: [
          { name: "event_seat_id" },
        ]
      },
      {
        name: "ticket_pkey",
        unique: true,
        fields: [
          { name: "ticket_id" },
        ]
      },
    ]
  });
  }
}
