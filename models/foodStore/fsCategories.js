'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fsCategories', {
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
        active: {
            type: DataTypes.BOOLEAN
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'fsCategories',
        paranoid: true,
        underscored: true
    });
};