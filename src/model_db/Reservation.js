import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Reservation extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    idReservation: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    expiration: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    idAttendee: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Attendee',
        key: 'idAttendee'
      }
    }
  }, {
    sequelize,
    tableName: 'Reservation',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "Reservation_pkey",
        unique: true,
        fields: [
          { name: "idReservation" },
        ]
      },
    ]
  });
  }
}
