'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('species', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        custom: {
            type: DataTypes.INTEGER
        },
        active: {
            type: DataTypes.INTEGER
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'species',
        paranoid: true,
        underscored: true
    });
};