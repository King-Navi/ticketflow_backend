import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Organizer extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    idOrganizer: {
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
    idCompany: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Company',
        key: 'idCompany'
      }
    },
    idCredential: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Credential',
        key: 'idCredential'
      },
      unique: "Organizer_idCredential_key"
    }
  }, {
    sequelize,
    tableName: 'Organizer',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "Organizer_idCredential_key",
        unique: true,
        fields: [
          { name: "idCredential" },
        ]
      },
      {
        name: "Organizer_pkey",
        unique: true,
        fields: [
          { name: "idOrganizer" },
        ]
      },
    ]
  });
  }
}
