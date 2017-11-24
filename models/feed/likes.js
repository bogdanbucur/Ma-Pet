'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('feedLikes', {
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
        post_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'pets',
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
        tableName: 'feedLikes',
        paranoid: true,
        underscored: true
    });
};