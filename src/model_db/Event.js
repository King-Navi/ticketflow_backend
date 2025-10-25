import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Event extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    idEvent: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    idEventLocation: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'EventLocation',
        key: 'idEventLocation'
      }
    },
    idCompany: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Company',
        key: 'idCompany'
      }
    }
  }, {
    sequelize,
    tableName: 'Event',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "Event_pkey",
        unique: true,
        fields: [
          { name: "idEvent" },
        ]
      },
    ]
  });
  }
}
