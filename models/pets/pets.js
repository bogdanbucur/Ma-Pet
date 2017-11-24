'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('pets', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        owner_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'user',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        dob: {
            type: DataTypes.DATEONLY
        },
        gender: {
            type: DataTypes.STRING
        },
        weight: {
            type: DataTypes.STRING
        },
        breed_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'breeds',
                key: 'id'
            }
        },
        specie_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'species',
                key: 'id'
            }
        },
        placeOfBirth: {
            type: DataTypes.STRING
        },
        city: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        },
        profilePicture: {
            type: DataTypes.STRING
        },
        coverPicture: {
            type: DataTypes.STRING
        },
        thumbPicture: {
            type: DataTypes.STRING
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'pets',
        paranoid: true,
        underscored: true
    });
};