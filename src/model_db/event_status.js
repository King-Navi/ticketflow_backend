import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class event_status extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    event_status_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "uq_event_status_code_ci"
    },
    description: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'event_status',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "event_status_pkey",
        unique: true,
        fields: [
          { name: "event_status_id" },
        ]
      },
      {
        name: "uq_event_status_code_ci",
        unique: true,
        fields: [
          { name: "code" },
        ]
      },
    ]
  });
  }
}
