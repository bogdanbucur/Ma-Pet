'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('breeds', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        specie_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'species',
                key: 'id'
            }
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
        tableName: 'breeds',
        paranoid: true,
        underscored: true
    });
};