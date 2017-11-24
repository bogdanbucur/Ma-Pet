'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('lostAndFoundMedia', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        path: {
            type: DataTypes.STRING
        },
        ann_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'lostAndFound',
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
        tableName: 'lostAndFoundMedia',
        paranoid: true,
        underscored: true
    });
};