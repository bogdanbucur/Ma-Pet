'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('mpMedia', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        path: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING
        },
        mpAd_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'mpAds',
                key: 'id'
            }
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'mpMedia',
        paranoid: true,
        underscored: true
    });
};