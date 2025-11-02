import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class ticket_status extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    ticket_status_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    status_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "ticket_status_status_name_key"
    }
  }, {
    sequelize,
    tableName: 'ticket_status',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "ticket_status_pkey",
        unique: true,
        fields: [
          { name: "ticket_status_id" },
        ]
      },
      {
        name: "ticket_status_status_name_key",
        unique: true,
        fields: [
          { name: "status_name" },
        ]
      },
    ]
  });
  }
}
