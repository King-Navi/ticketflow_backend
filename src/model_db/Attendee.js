import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Attendee extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    idAttendee: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    middleName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    idCredential: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Credential',
        key: 'idCredential'
      },
      unique: "Attendee_idCredential_key"
    }
  }, {
    sequelize,
    tableName: 'Attendee',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "Attendee_idCredential_key",
        unique: true,
        fields: [
          { name: "idCredential" },
        ]
      },
      {
        name: "Attendee_pkey",
        unique: true,
        fields: [
          { name: "idAttendee" },
        ]
      },
    ]
  });
  }
}
