'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('user', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.STRING
        },
        fullName: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.STRING,
            required: true
        },
        email: {
            type: DataTypes.STRING,
            required: true
        },
        firstName: {
            type: DataTypes.STRING
        },
        lastName: {
            type: DataTypes.STRING
        },
        facebook_id: {
            type: DataTypes.STRING
        },
        gender: {
            type: DataTypes.STRING
        },
        dob: {
            type: DataTypes.DATEONLY
        },
        profilePicture: {
            type: DataTypes.STRING
        },
        credits: {
            type: DataTypes.FLOAT
        },
        phoneNumber: {
            type: DataTypes.INTEGER
        },
        address: {
            type: DataTypes.STRING
        },
        website: {
            type: DataTypes.STRING
        },
        city: {
            type: DataTypes.STRING
        },
        status: {
            type: DataTypes.STRING
        },
        selected_pet_id: {
            type: DataTypes.INTEGER
        },
        device_uuid: {
            type: DataTypes.STRING
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'user',
        paranoid: true,
        underscored: true
    });
};