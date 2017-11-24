'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fsBrands', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING
        },
        logo: {
            type: DataTypes.TEXT
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'fsBrands',
        paranoid: true,
        underscored: true
    });
};