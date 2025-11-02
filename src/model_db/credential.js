import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class credential extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    credential_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "credential_email_key"
    },
    nickname: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "credential_nickname_key"
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'credential',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "credential_email_key",
        unique: true,
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "credential_nickname_key",
        unique: true,
        fields: [
          { name: "nickname" },
        ]
      },
      {
        name: "credential_pkey",
        unique: true,
        fields: [
          { name: "credential_id" },
        ]
      },
    ]
  });
  }
}
