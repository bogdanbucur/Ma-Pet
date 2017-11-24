'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('locationComments', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        location_id:{
            type: DataTypes.INTEGER,
            references: {
                model: 'locations',
                key: 'id'
            }
        },
        pet_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'pets',
                key: 'id'
            }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'locationComments',
        paranoid: true,
        underscored: true
    });
};