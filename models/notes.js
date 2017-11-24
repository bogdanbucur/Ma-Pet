'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('notes', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        pet_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'pets',
                key: 'id'
            }
        },
        content: {
            type: DataTypes.TEXT
        },
        date: {
            type: DataTypes.DATE
        },
        alarm: {
            type: DataTypes.BOOLEAN
        },
        repeat: {
            type: DataTypes.STRING,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'notes',
        paranoid: true,
        underscored: true
    });
};