import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class organizer extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    organizer_id: {
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
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'company',
        key: 'company_id'
      }
    },
    credential_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'credential',
        key: 'credential_id'
      },
      unique: "organizer_credential_id_key"
    }
  }, {
    sequelize,
    tableName: 'organizer',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "idx_organizer_company_id",
        fields: [
          { name: "company_id" },
        ]
      },
      {
        name: "idx_organizer_credential_id",
        fields: [
          { name: "credential_id" },
        ]
      },
      {
        name: "organizer_credential_id_key",
        unique: true,
        fields: [
          { name: "credential_id" },
        ]
      },
      {
        name: "organizer_pkey",
        unique: true,
        fields: [
          { name: "organizer_id" },
        ]
      },
    ]
  });
  }
}
