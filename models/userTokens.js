'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('userTokens', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'user',
                key: 'id'
            }
        },
        device_uuid: {
            type: DataTypes.STRING
        },
        device_platform: {
            type: DataTypes.STRING
        },
        device_os: {
            type: DataTypes.STRING
        },
        token: {
            type: DataTypes.STRING
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'userTokens',
        paranoid: true,
        underscored: true
    });
};