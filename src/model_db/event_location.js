import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class event_location extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    event_location_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    venue_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    address_line1: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    address_line2: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'event_location',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "event_location_pkey",
        unique: true,
        fields: [
          { name: "event_location_id" },
        ]
      },
    ]
  });
  }
}
