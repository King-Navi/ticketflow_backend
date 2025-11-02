import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class event_seat_status extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    event_seat_status_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    status_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "event_seat_status_status_name_key"
    }
  }, {
    sequelize,
    tableName: 'event_seat_status',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "event_seat_status_pkey",
        unique: true,
        fields: [
          { name: "event_seat_status_id" },
        ]
      },
      {
        name: "event_seat_status_status_name_key",
        unique: true,
        fields: [
          { name: "status_name" },
        ]
      },
    ]
  });
  }
}
