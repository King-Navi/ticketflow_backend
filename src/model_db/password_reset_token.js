import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class password_reset_token extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    password_reset_token_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    credential_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'credential',
        key: 'credential_id'
      }
    },
    token_hash: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_ip: {
      type: DataTypes.INET,
      allowNull: true
    },
    created_ua: {
      type: DataTypes.STRING(300),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'password_reset_token',
    schema: 'public',
    hasTrigger: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "idx_password_reset_token_credential_active",
        fields: [
          { name: "credential_id" },
          { name: "expires_at" },
        ]
      },
      {
        name: "password_reset_token_pkey",
        unique: true,
        fields: [
          { name: "password_reset_token_id" },
        ]
      },
      {
        name: "uq_password_reset_token_hash",
        unique: true,
        fields: [
          { name: "token_hash" },
        ]
      },
    ]
  });
  }
}
