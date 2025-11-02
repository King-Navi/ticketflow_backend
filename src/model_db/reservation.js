import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class reservation extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    reservation_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    expiration_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "active"
    },
    attendee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'attendee',
        key: 'attendee_id'
      }
    },
    event_seat_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'event_seat',
        key: 'event_seat_id'
      }
    }
  }, {
    sequelize,
    tableName: 'reservation',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "idx_reservation_attendee_id",
        fields: [
          { name: "attendee_id" },
        ]
      },
      {
        name: "idx_reservation_event_seat_id",
        fields: [
          { name: "event_seat_id" },
        ]
      },
      {
        name: "reservation_pkey",
        unique: true,
        fields: [
          { name: "reservation_id" },
        ]
      },
    ]
  });
  }
}
