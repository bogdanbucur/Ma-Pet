'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('mpSettings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        offerType: {
            type: DataTypes.STRING
        },
        offerPeriod: {
            type: DataTypes.STRING
        },
        credits: {
            type: DataTypes.DOUBLE
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'mpSettings',
        paranoid: true,
        underscored: true
    });
};