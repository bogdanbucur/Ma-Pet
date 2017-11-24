'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('locations', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        longitude: {
            type: DataTypes.STRING
        },
        latitude: {
            type: DataTypes.STRING
        },
        distance: {
            type: DataTypes.DOUBLE
        },
        rating: {
            type: DataTypes.DOUBLE
        },
        rateCount: {
            type: DataTypes.INTEGER
        },
        views: {
            type: DataTypes.INTEGER
        },
        description: {
            type: DataTypes.STRING
        },
        address: {
            type: DataTypes.STRING
        },
        phoneNumber: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING
        },
        location_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'location_type',
                key: 'id'
            }
        },
        media: DataTypes.ARRAY(DataTypes.JSON),
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'locations',
        paranoid: true,
        underscored: true
    });
};