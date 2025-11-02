import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class attendee extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    attendee_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    middle_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    credential_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'credential',
        key: 'credential_id'
      },
      unique: "attendee_credential_id_key"
    }
  }, {
    sequelize,
    tableName: 'attendee',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "attendee_credential_id_key",
        unique: true,
        fields: [
          { name: "credential_id" },
        ]
      },
      {
        name: "attendee_pkey",
        unique: true,
        fields: [
          { name: "attendee_id" },
        ]
      },
      {
        name: "idx_attendee_credential_id",
        fields: [
          { name: "credential_id" },
        ]
      },
    ]
  });
  }
}
