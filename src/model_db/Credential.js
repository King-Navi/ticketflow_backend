import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Credential extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    idCredential: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "Credential_email_key"
    },
    nickname: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'Credential',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "Credential_email_key",
        unique: true,
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "Credential_pkey",
        unique: true,
        fields: [
          { name: "idCredential" },
        ]
      },
    ]
  });
  }
}
