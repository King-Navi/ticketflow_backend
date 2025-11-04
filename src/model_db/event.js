import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class event extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    event_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    event_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    event_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'company',
        key: 'company_id'
      }
    },
    event_location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'event_location',
        key: 'event_location_id'
      }
    },
    event_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'event_status',
        key: 'event_status_id'
      }
    }
  }, {
    sequelize,
    tableName: 'event',
    schema: 'public',
    hasTrigger: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "event_pkey",
        unique: true,
        fields: [
          { name: "event_id" },
        ]
      },
      {
        name: "idx_event_company_id",
        fields: [
          { name: "company_id" },
        ]
      },
      {
        name: "idx_event_event_location_id",
        fields: [
          { name: "event_location_id" },
        ]
      },
      {
        name: "idx_event_event_status_id",
        fields: [
          { name: "event_status_id" },
        ]
      },
    ]
  });
  }
}
