import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Seat extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    idSeat: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    seatNo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    rowNo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    section: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    idEvent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Event',
        key: 'idEvent'
      }
    },
    idEventLocation: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'EventLocation',
        key: 'idEventLocation'
      }
    }
  }, {
    sequelize,
    tableName: 'Seat',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "Seat_pkey",
        unique: true,
        fields: [
          { name: "idSeat" },
        ]
      },
    ]
  });
  }
}
