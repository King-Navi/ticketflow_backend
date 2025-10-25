import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class EventLocation extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    idEventLocation: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'EventLocation',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "EventLocation_pkey",
        unique: true,
        fields: [
          { name: "idEventLocation" },
        ]
      },
    ]
  });
  }
}
