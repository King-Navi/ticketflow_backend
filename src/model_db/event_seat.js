import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class event_seat extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    event_seat_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'event',
        key: 'event_id'
      },
      unique: "event_seat_event_id_seat_id_key"
    },
    seat_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'seat',
        key: 'seat_id'
      },
      unique: "event_seat_event_id_seat_id_key"
    },
    base_price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    event_seat_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'event_seat_status',
        key: 'event_seat_status_id'
      }
    }
  }, {
    sequelize,
    tableName: 'event_seat',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "event_seat_event_id_seat_id_key",
        unique: true,
        fields: [
          { name: "event_id" },
          { name: "seat_id" },
        ]
      },
      {
        name: "event_seat_pkey",
        unique: true,
        fields: [
          { name: "event_seat_id" },
        ]
      },
      {
        name: "idx_event_seat_event_id",
        fields: [
          { name: "event_id" },
        ]
      },
      {
        name: "idx_event_seat_seat_id",
        fields: [
          { name: "seat_id" },
        ]
      },
      {
        name: "idx_event_seat_status_id",
        fields: [
          { name: "event_seat_status_id" },
        ]
      },
    ]
  });
  }
}
