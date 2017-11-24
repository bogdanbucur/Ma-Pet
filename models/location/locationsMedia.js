'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('locationsMedia', {
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
        location_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'locations',
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
        tableName: 'locationsMedia',
        paranoid: true,
        underscored: true
    });
};